import { z } from "zod";
import { findPaidOrderByReceipt } from "@/lib/razorpay";
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
    // The paid Razorpay order is the source of truth for who placed it.
    const paid = await findPaidOrderByReceipt(parsed.data.orderNo);
    const phoneOnOrder = (paid?.notes?.customer_phone ?? "").replace(/\D/g, "").slice(-10);
    // Same message for wrong phone and unknown order, so the form can't be used to probe order numbers.
    if (!paid || phoneOnOrder !== parsed.data.phone) {
      return Response.json(
        { error: "We couldn't find an order with that number and mobile. Check both and try again." },
        { status: 404 },
      );
    }
    return Response.json(await trackOrder(parsed.data.orderNo));
  } catch (error) {
    console.error("[track]", String(error));
    return Response.json({ error: "Tracking is temporarily unavailable. Please try again shortly." }, { status: 502 });
  }
}
