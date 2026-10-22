-- Elanmist — customer accounts and orders.
-- Paste into Supabase → SQL Editor → New query → Run. Safe to run again.
--
-- Security model:
--   * The website's server writes orders with the secret (service_role) key, which
--     bypasses Row Level Security. Browsers never write orders.
--   * Logged-in customers can only READ their own rows: orders linked to their account,
--     or placed with the same email / mobile before they signed up.

-- ─── Customers (one row per login) ────────────────────────────────────────────
create table if not exists public.customers (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  phone       text,
  name        text,
  address1    text,
  address2    text,
  city        text,
  state       text,
  pincode     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Orders (one row per checkout, updated as payment and delivery progress) ──
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  order_no             text not null unique,            -- EM-XXXXXXXX-XXXXXX (Razorpay receipt)
  user_id              uuid references auth.users (id) on delete set null,
  status               text not null default 'awaiting_payment'
                         check (status in ('awaiting_payment', 'paid', 'payment_failed', 'refunded', 'cancelled')),
  email                text not null,
  phone                text not null,                   -- 10 digits, no +91
  name                 text not null,
  address1             text not null,
  address2             text,
  city                 text not null,
  state                text not null,
  pincode              text not null,
  subtotal             integer not null,                -- rupees
  shipping             integer not null default 0,
  total                integer not null,
  razorpay_order_id    text unique,
  payment_id           text,
  payment_method       text,
  shiprocket_order_id  text,
  shipment_status      text,
  courier              text,
  awb                  text,
  tracking_url         text,
  created_at           timestamptz not null default now(),
  paid_at              timestamptz,
  updated_at           timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_email_idx   on public.orders (lower(email));
create index if not exists orders_phone_idx   on public.orders (phone);

create table if not exists public.order_items (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  slug        text not null,
  name        text not null,
  qty         integer not null check (qty > 0),
  unit_price  integer not null,
  line_total  integer not null
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ─── Keep updated_at current ──────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ─── Helpers: the logged-in user's email and 10-digit mobile ──────────────────
create or replace function public.current_email()
returns text language sql stable as $$
  select nullif(lower(auth.jwt() ->> 'email'), '')
$$;

create or replace function public.current_phone()
returns text language sql stable as $$
  select nullif(right(regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '\D', '', 'g'), 10), '')
$$;

-- ─── New login → customer row, and claim earlier guest orders ─────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_phone text := nullif(right(regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'), 10), '');
begin
  insert into public.customers (id, email, phone)
  values (new.id, lower(new.email), user_phone)
  on conflict (id) do nothing;

  update public.orders
     set user_id = new.id
   where user_id is null
     and ((new.email is not null and lower(email) = lower(new.email))
       or (user_phone is not null and phone = user_phone));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.customers   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "customers read own"   on public.customers;
drop policy if exists "customers update own" on public.customers;
create policy "customers read own"   on public.customers for select to authenticated using (id = auth.uid());
create policy "customers update own" on public.customers for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "orders read own" on public.orders;
create policy "orders read own" on public.orders for select to authenticated using (
  user_id = auth.uid()
  or lower(email) = public.current_email()
  or phone = public.current_phone()
);

drop policy if exists "order items read own" on public.order_items;
create policy "order items read own" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id)  -- the orders policy above applies here too
);

-- Customers never insert or delete through the browser; only the server (service_role) does.
revoke insert, delete on public.customers   from anon, authenticated;
revoke insert, update, delete on public.orders      from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
revoke all on public.customers, public.orders, public.order_items from anon;

-- ═══ Referral codes ══════════════════════════════════════════════════════════
-- Every paid order (not itself paid with a referral) gets one code to share.
-- A friend's order with the code gets one unit free and pays delivery. Rules:
--   * one use per code (reserved while the payment is open, released after 30 min)
--   * the owner can't use their own code (same email, mobile or address)
--   * one referral per person (same email, mobile or address)
-- Only the website's server (service_role) can read or change these tables.

create table if not exists public.referral_codes (
  code                     text primary key,
  owner_order_no           text not null unique,
  owner_email              text not null,
  owner_phone              text not null,
  owner_address_key        text,
  status                   text not null default 'active' check (status in ('active', 'reserved', 'used', 'disabled')),
  reserved_order_no        text,
  reserved_until           timestamptz,
  redeemer_email           text,
  redeemer_phone           text,
  redeemer_address_key     text,
  used_order_no            text unique,
  used_at                  timestamptz,
  created_at               timestamptz not null default now()
);

create index if not exists referral_redeemer_email_idx   on public.referral_codes (redeemer_email);
create index if not exists referral_redeemer_phone_idx   on public.referral_codes (redeemer_phone);
create index if not exists referral_redeemer_address_idx on public.referral_codes (redeemer_address_key);

alter table public.referral_codes enable row level security;  -- no policies: server only
revoke all on public.referral_codes from anon, authenticated;

-- Shared rule check. Returns 'ok' or the reason the code can't be used.
create or replace function public.referral_problem(
  r public.referral_codes, p_email text, p_phone text, p_address_key text
) returns text language plpgsql stable as $$
begin
  if r.code is null or r.status = 'disabled' then
    return 'invalid';
  end if;
  if r.owner_email = p_email or r.owner_phone = p_phone
     or (p_address_key is not null and r.owner_address_key = p_address_key) then
    return 'own_code';
  end if;
  if r.status = 'used'
     or (r.status = 'reserved' and r.reserved_until > now() and r.redeemer_phone is distinct from p_phone) then
    return 'used';
  end if;
  if exists (
    select 1 from public.referral_codes o
     where o.code <> r.code
       and (o.status = 'used' or (o.status = 'reserved' and o.reserved_until > now()))
       and (o.redeemer_email = p_email or o.redeemer_phone = p_phone
            or (p_address_key is not null and o.redeemer_address_key = p_address_key))
  ) then
    return 'already_redeemed';
  end if;
  return 'ok';
end $$;

-- Read-only check for the checkout "Apply" button.
create or replace function public.check_referral(p_code text, p_email text, p_phone text, p_address_key text)
returns text language plpgsql stable as $$
declare r public.referral_codes;
begin
  select * into r from public.referral_codes where code = upper(p_code);
  return public.referral_problem(r, lower(p_email), p_phone, p_address_key);
end $$;

-- Atomically holds the code for one order while the shopper pays.
create or replace function public.reserve_referral(
  p_code text, p_order_no text, p_email text, p_phone text, p_address_key text
) returns text language plpgsql as $$
declare
  r public.referral_codes;
  problem text;
begin
  select * into r from public.referral_codes where code = upper(p_code) for update;
  problem := public.referral_problem(r, lower(p_email), p_phone, p_address_key);
  if problem <> 'ok' then
    return problem;
  end if;
  update public.referral_codes
     set status = 'reserved',
         reserved_order_no = p_order_no,
         reserved_until = now() + interval '30 minutes',
         redeemer_email = lower(p_email),
         redeemer_phone = p_phone,
         redeemer_address_key = p_address_key
   where code = r.code;
  return 'ok';
end $$;

-- Marks the code used once that order is paid. Safe to call repeatedly.
create or replace function public.confirm_referral(p_code text, p_order_no text)
returns text language plpgsql as $$
declare r public.referral_codes;
begin
  select * into r from public.referral_codes where code = upper(p_code) for update;
  if r.code is null then return 'invalid'; end if;
  if r.used_order_no = p_order_no then return 'ok'; end if;
  if r.status = 'used' then return 'conflict'; end if;   -- paid after someone else used it
  update public.referral_codes
     set status = 'used', used_order_no = p_order_no, used_at = now(), reserved_until = null
   where code = r.code;
  return case when r.reserved_order_no = p_order_no then 'ok' else 'late' end;
end $$;

-- Creates (or returns) the shareable code for a paid order.
create or replace function public.issue_referral_code(
  p_code text, p_owner_order_no text, p_email text, p_phone text, p_address_key text
) returns text language plpgsql as $$
declare existing text;
begin
  select code into existing from public.referral_codes where owner_order_no = p_owner_order_no;
  if existing is not null then return existing; end if;
  insert into public.referral_codes (code, owner_order_no, owner_email, owner_phone, owner_address_key)
  values (upper(p_code), p_owner_order_no, lower(p_email), p_phone, p_address_key)
  on conflict (owner_order_no) do nothing;
  select code into existing from public.referral_codes where owner_order_no = p_owner_order_no;
  return existing;
end $$;

-- Functions in the public schema are callable through the API by default; only the server may.
revoke execute on function public.referral_problem(public.referral_codes, text, text, text) from public, anon, authenticated;
revoke execute on function public.check_referral(text, text, text, text)               from public, anon, authenticated;
revoke execute on function public.reserve_referral(text, text, text, text, text)       from public, anon, authenticated;
revoke execute on function public.confirm_referral(text, text)                          from public, anon, authenticated;
revoke execute on function public.issue_referral_code(text, text, text, text, text)    from public, anon, authenticated;
grant  execute on function public.check_referral(text, text, text, text)               to service_role;
grant  execute on function public.reserve_referral(text, text, text, text, text)       to service_role;
grant  execute on function public.confirm_referral(text, text)                          to service_role;
grant  execute on function public.issue_referral_code(text, text, text, text, text)    to service_role;
grant  execute on function public.referral_problem(public.referral_codes, text, text, text) to service_role;
