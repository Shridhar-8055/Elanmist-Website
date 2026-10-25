import type { Metadata } from "next";
import Link from "next/link";
import { getCustomers } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseConfigured } from "@/lib/supabase-admin";
import { Card, Empty, inr, NotConnected, PageHeader, Pager, when } from "../../ui";

export const metadata: Metadata = { title: "Customers" };
const PER_PAGE = 50;

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  if (!supabaseConfigured()) return <NotConnected />;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await getCustomers(q, PER_PAGE, (page - 1) * PER_PAGE);

  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone who has checked out, grouped by mobile number.">
        <form action="/admin/customers" className="flex w-full gap-2 md:w-auto">
          <input
            name="q"
            defaultValue={q}
            placeholder="Name, mobile or email"
            aria-label="Search customers"
            className="h-10 min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-4 text-sm outline-none focus:border-ink md:w-[240px] md:flex-none"
          />
          <button type="submit" className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white">
            Search
          </button>
        </form>
      </PageHeader>

      <Card className="p-0 md:p-0">
        {data.rows.length ? (
          <>
          {/* Phones: one card per customer. */}
          <ul className="divide-y divide-ink/5 md:hidden">
            {data.rows.map((c) => (
              <li key={c.phone} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.name || "—"}</p>
                    <p className="text-sm text-ink/65">
                      +91 {c.phone} · {c.city}
                    </p>
                    <p className="break-all text-xs text-ink/55">{c.email}</p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block font-semibold tabular-nums">{inr(Number(c.spent))}</span>
                    <span className="block text-xs text-ink/55">
                      {c.orders} paid order{c.orders === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
                <p className="mt-2 text-xs text-ink/50">Last seen {when(c.last_seen)}</p>
                <div className="mt-3 flex gap-2">
                  <Link href={`/admin/orders?q=${c.phone}`} className="flex-1 whitespace-nowrap rounded-full py-2 text-center text-xs font-semibold ring-1 ring-ink/15">
                    Orders
                  </Link>
                  <Link
                    href={`/admin/coupons?${new URLSearchParams({ phone: c.phone, email: c.email ?? "", name: c.name ?? "" })}#new`}
                    className="flex-1 whitespace-nowrap rounded-full bg-ink py-2 text-center text-xs font-semibold text-white"
                  >
                    Give coupon
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-ink/10 text-left text-ink/55">
                <tr>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Contact</th>
                  <th className="px-3 py-3 text-right font-medium">Paid orders</th>
                  <th className="px-3 py-3 text-right font-medium">Spent</th>
                  <th className="px-3 py-3 font-medium">Last seen</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {data.rows.map((c) => (
                  <tr key={c.phone} className="hover:bg-pale/50">
                    <td className="px-5 py-3">
                      <p className="font-medium">{c.name || "—"}</p>
                      <p className="text-xs text-ink/55">{c.city}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p>+91 {c.phone}</p>
                      <p className="break-all text-xs text-ink/55">{c.email}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {c.orders}
                      {c.unpaid_attempts > 0 && <p className="text-xs text-ink/50">+{c.unpaid_attempts} unpaid</p>}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{inr(Number(c.spent))}</td>
                    <td className="px-3 py-3 text-ink/70">{when(c.last_seen)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="flex justify-end gap-2">
                        <Link href={`/admin/orders?q=${c.phone}`} className="rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-ink/15">
                          Orders
                        </Link>
                        <Link
                          href={`/admin/coupons?${new URLSearchParams({ phone: c.phone, email: c.email ?? "", name: c.name ?? "" })}#new`}
                          className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Give coupon
                        </Link>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="p-5">
            <Empty>{q ? `No customers match “${q}”.` : "No customers yet."}</Empty>
          </div>
        )}
      </Card>
      <Pager page={page} total={data.total} perPage={PER_PAGE} href={(p) => `/admin/customers?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`} />
    </>
  );
}
