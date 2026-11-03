import type { NotificationKind } from "@/lib/admin-notifications";

const STYLE: Record<NotificationKind, { bg: string; path: string; label: string }> = {
  order: {
    bg: "bg-emerald-100 text-emerald-800",
    label: "New order",
    // shopping bag
    path: "M6 7h12l-1 13H7L6 7zm3 0a3 3 0 0 1 6 0",
  },
  attention: {
    bg: "bg-red-100 text-red-800",
    label: "Needs action",
    // warning triangle
    path: "M12 4l9 16H3L12 4zm0 6v4m0 3v.01",
  },
  payment_failed: {
    bg: "bg-amber-100 text-amber-800",
    label: "Payment issue",
    // card with cross
    path: "M3 7h18v10H3V7zm0 3h18M14 13l3 3m0-3l-3 3",
  },
  abandoned: {
    bg: "bg-slate-100 text-slate-700",
    label: "Unpaid checkout",
    // clock
    path: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 4v5l3 2",
  },
};

export const kindLabel = (k: NotificationKind) => STYLE[k].label;

export function KindIcon({ kind }: { kind: NotificationKind }) {
  const s = STYLE[kind];
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${s.bg}`}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d={s.path} />
      </svg>
    </span>
  );
}
