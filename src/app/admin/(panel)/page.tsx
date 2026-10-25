import type { Metadata } from "next";
import Link from "next/link";
import { getOverview, type Overview } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseConfigured } from "@/lib/supabase-admin";
import { Card, Empty, inr, NotConnected, PageHeader, ShipmentBadge, Stat, StatusBadge, when } from "../ui";
import { RevenueChart } from "./RevenueChart";

export const metadata: Metadata = { title: "Overview" };

const RANGES = [7, 30, 90] as const;

export default async function AdminOverview({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  if (!supabaseConfigured()) return <NotConnected />;

  const { days: raw } = await searchParams;
  const days = RANGES.find((r) => String(r) === raw) ?? 30;
  let o: Overview;
  try {
    o = await getOverview(days);
  } catch (error) {
    console.error("[admin] overview", String(error));
    return (
      <Card>
        <p className="font-semibold">Couldn&apos;t load the dashboard.</p>
        <p className="mt-1 text-sm text-ink/65">The database didn&apos;t answer. Reload in a moment.</p>
      </Card>
    );
  }

  return (
    <>
      <PageHeader title="Overview" subtitle={`Paid orders over the last ${days} days. Today so far: ${inr(o.today_revenue)} from ${o.today_orders} order${o.today_orders === 1 ? "" : "s"}.`}>
        <div role="group" aria-label="Date range" className="flex rounded-full bg-white p-1 ring-1 ring-ink/10">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin?days=${r}`}
              aria-current={r === days ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${r === days ? "bg-ink text-white" : "text-ink/65"}`}
            >
              {r} days
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={inr(o.revenue)} note={`All time: ${inr(o.all_time_revenue)}`} />
        <Stat label="Paid orders" value={o.orders} note={`All time: ${o.all_time_orders}`} href="/admin/orders?status=paid" />
        <Stat label="Average order" value={inr(o.avg_order)} />
        <Stat label="Customers" value={o.customers} note="Who have paid at least once" href="/admin/customers" />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-[0.12em] text-ink/55">Needs action</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="To dispatch"
          value={o.to_dispatch}
          note="Paid, no courier yet. Ship from Shiprocket."
          href="/admin/orders?status=to_dispatch"
          tone={o.to_dispatch > 0 ? "warn" : "neutral"}
        />
        <Stat
          label="Shiprocket problems"
          value={o.needs_attention}
          note="Paid orders that didn't reach Shiprocket"
          href="/admin/orders?status=attention"
          tone={o.needs_attention > 0 ? "alert" : "neutral"}
        />
        <Stat label="In transit" value={o.in_transit} note={`Delivered: ${o.delivered}`} />
        <Stat
          label="Unfinished checkouts"
          value={o.abandoned}
          note="Started paying but didn't finish"
          href="/admin/orders?status=abandoned"
        />
      </div>

      <div className="mt-8 grid items-start gap-4 xl:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <Card>
          <RevenueChart data={o.daily} />
        </Card>
        <Card>
          <h2 className="text-base font-bold">Best sellers</h2>
          {o.top_products.length ? (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-ink/55">
                <tr>
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 text-right font-medium">Units</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {o.top_products.map((p) => (
                  <tr key={p.slug}>
                    <td className="py-2.5 font-medium">{p.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{p.units}</td>
                    <td className="py-2.5 text-right tabular-nums">{inr(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-sm text-ink/55">No paid orders in this period yet.</p>
          )}

          <h2 className="mt-7 text-base font-bold">Codes</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-pale p-3">
              <dt className="text-ink/60">Referral codes used</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {o.referrals.used} <span className="text-sm font-normal text-ink/55">of {o.referrals.issued} given out</span>
              </dd>
            </div>
            <div className="rounded-xl bg-pale p-3">
              <dt className="text-ink/60">Coupon uses</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {o.coupons.used} <span className="text-sm font-normal text-ink/55">· {o.coupons.active} active</span>
              </dd>
            </div>
            <div className="col-span-2 rounded-xl bg-pale p-3">
              <dt className="text-ink/60">Discounts given in this period</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{inr(o.discount_given)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Latest activity</h2>
          <Link href="/admin/orders" className="text-sm font-semibold underline underline-offset-4">
            All orders
          </Link>
        </div>
        {o.recent.length ? (
          <ul className="mt-3 divide-y divide-ink/5">
            {o.recent.map((r) => (
              <li key={r.order_no}>
                <Link href={`/admin/orders/${r.order_no}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-pale/50">
                  <span className="min-w-[150px] font-mono text-sm font-semibold">{r.order_no}</span>
                  <span className="min-w-[140px] flex-1 text-sm">
                    {r.name || "—"} <span className="text-ink/50">{r.city}</span>
                  </span>
                  <StatusBadge status={r.status} />
                  <ShipmentBadge status={r.shipment_status} awb={null} paid={r.status === "paid"} />
                  <span className="w-20 text-right text-sm font-semibold tabular-nums">{inr(r.total)}</span>
                  <span className="w-28 text-right text-xs text-ink/55">{when(r.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3">
            <Empty>No orders yet. They&apos;ll appear here as soon as someone checks out.</Empty>
          </div>
        )}
      </Card>
    </>
  );
}
