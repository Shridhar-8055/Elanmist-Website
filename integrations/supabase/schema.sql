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

-- ═══ Orders mirror (written by the website on every checkout / payment / delivery event) ═══
alter table public.orders add column if not exists discount           integer not null default 0;
alter table public.orders add column if not exists referral_code_used text;
alter table public.orders add column if not exists coupon_code_used   text;
alter table public.orders add column if not exists own_referral_code  text;
alter table public.orders add column if not exists notes              text;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('awaiting_payment', 'payment_setup_failed', 'paid', 'payment_failed', 'refunded', 'cancelled'));
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);

-- Creates or updates one order from a partial set of fields (column names as keys).
-- 'paid' and 'refunded' are final: a late "failed" event never downgrades them.
create or replace function public.record_order(p_order_no text, p_data jsonb, p_items jsonb default null)
returns void language plpgsql as $$
declare
  cur public.orders;
  st  text := nullif(p_data ->> 'status', '');
  num jsonb := '{}'::jsonb;
begin
  insert into public.orders (order_no, status, email, phone, name, address1, city, state, pincode, subtotal, total)
  values (p_order_no, coalesce(st, 'awaiting_payment'), '', '', '', '', '', '', '', 0, 0)
  on conflict (order_no) do nothing;
  select * into cur from public.orders where order_no = p_order_no for update;

  if st is not null and cur.status in ('paid', 'refunded') and st <> 'refunded' then
    st := null;
  end if;

  update public.orders o set
    status              = coalesce(st, o.status),
    paid_at             = case when coalesce(st, o.status) = 'paid' and o.paid_at is null then now() else o.paid_at end,
    email               = coalesce(nullif(lower(p_data ->> 'email'), ''), o.email),
    phone               = coalesce(nullif(p_data ->> 'phone', ''), o.phone),
    name                = coalesce(nullif(p_data ->> 'name', ''), o.name),
    address1            = coalesce(nullif(p_data ->> 'address1', ''), o.address1),
    address2            = coalesce(nullif(p_data ->> 'address2', ''), o.address2),
    city                = coalesce(nullif(p_data ->> 'city', ''), o.city),
    state               = coalesce(nullif(p_data ->> 'state', ''), o.state),
    pincode             = coalesce(nullif(p_data ->> 'pincode', ''), o.pincode),
    subtotal            = coalesce((p_data ->> 'subtotal')::numeric::int, o.subtotal),
    shipping            = coalesce((p_data ->> 'shipping')::numeric::int, o.shipping),
    discount            = coalesce((p_data ->> 'discount')::numeric::int, o.discount),
    total               = coalesce((p_data ->> 'total')::numeric::int, o.total),
    razorpay_order_id   = coalesce(nullif(p_data ->> 'razorpay_order_id', ''), o.razorpay_order_id),
    payment_id          = coalesce(nullif(p_data ->> 'payment_id', ''), o.payment_id),
    payment_method      = coalesce(nullif(p_data ->> 'payment_method', ''), o.payment_method),
    notes               = coalesce(nullif(p_data ->> 'notes', ''), o.notes),
    shiprocket_order_id = coalesce(nullif(p_data ->> 'shiprocket_order_id', ''), o.shiprocket_order_id),
    shipment_status     = coalesce(nullif(p_data ->> 'shipment_status', ''), o.shipment_status),
    courier             = coalesce(nullif(p_data ->> 'courier', ''), o.courier),
    awb                 = coalesce(nullif(p_data ->> 'awb', ''), o.awb),
    tracking_url        = coalesce(nullif(p_data ->> 'tracking_url', ''), o.tracking_url),
    referral_code_used  = coalesce(nullif(p_data ->> 'referral_code_used', ''), o.referral_code_used),
    coupon_code_used    = coalesce(nullif(p_data ->> 'coupon_code_used', ''), o.coupon_code_used),
    own_referral_code   = coalesce(nullif(p_data ->> 'own_referral_code', ''), o.own_referral_code)
  where o.id = cur.id;

  if p_items is not null and jsonb_array_length(p_items) > 0
     and not exists (select 1 from public.order_items where order_id = cur.id) then
    insert into public.order_items (order_id, slug, name, qty, unit_price, line_total)
    select cur.id, i ->> 'slug', i ->> 'name', (i ->> 'qty')::int, (i ->> 'unitPrice')::int, (i ->> 'lineTotal')::int
      from jsonb_array_elements(p_items) i;
  end if;
end $$;

-- ═══ Admin coupons ════════════════════════════════════════════════════════════
-- Created in the admin dashboard. Kinds: one product free, % off, ₹ off, free delivery.
-- Optionally assigned to one customer (email and/or mobile), with use limits and dates.
create table if not exists public.coupons (
  code            text primary key check (code ~ '^[A-Z0-9]{4,20}$' and code !~ '^ELAN'),
  description     text,
  kind            text not null check (kind in ('free_product', 'percent', 'flat', 'free_shipping')),
  value           integer not null default 0,
  min_order       integer not null default 0 check (min_order >= 0),
  max_uses        integer check (max_uses is null or max_uses > 0),
  per_customer    integer not null default 1 check (per_customer > 0),
  assigned_name   text,
  assigned_email  text,
  assigned_phone  text,
  starts_at       timestamptz,
  expires_at      timestamptz,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint coupons_percent_range check (kind <> 'percent' or value between 1 and 100),
  constraint coupons_flat_positive check (kind <> 'flat' or value > 0)
);

create table if not exists public.coupon_redemptions (
  id              bigint generated always as identity primary key,
  code            text not null references public.coupons (code) on delete cascade,
  order_no        text not null unique,
  email           text not null,
  phone           text not null,
  status          text not null default 'reserved' check (status in ('reserved', 'used')),
  reserved_until  timestamptz,
  created_at      timestamptz not null default now(),
  used_at         timestamptz
);
create index if not exists coupon_redemptions_code_idx  on public.coupon_redemptions (code);
create index if not exists coupon_redemptions_phone_idx on public.coupon_redemptions (phone);

alter table public.coupons            enable row level security;
alter table public.coupon_redemptions enable row level security;
revoke all on public.coupons, public.coupon_redemptions from anon, authenticated;

create or replace function public.coupon_problem(c public.coupons, p_email text, p_phone text, p_subtotal int)
returns text language plpgsql stable as $$
declare
  used_total int;
  used_by_me int;
begin
  if c.code is null then return 'invalid'; end if;
  if not c.active then return 'inactive'; end if;
  if c.starts_at is not null and c.starts_at > now() then return 'not_started'; end if;
  if c.expires_at is not null and c.expires_at <= now() then return 'expired'; end if;
  if (c.assigned_email is not null or c.assigned_phone is not null)
     and not (coalesce(c.assigned_email = p_email, false) or coalesce(c.assigned_phone = p_phone, false)) then
    return 'not_for_you';
  end if;
  if p_subtotal < c.min_order then return 'min_order'; end if;
  -- Live uses: paid, or held for a payment in progress. Your own open hold doesn't block a retry.
  select count(*), count(*) filter (where r.phone = p_phone or r.email = p_email)
    into used_total, used_by_me
    from public.coupon_redemptions r
   where r.code = c.code
     and (r.status = 'used' or r.reserved_until > now())
     and not (r.status = 'reserved' and r.phone = p_phone);
  if c.max_uses is not null and used_total >= c.max_uses then return 'used_up'; end if;
  if used_by_me >= c.per_customer then return 'already_used'; end if;
  return 'ok';
end $$;

create or replace function public.check_coupon(p_code text, p_email text, p_phone text, p_subtotal int)
returns jsonb language plpgsql stable as $$
declare c public.coupons;
begin
  select * into c from public.coupons where code = upper(p_code);
  return jsonb_build_object('result', public.coupon_problem(c, lower(p_email), p_phone, p_subtotal),
                            'kind', c.kind, 'value', c.value, 'min_order', c.min_order, 'description', c.description);
end $$;

create or replace function public.reserve_coupon(p_code text, p_order_no text, p_email text, p_phone text, p_subtotal int)
returns jsonb language plpgsql as $$
declare
  c public.coupons;
  problem text;
  mine bigint;
begin
  select * into c from public.coupons where code = upper(p_code) for update;
  problem := public.coupon_problem(c, lower(p_email), p_phone, p_subtotal);
  if problem <> 'ok' then
    return jsonb_build_object('result', problem, 'min_order', c.min_order);
  end if;
  select id into mine from public.coupon_redemptions
   where code = c.code and status = 'reserved' and reserved_until > now() and phone = p_phone
   limit 1;
  if mine is not null then
    update public.coupon_redemptions
       set order_no = p_order_no, email = lower(p_email), reserved_until = now() + interval '30 minutes'
     where id = mine;
  else
    insert into public.coupon_redemptions (code, order_no, email, phone, reserved_until)
    values (c.code, p_order_no, lower(p_email), p_phone, now() + interval '30 minutes');
  end if;
  return jsonb_build_object('result', 'ok', 'kind', c.kind, 'value', c.value);
end $$;

create or replace function public.confirm_coupon(p_code text, p_order_no text, p_email text, p_phone text)
returns text language plpgsql as $$
declare n int;
begin
  update public.coupon_redemptions
     set status = 'used', used_at = coalesce(used_at, now()), reserved_until = null
   where order_no = p_order_no;
  get diagnostics n = row_count;
  if n > 0 then return 'ok'; end if;
  -- The hold was moved to a newer attempt; this older order was still paid. Record it.
  insert into public.coupon_redemptions (code, order_no, email, phone, status, used_at)
  select upper(p_code), p_order_no, lower(p_email), p_phone, 'used', now()
   where exists (select 1 from public.coupons where code = upper(p_code))
  on conflict (order_no) do nothing;
  return 'late';
end $$;

-- ═══ Admin dashboard (read and manage; server only) ═══════════════════════════
create or replace function public.admin_overview(p_days int default 30)
returns jsonb language sql stable as $$
  with since as (select date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata' - make_interval(days => p_days - 1) as t),
  paid as (select * from public.orders where status = 'paid'),
  paid_in as (select * from paid where paid_at >= (select t from since)),
  today as (select * from paid where paid_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata')
  select jsonb_build_object(
    'days', p_days,
    'revenue', coalesce((select sum(total) from paid_in), 0),
    'orders', (select count(*) from paid_in),
    'avg_order', coalesce((select round(avg(total)) from paid_in), 0),
    'discount_given', coalesce((select sum(discount) from paid_in), 0),
    'today_revenue', coalesce((select sum(total) from today), 0),
    'today_orders', (select count(*) from today),
    'all_time_revenue', coalesce((select sum(total) from paid), 0),
    'all_time_orders', (select count(*) from paid),
    'customers', (select count(distinct phone) from paid where phone <> ''),
    'abandoned', (select count(*) from public.orders
                   where status in ('awaiting_payment', 'payment_failed') and created_at >= (select t from since)
                     and created_at < now() - interval '30 minutes'),
    'to_dispatch', (select count(*) from paid where awb is null and coalesce(shipment_status, '') not ilike '%cancel%'),
    'needs_attention', (select count(*) from paid
                         where shipment_status ilike 'create manually%' or shipment_status ilike 'setup incomplete%'),
    'delivered', (select count(*) from paid where shipment_status ilike 'delivered%'),
    'in_transit', (select count(*) from paid where awb is not null and coalesce(shipment_status, '') not ilike 'delivered%'),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'revenue', coalesce(x.revenue, 0), 'orders', coalesce(x.orders, 0)) order by d), '[]'::jsonb)
                from generate_series((select t from since) at time zone 'Asia/Kolkata', (now() at time zone 'Asia/Kolkata'), interval '1 day') d
                left join (select (paid_at at time zone 'Asia/Kolkata')::date as day, sum(total) as revenue, count(*) as orders
                             from paid_in group by 1) x on x.day = d::date),
    'top_products', (select coalesce(jsonb_agg(t order by t.units desc), '[]'::jsonb) from (
                      select i.slug, i.name, sum(i.qty)::int as units, sum(i.line_total)::int as revenue
                        from public.order_items i join paid_in o on o.id = i.order_id
                       group by i.slug, i.name) t),
    'referrals', jsonb_build_object(
        'issued', (select count(*) from public.referral_codes),
        'used', (select count(*) from public.referral_codes where status = 'used'),
        'used_in_range', (select count(*) from paid_in where referral_code_used is not null)),
    'coupons', jsonb_build_object(
        'active', (select count(*) from public.coupons where active and (expires_at is null or expires_at > now())),
        'used', (select count(*) from public.coupon_redemptions where status = 'used'),
        'used_in_range', (select count(*) from paid_in where coupon_code_used is not null)),
    'recent', (select coalesce(jsonb_agg(r order by r.created_at desc), '[]'::jsonb) from (
                 select order_no, name, city, total, status, shipment_status, created_at
                   from public.orders order by created_at desc limit 8) r)
  )
$$;

create or replace function public.admin_orders(p_status text default null, p_search text default null, p_limit int default 25, p_offset int default 0)
returns jsonb language sql stable as $$
  with f as (
    select * from public.orders o
     where (p_status is null or p_status = ''
            or (p_status = 'to_dispatch' and o.status = 'paid' and o.awb is null)
            or (p_status = 'abandoned' and o.status in ('awaiting_payment', 'payment_failed', 'payment_setup_failed'))
            or (p_status = 'attention' and o.status = 'paid' and (o.shipment_status ilike 'create manually%' or o.shipment_status ilike 'setup incomplete%'))
            or o.status = p_status)
       and (p_search is null or p_search = ''
            or o.order_no ilike '%' || p_search || '%' or o.name ilike '%' || p_search || '%'
            or o.email ilike '%' || p_search || '%' or o.phone like '%' || p_search || '%'
            or o.awb ilike '%' || p_search || '%')
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'rows', (select coalesce(jsonb_agg(r order by r.created_at desc), '[]'::jsonb) from (
               select f.order_no, f.name, f.phone, f.city, f.total, f.discount, f.status, f.shipment_status, f.courier, f.awb,
                      f.referral_code_used, f.coupon_code_used, f.created_at, f.paid_at,
                      (select string_agg(i.name || ' ×' || i.qty, ', ') from public.order_items i where i.order_id = f.id) as items
                 from f order by f.created_at desc limit p_limit offset p_offset) r)
  )
$$;

create or replace function public.admin_order(p_order_no text)
returns jsonb language sql stable as $$
  select case when o.id is null then null else jsonb_build_object(
    'order', to_jsonb(o) - 'user_id',
    'items', (select coalesce(jsonb_agg(to_jsonb(i) - 'order_id' - 'id' order by i.id), '[]'::jsonb) from public.order_items i where i.order_id = o.id),
    'previous_orders', (select count(*) from public.orders p where p.phone = o.phone and p.status = 'paid' and p.order_no <> o.order_no)
  ) end
  from (select 1) one left join public.orders o on o.order_no = p_order_no
$$;

create or replace function public.admin_customers(p_search text default null, p_limit int default 50, p_offset int default 0)
returns jsonb language sql stable as $$
  with c as (
    select o.phone,
           (array_agg(o.name order by o.created_at desc))[1] as name,
           (array_agg(o.email order by o.created_at desc))[1] as email,
           (array_agg(o.city order by o.created_at desc))[1] as city,
           count(*) filter (where o.status = 'paid') as orders,
           coalesce(sum(o.total) filter (where o.status = 'paid'), 0) as spent,
           count(*) filter (where o.status <> 'paid') as unpaid_attempts,
           min(o.created_at) as first_seen,
           max(o.created_at) as last_seen
      from public.orders o
     where o.phone <> ''
     group by o.phone
  ), f as (
    select * from c
     where p_search is null or p_search = ''
        or c.name ilike '%' || p_search || '%' or c.email ilike '%' || p_search || '%' or c.phone like '%' || p_search || '%'
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'rows', (select coalesce(jsonb_agg(r order by r.last_seen desc), '[]'::jsonb) from (
               select * from f order by last_seen desc limit p_limit offset p_offset) r)
  )
$$;

create or replace function public.admin_coupons()
returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
    select c.*,
           (select count(*) from public.coupon_redemptions r where r.code = c.code and r.status = 'used') as used,
           (select count(*) from public.coupon_redemptions r where r.code = c.code and r.status = 'reserved' and r.reserved_until > now()) as in_checkout,
           (select coalesce(jsonb_agg(jsonb_build_object('order_no', r.order_no, 'phone', r.phone, 'email', r.email, 'used_at', r.used_at) order by r.used_at desc), '[]'::jsonb)
              from public.coupon_redemptions r where r.code = c.code and r.status = 'used') as redemptions
      from public.coupons c) x
$$;

create or replace function public.admin_create_coupon(p jsonb)
returns text language plpgsql as $$
begin
  insert into public.coupons (code, description, kind, value, min_order, max_uses, per_customer,
                              assigned_name, assigned_email, assigned_phone, starts_at, expires_at)
  values (upper(p ->> 'code'), nullif(p ->> 'description', ''), p ->> 'kind',
          coalesce((p ->> 'value')::int, 0), coalesce((p ->> 'min_order')::int, 0),
          nullif(p ->> 'max_uses', '')::int, coalesce(nullif(p ->> 'per_customer', '')::int, 1),
          nullif(p ->> 'assigned_name', ''), nullif(lower(p ->> 'assigned_email'), ''), nullif(p ->> 'assigned_phone', ''),
          nullif(p ->> 'starts_at', '')::timestamptz, nullif(p ->> 'expires_at', '')::timestamptz);
  return 'ok';
exception
  when unique_violation then return 'exists';
  when check_violation then return 'invalid';
end $$;

create or replace function public.admin_set_coupon_active(p_code text, p_active boolean)
returns void language sql as $$
  update public.coupons set active = p_active where code = upper(p_code)
$$;

create or replace function public.admin_delete_coupon(p_code text)
returns text language plpgsql as $$
begin
  if exists (select 1 from public.coupon_redemptions where code = upper(p_code)) then
    return 'has_uses';   -- keep the history; switch it off instead
  end if;
  delete from public.coupons where code = upper(p_code);
  return 'ok';
end $$;

create or replace function public.admin_referrals(p_status text default null, p_search text default null, p_limit int default 50, p_offset int default 0)
returns jsonb language sql stable as $$
  with f as (
    select r.*, o.name as owner_name, u.name as used_by_name
      from public.referral_codes r
      left join public.orders o on o.order_no = r.owner_order_no
      left join public.orders u on u.order_no = r.used_order_no
     where (p_status is null or p_status = '' or r.status = p_status)
       and (p_search is null or p_search = '' or r.code ilike '%' || p_search || '%'
            or r.owner_phone like '%' || p_search || '%' or r.owner_email ilike '%' || p_search || '%'
            or o.name ilike '%' || p_search || '%')
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'rows', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
               select * from f order by created_at desc limit p_limit offset p_offset) x)
  )
$$;

create or replace function public.admin_set_referral_disabled(p_code text, p_disabled boolean)
returns text language plpgsql as $$
declare r public.referral_codes;
begin
  select * into r from public.referral_codes where code = upper(p_code) for update;
  if r.code is null then return 'invalid'; end if;
  if r.status = 'used' then return 'used'; end if;
  update public.referral_codes
     set status = case when p_disabled then 'disabled' else 'active' end,
         reserved_order_no = null, reserved_until = null
   where code = r.code;
  return 'ok';
end $$;

-- Lock every function above to the server (service_role) only.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('record_order', 'coupon_problem', 'check_coupon', 'reserve_coupon', 'confirm_coupon',
                         'admin_overview', 'admin_orders', 'admin_order', 'admin_customers', 'admin_coupons',
                         'admin_create_coupon', 'admin_set_coupon_active', 'admin_delete_coupon',
                         'admin_referrals', 'admin_set_referral_disabled')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;
