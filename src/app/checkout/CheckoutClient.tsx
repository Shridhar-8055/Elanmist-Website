"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, LockIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { useCart } from "@/lib/cart";
import { customerSchema, fieldErrors, INDIAN_STATES, type CustomerInput } from "@/lib/checkout-schema";
import { shippingFor } from "@/lib/pricing";
import { FREE_SHIPPING_THRESHOLD, inr, shippingInfo } from "@/lib/products";
import { LAST_ORDER_KEY, loadRazorpay, openRazorpay, type RazorpaySuccess } from "@/lib/razorpay-checkout";

const DETAILS_KEY = "elanmist-checkout-details";


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
  const [message, setMessage] = useState<string | null>(null);

  // Remember shipping details on this device so repeat customers don't retype them.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DETAILS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage after hydration
      if (saved) setDetails({ ...emptyDetails, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const busy = status !== "idle";

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

    setStatus("creating");
    try {
      const [res] = await Promise.all([
        fetch("/api/checkout/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer, items: lines.map((l) => ({ slug: l.slug, qty: l.qty })) }),
        }),
        loadRazorpay(),
      ]);
      const order = await res.json();
      if (!res.ok) {
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
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function verify(
    response: RazorpaySuccess,
    order: { receipt: string; totals: { lines: unknown[]; subtotal: number; shipping: number; total: number } },
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
                <Field id="pincode" label="Pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={details.pincode} onChange={update("pincode")} error={errors.pincode} />
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

              <dl className="mt-3 space-y-2 border-t border-ink/10 pt-4 text-base">
                <Row label="Subtotal" value={inr(subtotal)} />
                {mrpTotal > subtotal && <Row label="You save" value={`− ${inr(mrpTotal - subtotal)}`} muted />}
                <Row label="Delivery" value={shipping === 0 ? "Free" : inr(shipping)} />
                {shipping > 0 && (
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
