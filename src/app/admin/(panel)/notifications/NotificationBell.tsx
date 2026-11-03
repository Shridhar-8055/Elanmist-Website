"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminNotification } from "@/lib/admin-notifications";
import { KindIcon } from "./KindIcon";
import { ago, chime, desktopOn, markAllSeen, setDesktop, setSound, soundOn, useDesktop, useDesktopBlocked, useSeen, useSound } from "./store";

const POLL_MS = 30_000; // while the tab is open
const POLL_HIDDEN_MS = 60_000; // in a background tab (desktop alerts still arrive)
const ALERT_KINDS = new Set(["order", "attention"]);

type Toast = AdminNotification & { key: number };

// Bell in the admin header: unread count, a dropdown of the latest events, a toast and a
// chime when a new paid order (or a shipment problem) comes in, and optional desktop alerts.
export function NotificationBell() {
  const pathname = usePathname();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const seen = useSeen();
  const sound = useSound();
  const desktop = useDesktop();
  const desktopBlocked = useDesktopBlocked();
  // The panel belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [now, setNow] = useState(0);
  const known = useRef<Set<string> | null>(null);
  const stopped = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const poll = useCallback(async () => {
    if (stopped.current) return;
    try {
      const res = await fetch("/admin/notifications/feed", { cache: "no-store" });
      // Signed out (or the session expired): stop asking.
      if (res.status === 401 || res.redirected) {
        stopped.current = true;
        return;
      }
      if (!res.ok) return;
      const data: { items?: AdminNotification[] } = await res.json();
      const list = data.items ?? [];
      setItems(list);
      setNow(Date.now());

      // Alert only for events that appeared since the page was opened.
      if (known.current) {
        const fresh = list.filter((n) => !known.current!.has(n.id) && ALERT_KINDS.has(n.kind));
        if (fresh.length) {
          setToasts((t) => [...fresh.slice(0, 3).map((n, i) => ({ ...n, key: Date.now() + i })), ...t].slice(0, 4));
          if (soundOn()) chime();
          if (document.hidden && desktopOn()) {
            for (const n of fresh.slice(0, 3)) {
              const sys = new Notification(n.title, { body: n.body, icon: "/icon.png", tag: n.id });
              sys.onclick = () => {
                window.focus();
                window.location.href = n.href;
              };
            }
          }
        }
      }
      known.current = new Set(list.map((n) => n.id));
    } catch {
      // Offline or the server is busy; try again next round.
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(poll, 0);
    let timer = setInterval(poll, document.hidden ? POLL_HIDDEN_MS : POLL_MS);
    const onVis = () => {
      clearInterval(timer);
      timer = setInterval(poll, document.hidden ? POLL_HIDDEN_MS : POLL_MS);
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll]);

  const unread = seen ? items.filter((n) => n.at > seen).length : 0;

  // Unread count in the tab title, e.g. "(2) Orders | Elanmist".
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\)\s/, "");
    document.title = unread ? `(${unread > 9 ? "9+" : unread}) ${base}` : base;
  }, [unread, pathname]);

  // Close the panel on Escape or a click outside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenOn(null);
        button.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // Toasts disappear after 8 seconds.
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((list) => list.slice(0, -1)), 8000);
    return () => clearTimeout(t);
  }, [toasts]);

  async function toggleDesktop() {
    if (desktop) {
      setDesktop(false);
      return;
    }
    if (!("Notification" in window)) return;
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setDesktop(permission === "granted");
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="admin-notifications"
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        className="relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/20"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
          <path d="M10 19.5a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e8a6b3] px-1 text-[11px] font-extrabold text-ink ring-2 ring-wine">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panel}
          id="admin-notifications"
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-[64px] z-50 flex max-h-[min(640px,calc(100svh-80px))] flex-col overflow-hidden rounded-2xl bg-white text-ink shadow-[0_24px_60px_rgb(0_0_0/0.25)] ring-1 ring-black/10 lg:left-[244px] lg:right-auto lg:top-5 lg:w-[420px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
            <p className="font-bold">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-xs text-white">{unread} new</span>}
            </p>
            <button
              type="button"
              onClick={() => markAllSeen()}
              disabled={!unread}
              className="cursor-pointer text-sm font-semibold text-ink/70 underline-offset-4 hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-ink/55">No activity yet. New orders will show up here.</li>}
            {items.slice(0, 12).map((n) => {
              const isNew = !!seen && n.at > seen;
              return (
                <li key={n.id} className="border-b border-ink/[0.06] last:border-0">
                  <Link href={n.href} className={`flex gap-3 px-4 py-3 transition-colors hover:bg-ink/[0.03] ${isNew ? "bg-[#fdf3f5]" : ""}`}>
                    <KindIcon kind={n.kind} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-[15px] font-semibold leading-snug">{n.title}</span>
                        <span className="shrink-0 pt-0.5 text-xs text-ink/50">{ago(n.at, now)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink/65">{n.body}</span>
                    </span>
                    {isNew && <span aria-label="new" className="mt-2 size-2 shrink-0 rounded-full bg-[#d4566f]" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="space-y-2 border-t border-ink/10 bg-ink/[0.02] px-4 py-3 text-sm">
            <Link href="/admin/notifications" className="block font-semibold underline underline-offset-4">
              See all notifications →
            </Link>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSound(!sound);
                  if (!sound) chime();
                }}
                aria-pressed={sound}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${sound ? "bg-ink text-white ring-ink" : "bg-white text-ink/70 ring-ink/15"}`}
              >
                Sound {sound ? "on" : "off"}
              </button>
              <button
                type="button"
                onClick={toggleDesktop}
                aria-pressed={desktop}
                disabled={desktopBlocked}
                title={desktopBlocked ? "Notifications are blocked for this site in your browser settings" : undefined}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${desktop ? "bg-ink text-white ring-ink" : "bg-white text-ink/70 ring-ink/15"}`}
              >
                Desktop alerts {desktop ? "on" : desktopBlocked ? "blocked" : "off"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New-order toasts */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.key} className="pointer-events-auto flex gap-3 rounded-2xl bg-white p-3.5 text-ink shadow-[0_18px_50px_rgb(0_0_0/0.22)] ring-1 ring-black/10 motion-safe:animate-[fade-up_.35s_ease-out]">
            <KindIcon kind={t.kind} />
            <Link href={t.href} className="min-w-0 flex-1" onClick={() => setToasts((l) => l.filter((x) => x.key !== t.key))}>
              <span className="block text-[15px] font-semibold leading-snug">{t.title}</span>
              <span className="mt-0.5 block truncate text-sm text-ink/65">{t.body}</span>
            </Link>
            <button
              type="button"
              onClick={() => setToasts((l) => l.filter((x) => x.key !== t.key))}
              aria-label="Dismiss"
              className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
