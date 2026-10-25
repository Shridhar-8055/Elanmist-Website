import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// The logged-in customer's Supabase client on the server (pages and Server Actions).
// Reads and refreshes the session from cookies; Row Level Security limits it to the
// customer's own rows. Create a new one per request.
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components can't set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** The logged-in customer, verified with Supabase (not just read from the cookie). */
export async function currentCustomer() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, user: data.user } : null;
}
