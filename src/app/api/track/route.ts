import { z } from "zod";
import { shiprocketConfigured, trackOrder } from "@/lib/shiprocket";

const schema = z.object({
  orderNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^EM-[A-Z0-9]+-[A-Z0-9]+$/, "Enter your order number, e.g. EM-MUWY2GQL-2C83B9"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter the 10-digit mobile number used for the order")),
});

// Order tracking for /track. The phone number must match the order, so order
// numbers alone can't be used to look up someone else's delivery.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Check your details." }, { status: 422 });
  }

  if (!shiprocketConfigured()) {
    return Response.json({ error: "Order tracking isn't available yet. Please contact support." }, { status: 503 });
  }

  try {
    const result = await trackOrder(parsed.data.orderNo, parsed.data.phone);
    // Same message for wrong phone and unknown order, so the form can't be used to probe order numbers.
    if (result === "phone_mismatch" || result.stage === "not_found") {
      return Response.json(
        { error: "We couldn't find an order with that number and mobile. Check both and try again." },
        { status: 404 },
      );
    }
    return Response.json(result);
  } catch (error) {
    console.error("[track]", String(error));
    return Response.json({ error: "Tracking is temporarily unavailable. Please try again shortly." }, { status: 502 });
  }
}
