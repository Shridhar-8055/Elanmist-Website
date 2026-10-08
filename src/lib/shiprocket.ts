import "server-only";
import { getProduct, packaging } from "./products";

// Shiprocket API client (https://apiv2.shiprocket.in/v1/external).
// Uses a dedicated Shiprocket *API user* (Settings → API → Configure), never the
// panel login. Every function degrades gracefully when Shiprocket isn't configured.

// Overridable only so the integration can be tested against a local mock.
const API = process.env.SHIPROCKET_API_BASE ?? "https://apiv2.shiprocket.in/v1/external";

export class ShiprocketConfigError extends Error {}
export class ShiprocketApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function shiprocketConfigured() {
  return Boolean(process.env.SHIPROCKET_API_EMAIL && process.env.SHIPROCKET_API_PASSWORD);
}

// The login token lasts ~10 days; refresh well before that, and on any 401.
let cachedToken: { value: string; expires: number } | null = null;

async function token(force = false) {
  if (!force && cachedToken && cachedToken.expires > Date.now()) return cachedToken.value;
  const email = process.env.SHIPROCKET_API_EMAIL;
  const password = process.env.SHIPROCKET_API_PASSWORD;
  if (!email || !password) throw new ShiprocketConfigError("SHIPROCKET_API_EMAIL / SHIPROCKET_API_PASSWORD are not set.");
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.token) {
    throw new ShiprocketApiError(`Shiprocket login failed: ${body.message ?? res.statusText}`, res.status);
  }
  cachedToken = { value: body.token, expires: Date.now() + 20 * 60 * 60 * 1000 };
  return cachedToken.value;
}

async function call<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}`, ...init?.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 401 && !retried) {
    await token(true);
    return call<T>(path, init, true);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.message ?? (body.errors ? JSON.stringify(body.errors) : res.statusText);
    throw new ShiprocketApiError(`Shiprocket ${path} failed: ${msg}`, res.status);
  }
  return body as T;
}

// ─── Serviceability ────────────────────────────────────────────────────────────

export type Serviceability =
  | { configured: false }
  | { configured: true; serviceable: false }
  | { configured: true; serviceable: true; days: number | null; etd: string | null };

const serviceCache = new Map<string, { at: number; result: Serviceability }>();

/** Can a prepaid parcel reach this pincode from our pickup address? Cached for 6 hours. */
export async function checkServiceability(pincode: string, weightKg = 0.2): Promise<Serviceability> {
  const pickup = process.env.SHIPROCKET_PICKUP_PINCODE;
  if (!shiprocketConfigured() || !pickup) return { configured: false };

  const hit = serviceCache.get(pincode);
  if (hit && Date.now() - hit.at < 6 * 60 * 60 * 1000) return hit.result;

  const qs = new URLSearchParams({
    pickup_postcode: pickup,
    delivery_postcode: pincode,
    weight: String(weightKg),
    cod: "0",
  });
  type Resp = {
    status?: number;
    data?: { available_courier_companies?: { estimated_delivery_days?: string | number; etd?: string }[] };
  };
  let body: Resp;
  try {
    body = await call<Resp>(`/courier/serviceability/?${qs}`);
  } catch (error) {
    // Shiprocket answers 404 when no courier serves the pincode.
    if (error instanceof ShiprocketApiError && error.status === 404) {
      const result: Serviceability = { configured: true, serviceable: false };
      serviceCache.set(pincode, { at: Date.now(), result });
      return result;
    }
    throw error;
  }

  const couriers = body.data?.available_courier_companies ?? [];
  let result: Serviceability;
  if (!couriers.length) {
    result = { configured: true, serviceable: false };
  } else {
    const days = couriers
      .map((c) => Number(c.estimated_delivery_days))
      .filter((d) => Number.isFinite(d) && d > 0);
    const fastest = days.length ? Math.min(...days) : null;
    const etd = couriers.find((c) => Number(c.estimated_delivery_days) === fastest)?.etd ?? null;
    result = { configured: true, serviceable: true, days: fastest, etd };
  }
  serviceCache.set(pincode, { at: Date.now(), result });
  return result;
}

// ─── Orders ────────────────────────────────────────────────────────────────────

export type ShipmentInput = {
  orderNo: string;
  orderDate: Date;
  customer: {
    name: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: { slug: string; qty: number }[];
  shipping: number;
  subtotal: number;
};

type ShiprocketOrderRow = {
  id: number;
  channel_order_id: string;
  customer_phone?: string;
  status?: string;
  shipments?: { id: number; awb?: string | null; courier?: string | null; status?: string }[];
};

/** Finds a Shiprocket order by our order number (EM-…). */
export async function findOrder(orderNo: string) {
  const body = await call<{ data?: ShiprocketOrderRow[] }>(`/orders?search=${encodeURIComponent(orderNo)}&per_page=10`);
  return body.data?.find((o) => o.channel_order_id === orderNo) ?? null;
}

const pad = (n: number) => String(n).padStart(2, "0");
function istTimestamp(d: Date) {
  // Shiprocket expects local Indian time as "YYYY-MM-DD HH:mm".
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

/**
 * Creates the order in Shiprocket so it appears in the panel ready for courier
 * assignment. Idempotent: returns the existing order if this order number was
 * already sent (Razorpay retries webhooks).
 */
export async function createShipment(input: ShipmentInput) {
  const existing = await findOrder(input.orderNo);
  if (existing) return { created: false, shiprocketOrderId: existing.id, shipmentId: existing.shipments?.[0]?.id ?? null };

  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION;
  if (!pickupLocation) throw new ShiprocketConfigError("SHIPROCKET_PICKUP_LOCATION is not set.");

  const lines = input.items.map(({ slug, qty }) => {
    const product = getProduct(slug);
    const pack = packaging[slug];
    if (!product || !pack) throw new Error(`Unknown product for shipment: ${slug}`);
    return { product, pack, qty };
  });

  // Parcel size: stack the units; weight is the sum.
  const weight = Math.max(0.1, lines.reduce((s, l) => s + l.pack.weightKg * l.qty, 0));
  const length = Math.max(...lines.map((l) => l.pack.lengthCm));
  const breadth = Math.max(...lines.map((l) => l.pack.breadthCm));
  const height = Math.max(5, lines.reduce((s, l) => s + l.pack.heightCm * l.qty, 0));

  const [first, ...rest] = input.customer.name.trim().split(/\s+/);
  const c = input.customer;

  const body = await call<{ order_id: number; shipment_id: number; status: string }>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id: input.orderNo,
      order_date: istTimestamp(input.orderDate),
      pickup_location: pickupLocation,
      billing_customer_name: first,
      billing_last_name: rest.join(" ") || ".",
      billing_address: c.address1,
      billing_address_2: c.address2 ?? "",
      billing_city: c.city,
      billing_pincode: c.pincode,
      billing_state: c.state,
      billing_country: "India",
      billing_email: c.email,
      billing_phone: c.phone,
      shipping_is_billing: true,
      order_items: lines.map(({ product, pack, qty }) => ({
        name: product.name,
        sku: pack.sku,
        units: qty,
        selling_price: product.price,
      })),
      payment_method: "Prepaid",
      shipping_charges: input.shipping,
      sub_total: input.subtotal,
      length,
      breadth,
      height,
      weight: Math.round(weight * 1000) / 1000,
    }),
  });
  return { created: true, shiprocketOrderId: body.order_id, shipmentId: body.shipment_id };
}

// ─── Tracking ──────────────────────────────────────────────────────────────────

export type TrackingEvent = { date: string; status: string; location: string };
export type Tracking = {
  stage: "not_found" | "processing" | "shipped";
  status: string;
  courier?: string;
  awb?: string;
  etd?: string | null;
  trackUrl?: string;
  events: TrackingEvent[];
};

type TrackResp = {
  tracking_data?: {
    track_url?: string;
    etd?: string;
    shipment_track?: { awb_code?: string; courier_name?: string; current_status?: string; edd?: string | null }[];
    shipment_track_activities?: { date: string; activity?: string; status?: string; location?: string; "sr-status-label"?: string }[] | null;
  };
};

export const publicTrackUrl = (awb: string) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;

/** Tracking for the /track page. Requires the phone number on the order to match. */
export async function trackOrder(orderNo: string, phone: string): Promise<Tracking | "phone_mismatch"> {
  const order = await findOrder(orderNo);
  if (!order) return { stage: "not_found", status: "Order not found", events: [] };

  const last10 = (s?: string) => (s ?? "").replace(/\D/g, "").slice(-10);
  if (!order.customer_phone || last10(order.customer_phone) !== last10(phone)) return "phone_mismatch";

  const shipment = order.shipments?.find((s) => s.awb) ?? order.shipments?.[0];
  if (!shipment?.awb) {
    return { stage: "processing", status: "Order confirmed — preparing for dispatch", events: [] };
  }

  const data = (await call<TrackResp>(`/courier/track/awb/${encodeURIComponent(shipment.awb)}`)).tracking_data;
  const track = data?.shipment_track?.[0];
  const nice = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const events = (data?.shipment_track_activities ?? []).map((a) => ({
    date: a.date,
    status: nice(a["sr-status-label"] || a.activity || a.status || ""),
    location: a.location ?? "",
  }));
  return {
    stage: "shipped",
    status: nice(track?.current_status || shipment.status || "Shipped"),
    courier: track?.courier_name ?? shipment.courier ?? undefined,
    awb: shipment.awb,
    etd: data?.etd ?? track?.edd ?? null,
    trackUrl: data?.track_url || publicTrackUrl(shipment.awb),
    events,
  };
}
