"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminNotification, NotificationKind } from "@/lib/admin-notifications";
import { KindIcon, kindLabel } from "./KindIcon";
import { ago, getSeen, markAllSeen } from "./store";

const FILTERS: { key: "" | NotificationKind; label: string }[] = [
  { key: "", label: "All" },
  { key: "order", label: "New orders" },
  { key: "attention", label: "Needs action" },
  { key: "payment_failed", label: "Payment issues" },
  { key: "abandoned", label: "Unpaid checkouts" },
];

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Full list on /admin/notifications. Highlights what was unread when the page opened,
// then marks everything read.
export function NotificationList({ items }: { items: AdminNotification[] }) {
  const [filter, setFilter] = useState<"" | NotificationKind>("");
  const [seenAtOpen, setSeenAtOpen] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    // Remember what was unread when the page opened, then mark it all read.
    const capture = setTimeout(() => {
      setSeenAtOpen(getSeen());
      setNow(Date.now());
    }, 0);
    const mark = setTimeout(markAllSeen, 1500);
    return () => {
      clearTimeout(capture);
      clearTimeout(mark);
    };
  }, []);

  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, f.key ? items.filter((n) => n.kind === f.key).length : items.length]));
  const shown = filter ? items.filter((n) => n.kind === filter) : items;

  return (
    <>
      <div role="tablist" aria-label="Filter notifications" className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
              filter === f.key ? "bg-ink text-white ring-ink" : "bg-white text-ink/75 ring-ink/15 hover:text-ink"
            }`}
          >
            {f.label} <span className="ml-1 opacity-60">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 px-5 py-10 text-center text-sm text-ink/55">Nothing here right now.</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/[0.06]">
          {shown.map((n) => {
            const isNew = !!seenAtOpen && n.at > seenAtOpen;
            return (
              <li key={n.id} className="border-b border-ink/[0.06] last:border-0">
                <Link href={n.href} className={`flex gap-3 px-4 py-4 transition-colors hover:bg-ink/[0.03] md:px-5 ${isNew ? "bg-[#fdf3f5]" : ""}`}>
                  <KindIcon kind={n.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold">{n.title}</span>
                      {isNew && <span className="rounded-full bg-[#d4566f] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">New</span>}
                      <span className="text-xs text-ink/45">{kindLabel(n.kind)}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-ink/65 [overflow-wrap:anywhere]">{n.body}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs text-ink/50">
                    <span className="block font-medium text-ink/70">{now ? ago(n.at, now) : ""}</span>
                    <span className="hidden sm:block">{when(n.at)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
