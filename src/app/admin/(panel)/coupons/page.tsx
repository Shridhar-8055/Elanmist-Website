import type { Metadata } from "next";
import { getCoupons, getCustomers, type Coupon } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseConfigured } from "@/lib/supabase-admin";
import { deleteCouponAction, toggleCouponAction } from "../../actions";
import { Card, Empty, inr, NotConnected, PageHeader, when } from "../../ui";
import { CouponForm } from "./CouponForm";

export const metadata: Metadata = { title: "Coupons" };

function gives(c: Coupon) {
  switch (c.kind) {
    case "free_product":
      return "1 product free";
    case "percent":
      return `${c.value}% off`;
    case "flat":
      return `${inr(c.value)} off`;
    case "free_shipping":
      return "Free delivery";
  }
}

function state(c: Coupon) {
  const now = Date.now();
  if (!c.active) return { label: "Off", tone: "bg-slate-100 text-slate-700" };
  if (c.expires_at && Date.parse(c.expires_at) <= now) return { label: "Expired", tone: "bg-slate-100 text-slate-700" };
  if (c.starts_at && Date.parse(c.starts_at) > now) return { label: "Scheduled", tone: "bg-sky-50 text-sky-800" };
  if (c.max_uses && c.used >= c.max_uses) return { label: "Used up", tone: "bg-slate-100 text-slate-700" };
  return { label: "Active", tone: "bg-emerald-50 text-emerald-800" };
}

function whatsappLink(c: Coupon) {
  if (!c.assigned_phone) return null;
  const hi = c.assigned_name ? `Hi ${c.assigned_name.split(" ")[0]}! ` : "Hi! ";
  const text = `${hi}Here's a special Elanmist coupon just for you: ${c.code} (${gives(c)}). Use it at checkout on elanmist.com with this mobile number.`;
  return `https://wa.me/91${c.assigned_phone}?text=${encodeURIComponent(text)}`;
}

export default async function CouponsPage({ searchParams }: PageProps<"/admin/coupons">) {
  await requireAdmin();
  if (!supabaseConfigured()) return <NotConnected />;
  const sp = await searchParams;
  const prefill = {
    phone: typeof sp.phone === "string" ? sp.phone : "",
    email: typeof sp.email === "string" ? sp.email : "",
    name: typeof sp.name === "string" ? sp.name : "",
  };
  const [coupons, customers] = await Promise.all([getCoupons(), getCustomers("", 300, 0)]);

  return (
    <>
      <PageHeader
        title="Coupons"
        subtitle="Create codes for everyone or for one customer. Customers enter them in the same box as referral codes at checkout."
      />

      <Card className="scroll-mt-24">
        <div id="new" />
        <h2 className="text-base font-bold">New coupon</h2>
        <CouponForm
          prefill={prefill}
          customers={customers.rows.map((c) => ({ phone: c.phone, name: c.name, email: c.email, orders: c.orders }))}
        />
      </Card>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-[0.12em] text-ink/55">All coupons</h2>
      {coupons.length ? (
        <div className="space-y-3">
          {coupons.map((c) => {
            const s = state(c);
            const wa = whatsappLink(c);
            return (
              <Card key={c.code} className="p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
                  <div className="lg:min-w-[180px]">
                    <p className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold tracking-wider">{c.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.tone}`}>{s.label}</span>
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">{gives(c)}</p>
                    {c.description && <p className="text-xs text-ink/55">{c.description}</p>}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-pale/70 p-3 text-sm sm:grid-cols-4 lg:flex-1 lg:bg-transparent lg:p-0">

                    <div>
                      <dt className="text-xs text-ink/50">For</dt>
                      <dd>
                        {c.assigned_phone || c.assigned_email ? (
                          <>
                            {c.assigned_name || "One customer"}
                            <span className="block text-xs text-ink/55">{c.assigned_phone ? `+91 ${c.assigned_phone}` : c.assigned_email}</span>
                          </>
                        ) : (
                          "Everyone"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink/50">Used</dt>
                      <dd className="tabular-nums">
                        {c.used}
                        {c.max_uses ? ` of ${c.max_uses}` : ""}
                        {c.in_checkout > 0 && <span className="block text-xs text-ink/55">{c.in_checkout} paying now</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink/50">Rules</dt>
                      <dd className="text-xs leading-relaxed">
                        {c.min_order > 0 ? `Min order ${inr(c.min_order)}` : "No minimum"}
                        <br />
                        {c.per_customer === 1 ? "Once per customer" : `${c.per_customer}× per customer`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink/50">Valid</dt>
                      <dd className="text-xs leading-relaxed">
                        {c.starts_at ? `From ${when(c.starts_at)}` : "From now"}
                        <br />
                        {c.expires_at ? `Until ${when(c.expires_at)}` : "No end date"}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="rounded-full bg-[#1f7a4d] px-3 py-1.5 text-xs font-semibold text-white">
                        Send on WhatsApp
                      </a>
                    )}
                    <form action={toggleCouponAction}>
                      <input type="hidden" name="code" value={c.code} />
                      <input type="hidden" name="active" value={String(!c.active)} />
                      <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-ink/15">
                        {c.active ? "Turn off" : "Turn on"}
                      </button>
                    </form>
                    {c.used === 0 && c.in_checkout === 0 && (
                      <form action={deleteCouponAction}>
                        <input type="hidden" name="code" value={c.code} />
                        <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                          Delete
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                {c.redemptions.length > 0 && (
                  <details className="mt-3 border-t border-ink/5 pt-3 text-sm">
                    <summary className="cursor-pointer font-semibold text-ink/70">Who used it ({c.redemptions.length})</summary>
                    <ul className="mt-2 space-y-1">
                      {c.redemptions.map((r) => (
                        <li key={r.order_no} className="flex flex-wrap gap-x-4 text-ink/75">
                          <a href={`/admin/orders/${r.order_no}`} className="font-mono underline underline-offset-2">
                            {r.order_no}
                          </a>
                          <span>+91 {r.phone}</span>
                          <span>{when(r.used_at)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty>No coupons yet. Create the first one above.</Empty>
      )}
    </>
  );
}
