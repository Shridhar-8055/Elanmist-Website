import { createBrowserClient } from "@supabase/ssr";

// Customer login in the browser. Uses the public (publishable) key; what a logged-in
// customer can read is limited by Row Level Security in the database.

let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  return client;
}

export const accountsEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
