import { isAdmin } from "@/lib/admin-auth";
import { getAdminNotifications } from "@/lib/admin-notifications";
import { supabaseConfigured } from "@/lib/supabase-admin";

// JSON feed polled by the admin bell. Admin session required.
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!supabaseConfigured()) return Response.json({ items: [], error: "not_connected" });
  try {
    const items = await getAdminNotifications();
    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[admin] notifications feed failed", e);
    return Response.json({ items: [], error: "unavailable" }, { status: 503 });
  }
}
