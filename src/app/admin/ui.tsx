import Link from "next/link";
import type { OrderStatus } from "@/lib/admin-data";
import { inr } from "@/lib/products";

export { inr };

/** Dates in Indian time, e.g. "24 Oct, 3:41 pm". */
export function when(value: string | null | undefined, withTime = true) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : { year: "numeric" }),
  });
}

const STATUS: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-800 ring-emerald-600/20", dot: "bg-emerald-600" },
  awaiting_payment: { label: "Not paid yet", className: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  payment_failed: { label: "Payment failed", className: "bg-red-50 text-red-800 ring-red-600/20", dot: "bg-red-600" },
  payment_setup_failed: { label: "Checkout error", className: "bg-red-50 text-red-800 ring-red-600/20", dot: "bg-red-600" },
  refunded: { label: "Refunded", className: "bg-slate-100 text-slate-700 ring-slate-500/20", dot: "bg-slate-500" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-700 ring-slate-500/20", dot: "bg-slate-500" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status] ?? STATUS.awaiting_payment;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.className}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/** Delivery state in plain words, with a warning tone when someone has to act. */
export function ShipmentBadge({ status, awb, paid }: { status: string | null; awb: string | null; paid: boolean }) {
  if (!paid) return <span className="text-xs text-ink/40">—</span>;
  const s = status ?? "";
  const attention = /create manually|setup incomplete/i.test(s);
  const label = s || (awb ? "Shipped" : "Not sent to Shiprocket");
  const tone = attention
    ? "bg-red-50 text-red-800 ring-red-600/20"
    : /delivered/i.test(s)
      ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
      : awb
        ? "bg-sky-50 text-sky-800 ring-sky-600/20"
        : "bg-amber-50 text-amber-800 ring-amber-600/20";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}>
      {attention && <span aria-hidden>!</span>}
      {label}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight md:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06] md:p-6 ${className}`}>{children}</section>;
}

export function Stat({
  label,
  value,
  note,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  note?: string;
  href?: string;
  tone?: "neutral" | "warn" | "alert";
}) {
  const ring = tone === "alert" ? "ring-red-300 bg-red-50/60" : tone === "warn" ? "ring-amber-300 bg-amber-50/60" : "ring-ink/[0.06] bg-white";
  const body = (
    <>
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className="mt-1.5 text-[28px] font-extrabold leading-none tracking-tight tabular-nums">{value}</p>
      {note && <p className="mt-2 text-xs text-ink/55">{note}</p>}
    </>
  );
  const cls = `block rounded-2xl p-5 ring-1 ${ring}`;
  return href ? (
    <Link href={href} className={`${cls} transition-shadow hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-ink/15 px-5 py-10 text-center text-sm text-ink/55">{children}</p>;
}

export function NotConnected() {
  return (
    <Card>
      <p className="font-semibold">The orders database isn&apos;t connected.</p>
      <p className="mt-1 text-sm text-ink/65">
        Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel and redeploy, then reload this page.
      </p>
    </Card>
  );
}

/** Simple prev/next pager driven by ?page=. */
export function Pager({ page, total, perPage, href }: { page: number; total: number; perPage: number; href: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="mt-5 flex items-center justify-between text-sm">
      <span className="text-ink/60">
        Page {page} of {pages} · {total} total
      </span>
      <span className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="rounded-full border border-ink/15 bg-white px-4 py-2 font-semibold">
            ← Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="rounded-full border border-ink/15 bg-white px-4 py-2 font-semibold">
            Next →
          </Link>
        )}
      </span>
    </nav>
  );
}
