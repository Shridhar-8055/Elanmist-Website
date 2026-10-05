import { randomUUID } from "node:crypto";
import { createOrderSchema, fieldErrors } from "@/lib/checkout-schema";
import { priceCart, PricingError } from "@/lib/pricing";
import { createOrder, publicKeyId, RazorpayApiError, RazorpayConfigError, toPaise } from "@/lib/razorpay";

// Creates a Razorpay order for the cart. The amount is always computed here from
// the catalogue — the browser only tells us which products and how many.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your details.", fields: fieldErrors(parsed.error.issues) },
      { status: 422 },
    );
  }
  const { customer, items } = parsed.data;

  try {
    const totals = priceCart(items);
    const receipt = `EM-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    // Razorpay notes: max 15 keys, 256 chars each. They keep the shipping details
    // with the payment in the Razorpay dashboard until an order database is added.
    const clip = (s: string) => s.slice(0, 250);
    const order = await createOrder({
      amountPaise: toPaise(totals.total),
      receipt,
      notes: {
        customer_name: clip(customer.name),
        customer_email: clip(customer.email),
        customer_phone: customer.phone,
        address_line1: clip(customer.address1),
        address_line2: clip(customer.address2),
        city_state_pin: clip(`${customer.city}, ${customer.state} ${customer.pincode}`),
        items: clip(totals.lines.map((l) => `${l.name} x${l.qty}`).join("; ")),
        subtotal: String(totals.subtotal),
        shipping: String(totals.shipping),
        total: String(totals.total),
      },
    });

    return Response.json({
      orderId: order.id,
      receipt,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId(),
      totals,
    });
  } catch (error) {
    if (error instanceof PricingError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof RazorpayConfigError) {
      console.error("[checkout/order]", error.message);
      return Response.json({ error: "Payments are not set up yet. Please try again later." }, { status: 503 });
    }
    if (error instanceof RazorpayApiError) {
      console.error("[checkout/order]", error.status, error.message);
      return Response.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
    }
    console.error("[checkout/order] unexpected", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
