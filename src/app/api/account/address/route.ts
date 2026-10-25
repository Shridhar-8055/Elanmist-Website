import { currentCustomer } from "@/lib/supabase/server";

// The logged-in customer's saved details, used to pre-fill checkout. 204 when logged out.
export async function GET() {
  const me = await currentCustomer();
  if (!me) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  const { data } = await me.supabase
    .from("customers")
    .select("name,phone,address1,address2,city,state,pincode")
    .eq("id", me.user.id)
    .maybeSingle();
  return Response.json({ email: me.user.email ?? "", ...(data ?? {}) }, { headers: { "Cache-Control": "no-store" } });
}
