import "server-only";

// Cloudflare Turnstile server-side verification.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
//
// Until TURNSTILE_SECRET_KEY is set the check is skipped, so the site keeps
// working before the Cloudflare widget is configured.

type SiteverifyResponse = { success: boolean; "error-codes"?: string[]; hostname?: string };

export async function verifyTurnstile(token: string | undefined, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true as const, skipped: true };
  if (!token) return { ok: false as const, reason: "missing-token" };

  try {
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    const data = (await res.json()) as SiteverifyResponse;
    if (!data.success) return { ok: false as const, reason: (data["error-codes"] ?? []).join(",") || "rejected" };
    return { ok: true as const, skipped: false };
  } catch (error) {
    // If Cloudflare is unreachable, don't block real customers from paying.
    console.error("[turnstile] siteverify unreachable — allowing request", String(error));
    return { ok: true as const, skipped: true };
  }
}

/** Best-effort client IP from Vercel/Cloudflare headers. */
export function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}
