import "server-only";

// Server-only access to Supabase with the secret (service_role) key, which bypasses
// Row Level Security. Never import this from client components.

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export class SupabaseError extends Error {}

/** Calls a Postgres function through the Supabase REST API (POST /rest/v1/rpc/<name>). */
export async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new SupabaseError("Supabase is not configured.");

  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  // Legacy service_role keys are JWTs and go in Authorization too; new sb_secret_ keys only use apikey.
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new SupabaseError(`Supabase ${name} failed (${res.status}): ${body?.message ?? res.statusText}`);
  }
  return body as T;
}
