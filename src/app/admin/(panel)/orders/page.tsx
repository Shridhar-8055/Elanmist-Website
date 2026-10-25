import type { Metadata } from "next";
import Link from "next/link";
import { getOrders } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseConfigured } from "@/lib/supabase-admin";
import { Card, Empty, inr, NotConnected, PageHeader, Pager, ShipmentBadge, StatusBadge, when } from "../../ui";

export const metadata: Metadata = { title: "Orders" };

const TABS = [
  { key: "", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "to_dispatch", label: "To dispatch" },
  { key: "attention", label: "Shiprocket problems" },
  { key: "abandoned", label: "Unfinished" },
  { key: "refunded", label: "Refunded" },
];
const PER_PAGE = 25;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  if (!supabaseConfigured()) return <NotConnected />;

  const sp = await searchParams;
  const status = TABS.some((t) => t.key === sp.status) ? String(sp.status) : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await getOrders(status, q, PER_PAGE, (page - 1) * PER_PAGE);
  const link = (over: Record<string, string | number>) => {
    const p = new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...Object.fromEntries(Object.entries(over).map(([k, v]) => [k, String(v)])) });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/admin/orders${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Orders" subtitle="Every checkout, paid or not. Click an order for full details.">
        <a href={`/admin/orders/export${status ? `?status=${status}` : ""}`} className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold">
          Download CSV
        </a>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <nav aria-label="Filter orders" className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={link({ status: t.key, page: "" })}
              aria-current={t.key === status ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${t.key === status ? "bg-ink text-white" : "bg-white text-ink/70 ring-1 ring-ink/10"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/orders" className="flex w-full gap-2 md:ml-auto md:w-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Order no, name, mobile, email, AWB"
            aria-label="Search orders"
            className="h-10 min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-4 text-sm outline-none focus:border-ink md:w-[260px] md:flex-none"
          />
          <button type="submit" className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white">
            Search
          </button>
        </form>
      </div>

      <Card className="p-0 md:p-0">
        {data.rows.length ? (
          <>
          {/* Phones: one card per order. */}
          <ul className="divide-y divide-ink/5 md:hidden">
            {data.rows.map((o) => (
              <li key={o.order_no}>
                <Link href={`/admin/orders/${o.order_no}`} className="block px-4 py-4 active:bg-pale/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[13px] font-semibold">{o.order_no}</p>
                      <p className="text-xs text-ink/55">{when(o.created_at)}</p>
                    </div>
                    <p className="shrink-0 text-right font-semibold tabular-nums">
                      {inr(o.total)}
                      {o.discount > 0 && <span className="block text-xs font-normal text-ink/55">−{inr(o.discount)} off</span>}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium">
                    {o.name || "—"} <span className="font-normal text-ink/55">· {o.city}</span>
                  </p>
                  {o.items && <p className="mt-0.5 text-sm text-ink/65">{o.items}</p>}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={o.status} />
                    <ShipmentBadge status={o.shipment_status} awb={o.awb} paid={o.status === "paid"} />
                    {(o.coupon_code_used ?? o.referral_code_used) && (
                      <span className="rounded-full bg-pale px-2.5 py-1 font-mono text-xs">{o.coupon_code_used ?? o.referral_code_used}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-ink/10 text-left text-ink/55">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Items</th>
                  <th className="px-3 py-3 text-right font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Payment</th>
                  <th className="px-3 py-3 font-medium">Delivery</th>
                  <th className="px-5 py-3 font-medium">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {data.rows.map((o) => (
                  <tr key={o.order_no} className="align-top hover:bg-pale/50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${o.order_no}`} className="font-mono font-semibold underline-offset-4 hover:underline">
                        {o.order_no}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink/55">{when(o.created_at)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{o.name || "—"}</p>
                      <p className="text-xs text-ink/55">
                        {o.phone} · {o.city}
                      </p>
                    </td>
                    <td className="max-w-[220px] px-3 py-3 text-ink/75">{o.items ?? "—"}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {inr(o.total)}
                      {o.discount > 0 && <p className="text-xs font-normal text-ink/55">−{inr(o.discount)} off</p>}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-3">
                      <ShipmentBadge status={o.shipment_status} awb={o.awb} paid={o.status === "paid"} />
                      {o.awb && <p className="mt-1 font-mono text-xs text-ink/55">{o.awb}</p>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{o.coupon_code_used ?? o.referral_code_used ?? <span className="text-ink/35">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="p-5">
            <Empty>{q ? `No orders match “${q}”.` : "No orders here yet."}</Empty>
          </div>
        )}
      </Card>
      <Pager page={page} total={data.total} perPage={PER_PAGE} href={(p) => link({ page: p })} />
    </>
  );
}
