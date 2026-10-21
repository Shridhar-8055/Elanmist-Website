import "server-only";
import { getProduct, inr, shippingInfo } from "./products";

// Transactional email via Resend (https://resend.com/docs/api-reference/emails/send-email).
// Skipped quietly when RESEND_API_KEY isn't set, so checkout never depends on it.

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function send(input: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      // Resend drops repeats of the same key for 24 hours, so the verify step and the
      // Razorpay webhook can both ask for the email and the shopper still gets one.
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [input.to],
      reply_to: process.env.EMAIL_REPLY_TO || shippingInfo.support.email,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body.message ?? res.statusText}`);
  return body as { id: string };
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type PaidOrder = { receipt: string; notes?: Record<string, string> };

/** Order confirmation with the order number and a tracking link. Never throws. */
export async function sendOrderConfirmation(order: PaidOrder, siteUrl: string) {
  if (!emailConfigured()) {
    console.warn("[email] Resend not configured — skipping confirmation", { orderNo: order.receipt });
    return;
  }
  const n = order.notes ?? {};
  const to = n.customer_email;
  if (!to) {
    console.error("[email] order has no customer email", { orderNo: order.receipt });
    return;
  }

  const lines = (n.cart ?? "")
    .split(",")
    .map((part) => part.split(":"))
    .map(([slug, qty]) => ({ product: getProduct(slug), qty: Number(qty) }))
    .filter((l) => l.product && l.qty > 0)
    .map((l) => ({ name: l.product!.name, qty: l.qty, total: l.product!.price * l.qty }));

  const subtotal = Number(n.subtotal ?? 0);
  const shipping = Number(n.shipping ?? 0);
  const total = Number(n.total ?? subtotal + shipping);
  const firstName = (n.customer_name ?? "").trim().split(/\s+/)[0] || "there";
  const trackUrl = `${siteUrl.replace(/\/$/, "")}/track?order=${encodeURIComponent(order.receipt)}`;
  const address = [n.address_line1, n.address_line2, `${n.city ?? ""}, ${n.state ?? ""} ${n.pincode ?? ""}`]
    .map((s) => (s ?? "").trim())
    .filter((s) => s && s !== ",");

  try {
    const result = await send({
      to,
      subject: `Order confirmed — ${order.receipt}`,
      idempotencyKey: `order-confirmation/${order.receipt}`,
      html: confirmationHtml({ firstName, orderNo: order.receipt, lines, subtotal, shipping, total, address, trackUrl, name: n.customer_name ?? "" }),
      text: [
        `Hi ${firstName},`,
        ``,
        `Thank you for your order. Your payment was successful and your order is confirmed.`,
        ``,
        `Order number: ${order.receipt}`,
        ...lines.map((l) => `- ${l.name} x${l.qty}: ${inr(l.total)}`),
        `Delivery: ${shipping ? inr(shipping) : "Free"}`,
        `Total paid: ${inr(total)}`,
        ``,
        `Ship to: ${[n.customer_name, ...address].filter(Boolean).join(", ")}`,
        ``,
        `${shippingInfo.dispatch}, then ${shippingInfo.delivery.toLowerCase()}.`,
        `Track your order any time: ${trackUrl}`,
        `(Use this order number and the mobile number you gave at checkout.)`,
        ``,
        `Questions? Reply to this email or call +91 ${shippingInfo.support.phone}.`,
        `— Team Elanmist`,
      ].join("\n"),
    });
    console.info("[email] confirmation sent", { orderNo: order.receipt, id: result.id });
  } catch (error) {
    console.error("[email] confirmation failed", { orderNo: order.receipt, message: String(error) });
  }
}

// Table-based, inline-styled HTML so it renders in Gmail, Outlook and phone mail apps.
function confirmationHtml(d: {
  firstName: string;
  name: string;
  orderNo: string;
  lines: { name: string; qty: number; total: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  address: string[];
  trackUrl: string;
}) {
  const ink = "#0d0b0b";
  const mist = "#6b635e";
  const wine = "#230a0e";
  const pale = "#f2eeea";
  const font = "font-family:Inter,'Helvetica Neue',Arial,sans-serif;";
  const serif = "font-family:Georgia,'Times New Roman',serif;";

  const row = (label: string, value: string, strong = false) => `
    <tr>
      <td style="${font}padding:4px 0;font-size:${strong ? 17 : 15}px;color:${ink};${strong ? "font-weight:700;" : ""}">${label}</td>
      <td align="right" style="${font}padding:4px 0;font-size:${strong ? 17 : 15}px;color:${ink};${strong ? "font-weight:700;" : ""}">${value}</td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order confirmed</title></head>
<body style="margin:0;padding:0;background:${pale};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Order ${esc(d.orderNo)} is confirmed. Track it any time on elanmist.com.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${pale};">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
        <tr><td style="background:${wine};padding:28px 32px;">
          <p style="${serif}margin:0;font-size:30px;font-style:italic;color:#ffffff;">Elanmist</p>
          <p style="${font}margin:18px 0 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#e8a6b3;">Order confirmed</p>
          <p style="${font}margin:6px 0 0;font-size:26px;line-height:1.25;font-weight:700;color:#ffffff;">Thank you, ${esc(d.firstName)}!</p>
        </td></tr>

        <tr><td style="padding:28px 32px 8px;">
          <p style="${font}margin:0;font-size:15px;line-height:1.6;color:${ink};">Your payment was successful and your order is confirmed. We&rsquo;ll let you know as soon as it ships.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;background:${pale};border-radius:16px;">
            <tr><td style="padding:16px 20px;">
              <p style="${font}margin:0;font-size:13px;color:${mist};">Order number</p>
              <p style="${font}margin:2px 0 0;font-size:20px;font-weight:700;letter-spacing:0.5px;color:${ink};">${esc(d.orderNo)}</p>
            </td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
            <tr><td style="border-radius:999px;background:${ink};">
              <a href="${esc(d.trackUrl)}" style="${font}display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Track your order &rarr;</a>
            </td></tr>
          </table>
          <p style="${font}margin:10px 0 0;font-size:13px;color:${mist};">Use your order number and the mobile number you gave at checkout.</p>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <p style="${font}margin:0 0 8px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:${mist};">Your order</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e7e1dc;">
            ${d.lines
              .map(
                (l) => `<tr>
              <td style="${font}padding:12px 0;border-bottom:1px solid #e7e1dc;font-size:15px;color:${ink};">${esc(l.name)} <span style="color:${mist};">&times; ${l.qty}</span></td>
              <td align="right" style="${font}padding:12px 0;border-bottom:1px solid #e7e1dc;font-size:15px;font-weight:600;color:${ink};">${inr(l.total)}</td>
            </tr>`,
              )
              .join("")}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
            ${row("Subtotal", inr(d.subtotal))}
            ${row("Delivery", d.shipping ? inr(d.shipping) : "Free")}
            ${row("Total paid", inr(d.total), true)}
          </table>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <p style="${font}margin:0 0 8px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:${mist};">Delivering to</p>
          <p style="${font}margin:0;font-size:15px;line-height:1.6;color:${ink};"><strong>${esc(d.name)}</strong><br>${d.address.map(esc).join("<br>")}</p>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${pale};border-radius:16px;">
            <tr><td style="padding:16px 20px;${font}font-size:14px;line-height:1.7;color:${ink};">
              <strong>What happens next</strong><br>
              1. ${esc(shippingInfo.dispatch)}.<br>
              2. You get the courier and tracking number once it ships.<br>
              3. ${esc(shippingInfo.delivery)}.
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 32px 30px;">
          <p style="${font}margin:0;font-size:14px;line-height:1.6;color:${mist};">Questions? Just reply to this email, or call <a href="tel:+91${shippingInfo.support.phone}" style="color:${ink};">+91 ${shippingInfo.support.phone}</a>.</p>
          <p style="${serif}margin:18px 0 0;font-size:17px;font-style:italic;color:${ink};">&mdash; Team Elanmist</p>
        </td></tr>
      </table>
      <p style="${font}margin:18px 0 0;font-size:12px;color:${mist};">You&rsquo;re receiving this because you placed an order on elanmist.com.</p>
    </td></tr>
  </table>
</body>
</html>`;
}
