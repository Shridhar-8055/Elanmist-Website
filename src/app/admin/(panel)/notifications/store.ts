"use client";

import { useSyncExternalStore } from "react";

// Per-browser notification preferences and "read" marker for the admin, kept in
// localStorage and exposed to React as an external store.
const SEEN = "elanmist-admin-notif-seen";
const SOUND = "elanmist-admin-notif-sound";
const DESKTOP = "elanmist-admin-notif-desktop";
const CHANGE = "elanmist-admin-notif-change";

const get = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
  window.dispatchEvent(new Event(CHANGE));
};

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE, cb);
  window.addEventListener("storage", cb); // other admin tabs
  return () => {
    window.removeEventListener(CHANGE, cb);
    window.removeEventListener("storage", cb);
  };
}

// First visit on this browser: the last 24 hours count as new. Fixed for the page's lifetime.
let firstVisitDefault: string | null = null;
function seenSnapshot() {
  const v = get(SEEN);
  if (v) return v;
  firstVisitDefault ??= new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  return firstVisitDefault;
}

const permission = () => ("Notification" in window ? Notification.permission : "unsupported");

/** Everything at or before this time counts as read (null while rendering on the server). */
export const useSeen = () => useSyncExternalStore(subscribe, seenSnapshot, () => null);
export const useSound = () => useSyncExternalStore(subscribe, () => get(SOUND) !== "off", () => true);
export const useDesktop = () =>
  useSyncExternalStore(subscribe, () => get(DESKTOP) === "on" && permission() === "granted", () => false);
export const useDesktopBlocked = () => useSyncExternalStore(subscribe, () => permission() === "denied", () => false);

export const getSeen = () => seenSnapshot();
export const markAllSeen = () => set(SEEN, new Date().toISOString());
export const soundOn = () => get(SOUND) !== "off";
export const setSound = (on: boolean) => set(SOUND, on ? "on" : "off");
export const desktopOn = () => get(DESKTOP) === "on" && permission() === "granted";
export const setDesktop = (on: boolean) => set(DESKTOP, on ? "on" : "off");

/** Two soft notes, generated in the browser (no audio file). Browsers allow it after any click on the page. */
export function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {}
}

/** "just now", "5 min ago", "3 h ago", "2 days ago". */
export function ago(iso: string, now: number) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
