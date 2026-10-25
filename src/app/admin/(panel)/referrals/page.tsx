import type { Metadata } from "next";
import Link from "next/link";
import { getReferrals } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseConfigured } from "@/lib/supabase-admin";
import { toggleReferralAction } from "../../actions";
import { Card, Empty, NotConnected, PageHeader, Pager, when } from "../../ui";

export const metadata: Metadata = { title: "Referral codes" };

const TABS = [
  { key: "", label: "All" },
  { key: "active", label: "Not used yet" },
  { key: "used", label: "Used" },
  { key: "disabled", label: "Disabled" },
];
const TONE = {
  active: "bg-emerald-50 text-emerald-800",
  reserved: "bg-amber-50 text-amber-800",
  used: "bg-slate-100 text-slate-700",
  disabled: "bg-red-50 text-red-800",
} as const;
const LABEL = { active: "Not used yet", reserved: "Being used now", used: "Used", disabled: "Disabled" } as const;
const PER_PAGE = 50;

export default async function ReferralsPage({ searchParams }: PageProps<"/admin/referrals">) {
  await requireAdmin();
  if (!supabaseConfigured()) return <NotConnected />;
  const sp = await searchParams;
  const status = TABS.some((t) => t.key === sp.status) ? String(sp.status) : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await getReferrals(status, q, PER_PAGE, (page - 1) * PER_PAGE);
  const link = (over: Record<string, string>) => {
    const p = new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...over });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/admin/referrals${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Referral codes" subtitle="Each paid order gets one code to share. A friend who uses it gets one product free.">
        <form action="/admin/referrals" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Code, owner name or mobile" aria-label="Search codes" className="h-10 w-[240px] rounded-full border border-ink/15 bg-white px-4 text-sm outline-none focus:border-ink" />
          <button type="submit" className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white">
            Search
          </button>
        </form>
      </PageHeader>

      <nav aria-label="Filter codes" className="mb-4 flex flex-wrap gap-1.5">
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

      <Card className="p-0 md:p-0">
        {data.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-ink/10 text-left text-ink/55">
                <tr>
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-3 py-3 font-medium">Owner</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Used by</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {data.rows.map((r) => (
                  <tr key={r.code}>
                    <td className="px-5 py-3">
                      <p className="font-mono font-bold tracking-wider">{r.code}</p>
                      <p className="text-xs text-ink/55">Given {when(r.created_at)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{r.owner_name ?? "—"}</p>
                      <p className="text-xs text-ink/55">
                        +91 {r.owner_phone} ·{" "}
                        <Link href={`/admin/orders/${r.owner_order_no}`} className="underline underline-offset-2">
                          {r.owner_order_no}
                        </Link>
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[r.status]}`}>{LABEL[r.status]}</span>
                    </td>
                    <td className="px-3 py-3">
                      {r.used_order_no ? (
                        <>
                          <p>{r.used_by_name ?? "—"}</p>
                          <p className="text-xs text-ink/55">
                            <Link href={`/admin/orders/${r.used_order_no}`} className="underline underline-offset-2">
                              {r.used_order_no}
                            </Link>{" "}
                            · {when(r.used_at)}
                          </p>
                        </>
                      ) : (
                        <span className="text-ink/35">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.status !== "used" && (
                        <form action={toggleReferralAction}>
                          <input type="hidden" name="code" value={r.code} />
                          <input type="hidden" name="disabled" value={String(r.status !== "disabled")} />
                          <button type="submit" className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${r.status === "disabled" ? "ring-ink/15" : "text-red-700 ring-red-200"}`}>
                            {r.status === "disabled" ? "Enable" : "Disable"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <Empty>{q ? `No codes match “${q}”.` : "No referral codes yet. They're created when orders are paid."}</Empty>
          </div>
        )}
      </Card>
      <Pager page={page} total={data.total} perPage={PER_PAGE} href={(p) => link({ page: String(p) })} />
    </>
  );
}
