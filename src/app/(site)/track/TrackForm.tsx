"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CheckIcon, ClockIcon, TruckIcon } from "@/components/icons";
import { shippingInfo } from "@/lib/products";

type TrackingEvent = { date: string; status: string; location: string };
type Tracking = {
  stage: "processing" | "shipped";
  status: string;
  courier?: string;
  awb?: string;
  etd?: string | null;
  trackUrl?: string;
  events: TrackingEvent[];
};

const PHONE_KEY = "elanmist-checkout-details";

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value.replace(" ", "T"));
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function TrackForm({ initialOrder }: { initialOrder: string }) {
  const [orderNo, setOrderNo] = useState(initialOrder);
  const [phone, setPhone] = useState("");

  // Pre-fill the phone used at checkout on this device, if any.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PHONE_KEY) ?? "{}").phone;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage after hydration
      if (saved) setPhone(saved);
    } catch {}
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Tracking | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't fetch tracking.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't fetch tracking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-4 pb-24 pt-10 md:pt-16">
      <div className="mx-auto max-w-[720px]">
        <h1 className="text-[clamp(30px,4.4vw,52px)] font-extrabold leading-tight tracking-tight">Track your order</h1>
        <p className="mt-3 text-base text-ink/75">
          Enter your order number (from your confirmation page or payment receipt) and the mobile number used at checkout.
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-[28px] bg-pale p-5 sm:grid-cols-[1.3fr_1fr_auto] sm:items-end md:p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Order number</span>
            <input
              required
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="EM-XXXXXXXX-XXXXXX"
              autoCapitalize="characters"
              className="h-[52px] w-full rounded-2xl border border-ink/20 bg-white px-4 text-base uppercase outline-none placeholder:normal-case focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Mobile number</span>
            <input
              required
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              className="h-[52px] w-full rounded-2xl border border-ink/20 bg-white px-4 text-base outline-none focus:border-ink"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="pill-dark h-[52px] rounded-full px-7 text-base font-semibold disabled:opacity-70"
          >
            {loading ? "Checking…" : "Track"}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-8 rounded-[28px] border border-ink/10 p-6 md:p-8" aria-live="polite">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-white">
                {result.stage === "shipped" ? <TruckIcon className="size-6" /> : <ClockIcon className="size-6" />}
              </span>
              <div>
                <p className="text-sm text-ink/70">Current status</p>
                <p className="text-2xl font-bold">{result.status}</p>
                {result.etd && <p className="mt-1 text-base text-ink/80">Expected delivery: {formatDate(result.etd)}</p>}
              </div>
            </div>

            {result.stage === "processing" && (
              <p className="mt-5 text-base text-ink/75">
                {shippingInfo.dispatch}. You&apos;ll see the courier and live updates here as soon as it ships.
              </p>
            )}

            {result.stage === "shipped" && (
              <>
                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {result.courier && (
                    <div className="rounded-2xl bg-pale px-4 py-3">
                      <dt className="text-sm text-ink/70">Courier</dt>
                      <dd className="font-semibold">{result.courier}</dd>
                    </div>
                  )}
                  {result.awb && (
                    <div className="rounded-2xl bg-pale px-4 py-3">
                      <dt className="text-sm text-ink/70">Tracking number (AWB)</dt>
                      <dd className="font-mono font-semibold">{result.awb}</dd>
                    </div>
                  )}
                </dl>

                {result.events.length > 0 && (
                  <ol className="mt-7 space-y-0">
                    {result.events.map((ev, i) => (
                      <li key={`${ev.date}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < result.events.length - 1 && (
                          <span aria-hidden className="absolute left-[11px] top-6 h-full w-px bg-ink/15" />
                        )}
                        <span
                          className={`relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                            i === 0 ? "bg-ink text-white" : "bg-pale-2 text-ink/60"
                          }`}
                        >
                          {i === 0 ? <CheckIcon className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
                        </span>
                        <div>
                          <p className={`text-base ${i === 0 ? "font-semibold" : "text-ink/80"}`}>{ev.status}</p>
                          <p className="text-sm text-ink/60">
                            {[formatDate(ev.date), ev.location].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {result.trackUrl && (
                  <a
                    href={result.trackUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-7 inline-flex min-h-11 items-center gap-2 text-base font-semibold underline underline-offset-4"
                  >
                    Full courier tracking <ArrowUpRight className="size-4" />
                  </a>
                )}
              </>
            )}
          </div>
        )}

        <p className="mt-10 text-base text-ink/75">
          Need help? Email{" "}
          <a href={`mailto:${shippingInfo.support.email}`} className="font-semibold text-ink underline underline-offset-4">
            {shippingInfo.support.email}
          </a>{" "}
          or call +91 {shippingInfo.support.phone}. See our{" "}
          <Link href="/policies/shipping-and-returns" className="font-semibold text-ink underline underline-offset-4">
            shipping policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
