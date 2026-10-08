import { checkServiceability } from "@/lib/shiprocket";

// Pincode serviceability for the checkout page: GET /api/shipping/check?pincode=560038
export async function GET(request: Request) {
  const pincode = new URL(request.url).searchParams.get("pincode") ?? "";
  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return Response.json({ error: "Enter a valid 6-digit pincode" }, { status: 400 });
  }
  try {
    const result = await checkServiceability(pincode);
    return Response.json(result, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    console.error("[shipping/check]", String(error));
    // Don't block checkout if Shiprocket is having trouble.
    return Response.json({ configured: false });
  }
}
