"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckIcon, GiftIcon, LockIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { Turnstile, TURNSTILE_SITE_KEY, type TurnstileHandle } from "@/components/Turnstile";
import { useCart } from "@/lib/cart";
import { customerSchema, fieldErrors, INDIAN_STATES, type CustomerInput } from "@/lib/checkout-schema";
import { applyOffer, type Offer } from "@/lib/pricing";
import { FREE_SHIPPING_THRESHOLD, inr, shippingInfo } from "@/lib/products";
import { LAST_ORDER_KEY, loadRazorpay, openRazorpay, type RazorpaySuccess } from "@/lib/razorpay-checkout";

const DETAILS_KEY = "elanmist-checkout-details";
// Referral codes need the database; hide the field until Supabase is configured.
const REFERRALS_ON = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);


const emptyDetails: CustomerInput = {
  name: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  state: "" as CustomerInput["state"],
  pincode: "",
};

type Status = "idle" | "creating" | "paying" | "verifying";

export function CheckoutClient() {
  const router = useRouter();
  const { lines, subtotal, mrpTotal, count, clear } = useCart();
  const [details, setDetails] = useState<CustomerInput>(emptyDetails);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Remember shipping details on this device so repeat customers don't retype them.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DETAILS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage after hydration
      if (saved) setDetails({ ...emptyDetails, ...JSON.parse(saved) });
    } catch {}
  }, []);

  // A friend's referral code (one unit free) or an admin coupon. Checked again on the server.
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; kind: "referral" | "coupon"; offer: Offer; label: string } | null>(null);
  const referral = promo?.code ?? null;
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralChecking, setReferralChecking] = useState(false);
  const setReferral = (code: null) => setPromo(code);

  const { discount, shipping } = applyOffer(
    lines.map((l) => ({ unitPrice: l.product.price })),
    subtotal,
    promo?.offer,
  );
  const freeItem =
    promo?.offer.kind === "free_product" ? lines.reduce((a, b) => (b.product.price > a.product.price ? b : a)).product : null;
  const total = subtotal - discount + shipping;
  const busy = status !== "idle";

  async function applyReferral() {
    setReferralError(null);
    const code = referralInput.trim();
    if (!code) return setReferralError("Enter a referral or coupon code.");
    setReferralChecking(true);
    try {
      const res = await fetch("/api/referral/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          email: details.email,
          phone: details.phone,
          address1: details.address1,
          pincode: details.pincode,
          items: lines.map((l) => ({ slug: l.slug, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "That code isn't valid.");
      setPromo({ code: data.code, kind: data.kind, offer: data.offer, label: data.label });
      setReferralInput(data.code);
    } catch (err) {
      setPromo(null);
      setReferralError(err instanceof Error ? err.message : "That code isn't valid.");
    } finally {
      setReferralChecking(false);
    }
  }

  // Live delivery check for the pincode (Shiprocket). Silent if not configured or unavailable.
  const [delivery, setDelivery] = useState<{ pincode: string; text: string; ok: boolean } | null>(null);
  useEffect(() => {
    const pin = details.pincode.trim();
    if (!/^[1-9]\d{5}$/.test(pin)) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shipping/check?pincode=${pin}`, { signal: ctrl.signal });
        const data = await res.json();
        if (!data.configured) return setDelivery(null);
        if (!data.serviceable) {
          return setDelivery({ pincode: pin, ok: false, text: "Sorry, we don't deliver to this pincode yet" });
        }
        const when = data.etd
          ? new Date(data.etd).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
          : null;
        setDelivery({
          pincode: pin,
          ok: true,
          text: when ? `✓ Delivers here — expected by ${when}` : `✓ Delivers here${data.days ? ` in about ${data.days} days` : ""}`,
        });
      } catch {}
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [details.pincode]);
  const deliveryNote = delivery && delivery.pincode === details.pincode.trim() ? delivery : null;

  const update = (key: keyof CustomerInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDetails((d) => ({ ...d, [key]: e.target.value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const parsed = customerSchema.safeParse(details);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error.issues);
      setErrors(errs);
      document.getElementById(`field-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    const customer = parsed.data;
    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify(customer));
    } catch {}

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setMessage("Please wait a moment for the security check above the Pay button to finish, then try again.");
      return;
    }

    setStatus("creating");
    try {
      const [res] = await Promise.all([
        fetch("/api/checkout/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer,
            items: lines.map((l) => ({ slug: l.slug, qty: l.qty })),
            turnstileToken: turnstileToken || undefined,
            referralCode: referral ?? undefined,
          }),
        }),
        loadRazorpay(),
      ]);
      const order = await res.json();
      // Turnstile tokens are single-use: get a fresh one for any retry.
      turnstile.current?.reset();
      if (!res.ok) {
        if (order.fields?.referralCode) {
          // The code was taken or isn't valid for these details: drop it so the total is honest.
          setReferral(null);
          setReferralOpen(true);
          setReferralError(order.fields.referralCode);
        }
        if (order.fields) setErrors(order.fields);
        throw new Error(order.error ?? "We couldn't start the payment.");
      }

      setStatus("paying");
      openRazorpay(
        {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: "Elanmist",
          description: `Order ${order.receipt}`,
          prefill: { name: customer.name, email: customer.email, contact: customer.phone },
          notes: { receipt: order.receipt },
          theme: { color: "#230a0e" },
          retry: { enabled: true, max_count: 3 },
          modal: {
            confirm_close: true,
            ondismiss: () => {
              setStatus("idle");
              setMessage("Payment cancelled. Your cart is saved — you can try again whenever you're ready.");
            },
          },
          handler: (response) => verify(response, order, customer),
        },
        (failure) => {
          // Razorpay keeps the window open for retries; this just surfaces the reason.
          setMessage(`Payment failed: ${failure.error.description}`);
        },
      );
    } catch (err) {
      setStatus("idle");
      turnstile.current?.reset();
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function verify(
    response: RazorpaySuccess,
    order: { receipt: string; totals: { lines: unknown[]; subtotal: number; discount: number; shipping: number; total: number } },
    customer: CustomerInput,
  ) {
    setStatus("verifying");
    try {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      const result = await res.json();
      if (!res.ok || !result.verified) throw new Error(result.error ?? "Payment could not be confirmed.");

      try {
        sessionStorage.setItem(
          LAST_ORDER_KEY,
          JSON.stringify({
            receipt: result.receipt,
            paymentId: result.paymentId,
            referralCode: result.referralCode ?? null,
            totals: order.totals,
            customer: { name: customer.name, email: customer.email, phone: customer.phone, city: customer.city },
          }),
        );
      } catch {}
      clear();
      router.replace("/order/success");
    } catch (err) {
      setStatus("idle");
      setMessage(
        `${err instanceof Error ? err.message : "Payment could not be confirmed."} Payment ID: ${response.razorpay_payment_id}. If money was deducted, contact ${shippingInfo.support.email} — you won't be charged twice.`,
      );
    }
  }

  if (count === 0 && status === "idle") {
    return (
      <section className="grid min-h-[60svh] place-items-center px-5 text-center">
        <div>
          <h1 className="text-3xl font-bold">Your cart is empty</h1>
          <p className="mt-3 text-base text-ink/70">Add a product to check out.</p>
          <Link href="/shop" className="pill-dark mt-8 inline-flex h-12 items-center gap-2 rounded-full px-7 text-base font-semibold">
            Shop the range <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pb-24 pt-8 md:pt-12">
      <div className="mx-auto max-w-[1160px]">
        <h1 className="text-[clamp(30px,4vw,48px)] font-extrabold tracking-tight">Checkout</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-ink/70">
          <LockIcon className="size-4" /> Secure payment powered by Razorpay
        </p>

        <form onSubmit={pay} noValidate className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
          <div className="space-y-6">
            <fieldset disabled={busy} className="rounded-[28px] border border-ink/10 p-5 md:p-7">
              <legend className="px-2 text-lg font-bold">Contact</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="name" label="Full name" autoComplete="name" value={details.name} onChange={update("name")} error={errors.name} className="sm:col-span-2" />
                <Field id="email" label="Email" type="email" autoComplete="email" value={details.email} onChange={update("email")} error={errors.email} hint="Your payment receipt is sent here" />
                <Field id="phone" label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" value={details.phone} onChange={update("phone")} error={errors.phone} hint="For delivery updates" prefix="+91" />
              </div>
            </fieldset>

            <fieldset disabled={busy} className="rounded-[28px] border border-ink/10 p-5 md:p-7">
              <legend className="px-2 text-lg font-bold">Shipping address</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="address1" label="House no., building, street" autoComplete="address-line1" value={details.address1} onChange={update("address1")} error={errors.address1} className="sm:col-span-2" />
                <Field id="address2" label="Area, landmark (optional)" autoComplete="address-line2" value={details.address2 ?? ""} onChange={update("address2")} error={errors.address2} className="sm:col-span-2" />
                <Field id="city" label="City" autoComplete="address-level2" value={details.city} onChange={update("city")} error={errors.city} />
                <Field id="pincode" label="Pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={details.pincode} onChange={update("pincode")} error={errors.pincode ?? (deliveryNote && !deliveryNote.ok ? deliveryNote.text : undefined)} hint={deliveryNote?.ok ? deliveryNote.text : undefined} />
                <div className="sm:col-span-2">
                  <label htmlFor="field-state" className="mb-1.5 block text-sm font-semibold">
                    State
                  </label>
                  <select
                    id="field-state"
                    autoComplete="address-level1"
                    value={details.state}
                    onChange={update("state")}
                    aria-invalid={!!errors.state}
                    aria-describedby={errors.state ? "err-state" : undefined}
                    className={`h-[52px] w-full rounded-2xl border bg-white px-4 text-base outline-none focus:border-ink ${
                      errors.state ? "border-red-600" : "border-ink/20"
                    }`}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p id="err-state" className="mt-1.5 text-sm text-red-700">
                      {errors.state}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[28px] bg-pale p-5 md:p-7">
              <h2 className="text-lg font-bold">Order summary</h2>
              <ul className="mt-4 divide-y divide-ink/10">
                {lines.map(({ product: p, qty }) => (
                  <li key={p.slug} className="flex items-center gap-3 py-3">
                    <div className="relative">
                      <Image src={p.image} alt={p.imageAlt} width={56} height={56} className="size-14 rounded-xl object-cover" style={{ background: p.backdrop }} />
                      <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-xs font-bold text-white">{qty}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold">{p.name}</p>
                      <p className="text-sm text-ink/70">{p.size}</p>
                    </div>
                    <p className="text-base font-semibold">{inr(p.price * qty)}</p>
                  </li>
                ))}
              </ul>

              {/* Referral code */}
              <div className={`mt-3 border-t border-ink/10 pt-4 ${REFERRALS_ON ? "" : "hidden"}`}>
                {referral ? (
                  <div className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                    <p className="text-sm">
                      <span className="flex items-center gap-1.5 font-semibold text-ink">
                        <CheckIcon className="size-4 text-emerald-700" /> {promo?.kind === "coupon" ? "Coupon" : "Referral code"}{" "}
                        {referral} applied
                      </span>
                      <span className="mt-0.5 block text-ink/70">
                        {freeItem
                          ? `${freeItem.name} is free${lines.length > 1 || lines[0].qty > 1 ? " (one unit)" : ""}. You pay delivery.`
                          : `${promo?.label} on this order.`}
                      </span>
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setReferral(null);
                        setReferralInput("");
                      }}
                      className="shrink-0 text-sm font-semibold underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                ) : referralOpen ? (
                  <div>
                    <label htmlFor="field-referralCode" className="mb-1.5 block text-sm font-semibold">
                      Referral or coupon code
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="field-referralCode"
                        value={referralInput}
                        disabled={busy || referralChecking}
                        onChange={(e) => {
                          setReferralInput(e.target.value.toUpperCase());
                          setReferralError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyReferral();
                          }
                        }}
                        placeholder="Enter code"
                        autoCapitalize="characters"
                        autoComplete="off"
                        aria-invalid={!!referralError}
                        aria-describedby={referralError ? "err-referralCode" : "hint-referralCode"}
                        className={`h-12 min-w-0 flex-1 rounded-2xl border bg-white px-4 font-mono text-base uppercase tracking-wider outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus:border-ink ${
                          referralError ? "border-red-600" : "border-ink/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={applyReferral}
                        disabled={busy || referralChecking}
                        className="h-12 shrink-0 rounded-2xl border-2 border-ink px-5 text-sm font-semibold hover:bg-ink hover:text-white disabled:opacity-60"
                      >
                        {referralChecking ? "Checking…" : "Apply"}
                      </button>
                    </div>
                    {referralError ? (
                      <p id="err-referralCode" role="alert" className="mt-1.5 text-sm text-red-700">
                        {referralError}
                      </p>
                    ) : (
                      <p id="hint-referralCode" className="mt-1.5 text-sm text-ink/60">
                        Fill in your mobile and email first. One code per order.
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReferralOpen(true)}
                    className="flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"
                  >
                    <GiftIcon className="size-4" /> Have a referral or coupon code?
                  </button>
                )}
              </div>

              <dl className="mt-3 space-y-2 border-t border-ink/10 pt-4 text-base">
                <Row label="Subtotal" value={inr(subtotal)} />
                {mrpTotal > subtotal && <Row label="You save" value={`− ${inr(mrpTotal - subtotal)}`} muted />}
                {discount > 0 && (
                  <Row label={`${promo?.kind === "coupon" ? `Coupon ${referral}` : "Referral"}: ${promo?.label}`} value={`− ${inr(discount)}`} />
                )}
                <Row label="Delivery" value={shipping === 0 ? "Free" : inr(shipping)} />
                {shipping > 0 && !referral && (
                  <p className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-ink/80">
                    <TruckIcon className="size-4 shrink-0" /> Add {inr(FREE_SHIPPING_THRESHOLD - subtotal)} more for free delivery
                  </p>
                )}
                <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
                  <dt className="text-lg font-bold">Total</dt>
                  <dd className="text-2xl font-black">{inr(total)}</dd>
                </div>
                <p className="text-sm text-ink/70">Inclusive of all taxes</p>
              </dl>

              <Turnstile ref={turnstile} action="checkout" onToken={setTurnstileToken} />

              {message && (
                <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="pill-dark mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold disabled:cursor-wait disabled:opacity-70"
              >
                {status === "idle" && (
                  <>
                    <LockIcon className="size-4" /> Pay {inr(total)} securely
                  </>
                )}
                {status === "creating" && "Preparing secure payment…"}
                {status === "paying" && "Complete payment in the Razorpay window…"}
                {status === "verifying" && "Confirming your payment…"}
              </button>

              <p className="mt-4 flex items-start gap-2 text-sm text-ink/70">
                <ShieldIcon className="mt-0.5 size-4 shrink-0" />
                UPI, cards, netbanking and wallets via Razorpay. Your card details never touch our servers.
              </p>
              <p className="mt-2 text-sm text-ink/70">
                We save your contact and delivery details to process and deliver your order, and may contact you about
                it.{" "}
                <Link href="/policies/privacy" className="font-semibold text-ink underline underline-offset-2">
                  Privacy policy
                </Link>
              </p>
              <p className="mt-2 text-sm text-ink/70">
                {shippingInfo.dispatch}; delivered in 5–7 business days.{" "}
                <Link href="/policies/shipping-and-returns" className="font-semibold text-ink underline underline-offset-2">
                  Shipping &amp; returns
                </Link>
              </p>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-ink/70" : ""}`}>
      <dt>{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  prefix,
  className = "",
  ...input
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  prefix?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = error ? `err-${id}` : hint ? `hint-${id}` : undefined;
  return (
    <div className={className}>
      <label htmlFor={`field-${id}`} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div
        className={`flex h-[52px] items-center rounded-2xl border bg-white focus-within:border-ink ${
          error ? "border-red-600" : "border-ink/20"
        }`}
      >
        {prefix && <span className="pl-4 text-base text-ink/60">{prefix}</span>}
        <input
          id={`field-${id}`}
          name={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="h-full w-full rounded-2xl bg-transparent px-4 text-base outline-none"
          {...input}
        />
      </div>
      {error ? (
        <p id={`err-${id}`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`hint-${id}`} className="mt-1.5 text-sm text-ink/60">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
