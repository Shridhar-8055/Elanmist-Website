import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { recordOrder } from "@/lib/sheets";
import { publicTrackUrl } from "@/lib/shiprocket";

// Shiprocket tracking webhook. Configure in Shiprocket → Settings → API → Webhooks:
//   URL:   https://<your-domain>/api/webhooks/delivery-updates
//          (Shiprocket rejects URLs containing words like "shiprocket", "kartrocket", "sr", "kr")
//   Token: same value as SHIPROCKET_WEBHOOK_TOKEN — Shiprocket sends it in the x-api-key header.

type ShiprocketEvent = {
  awb?: string | number;
  courier_name?: string;
  current_status?: string;
  shipment_status?: string;
  order_id?: string;
  etd?: string;
  current_timestamp?: string;
  is_return?: number;
};

function tokenMatches(received: string | null) {
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export async function POST(request: Request) {
  if (!tokenMatches(request.headers.get("x-api-key"))) {
    console.warn("[webhook/delivery] rejected: missing or wrong x-api-key");
    return new Response("Unauthorized", { status: 401 });
  }

  let event: ShiprocketEvent;
  try {
    event = await request.json();
  } catch {
    // Shiprocket's "test webhook" button may send an empty body; acknowledge it.
    return new Response("OK", { status: 200 });
  }

  const orderNo = event.order_id?.trim();
  const awb = event.awb ? String(event.awb) : undefined;
  const status = event.current_status ?? event.shipment_status;

  console.info("[webhook/delivery]", { orderNo, awb, status, courier: event.courier_name, at: event.current_timestamp });

  // Our order numbers look like EM-XXXX-XXXX; ignore anything else (e.g. panel test orders).
  if (orderNo?.startsWith("EM-") && status) {
    after(() =>
      recordOrder(orderNo, {
        shipmentStatus: `${event.is_return ? "Return: " : ""}${titleCase(status)}`,
        courier: event.courier_name,
        awb,
        trackingUrl: awb ? publicTrackUrl(awb) : undefined,
      }),
    );
  }

  // Shiprocket expects a 200 within a few seconds or it retries.
  return new Response("OK", { status: 200 });
}
