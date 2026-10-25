import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminConfigured, createSessionToken, safeEqual, verifySessionToken } from "./admin-session";

// Data Access Layer check for the admin area. The proxy already turns away visitors
// without a valid cookie; every admin page and Server Action calls this as well,
// because the proxy alone is not a security boundary.

export async function isAdmin() {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

// Login throttling: 5 failed attempts per IP per 15 minutes.
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, number[]>();

export function loginBlocked(ip: string) {
  const recent = (failures.get(ip) ?? []).filter((t) => Date.now() - t < WINDOW_MS);
  failures.set(ip, recent);
  return recent.length >= 5;
}

function noteFailure(ip: string) {
  failures.set(ip, [...(failures.get(ip) ?? []), Date.now()]);
  if (failures.size > 5000) failures.clear();
}

async function digest(s: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Checks the password and, if right, sets the session cookie. */
export async function signIn(password: string, ip: string) {
  if (!adminConfigured()) return "not_configured" as const;
  if (loginBlocked(ip)) return "blocked" as const;
  // Compare hashes so the comparison time doesn't depend on the password length.
  const ok = safeEqual(await digest(password), await digest(process.env.ADMIN_PASSWORD!));
  if (!ok) {
    noteFailure(ip);
    await new Promise((r) => setTimeout(r, 600));
    return "wrong" as const;
  }
  failures.delete(ip);
  const { token, expires } = await createSessionToken();
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
  return "ok" as const;
}

export async function signOut() {
  (await cookies()).delete(ADMIN_COOKIE);
}
