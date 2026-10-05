import "server-only";

// Sends checkout events to the Google Sheet via its Apps Script web app
// (integrations/google-sheets/Code.gs). One row per order, updated as the
// payment status changes.
//
// This must never break checkout: failures are logged and swallowed, and calls
// are made from `after()` so they don't delay the shopper's response.

export type SheetStatus = "Awaiting payment" | "Payment setup failed" | "Paid" | "Payment failed" | "Refunded";

export type SheetRow = Partial<{
  status: SheetStatus;
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  items: string;
  subtotal: number;
  shipping: number;
  total: number;
  razorpayOrderId: string;
  paymentId: string;
  method: string;
  notes: string;
}>;

export async function recordOrder(orderNo: string, data: SheetRow) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.warn("[sheets] not configured — skipping", { orderNo, status: data.status });
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      // Apps Script reads the raw body; text/plain avoids a CORS preflight-style rejection.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, orderNo, data }),
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.ok) {
      console.error("[sheets] write failed", { orderNo, status: res.status, result });
    }
  } catch (error) {
    console.error("[sheets] request error", { orderNo, error: String(error) });
  }
}
