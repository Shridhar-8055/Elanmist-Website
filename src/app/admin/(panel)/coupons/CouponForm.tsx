"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCouponAction } from "../../actions";

type Customer = { phone: string; name: string; email: string; orders: number };
type Kind = "free_product" | "percent" | "flat" | "free_shipping";

const KINDS: { kind: Kind; title: string; body: string }[] = [
  { kind: "percent", title: "% off", body: "e.g. 20% off the order" },
  { kind: "flat", title: "₹ off", body: "e.g. ₹100 off the order" },
  { kind: "free_product", title: "1 product free", body: "Priciest unit free, pays delivery" },
  { kind: "free_shipping", title: "Free delivery", body: "No ₹70 delivery charge" },
];

const PERCENTS = [10, 15, 20, 25, 30, 50, 100];

const ALPHABET ="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode = () => "GIFT" + Array.from(crypto.getRandomValues(new Uint32Array(6)), (n) => ALPHABET[n % ALPHABET.length]).join("");

const input = "h-11 w-full rounded-xl border border-ink/20 bg-white px-3.5 text-[15px] outline-none focus:border-ink";
const label = "mb-1.5 block text-sm font-semibold";

export function CouponForm({ prefill, customers }: { prefill: { phone: string; email: string; name: string }; customers: Customer[] }) {
  const [state, action, pending] = useActionState(createCouponAction, null);
  const [kind, setKind] = useState<Kind>("percent");
  const [who, setWho] = useState<"everyone" | "customer">(prefill.phone || prefill.email ? "customer" : "everyone");
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [person, setPerson] = useState(prefill);
  const [search, setSearch] = useState(prefill.name || prefill.phone);
  const form = useRef<HTMLFormElement>(null);

  // Clear the form after a successful save.
  useEffect(() => {
    if (!state?.ok) return;
    form.current?.reset();
    /* eslint-disable react-hooks/set-state-in-effect -- resetting controlled fields after the server confirms */
    setCode("");
    setValue("");
    setPerson({ phone: "", email: "", name: "" });
    setSearch("");
    setWho("everyone");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [state]);

  const term = search.trim().toLowerCase();
  const matches =
    who === "customer" && term.length >= 2 && term !== person.name.toLowerCase()
      ? customers.filter((c) => [c.name, c.phone, c.email].join(" ").toLowerCase().includes(term)).slice(0, 6)
      : [];

  return (
    <form ref={form} action={action} className="mt-5 space-y-6">
      <fieldset>
        <legend className={label}>What does it give?</legend>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {KINDS.map((k) => (
            <label
              key={k.kind}
              className={`cursor-pointer rounded-xl p-3.5 ring-1 transition-colors ${kind === k.kind ? "bg-ink text-white ring-ink" : "bg-white ring-ink/15 hover:ring-ink/40"}`}
            >
              <input type="radio" name="kind" value={k.kind} checked={kind === k.kind} onChange={() => setKind(k.kind)} className="sr-only" />
              <span className="block text-[15px] font-semibold">{k.title}</span>
              <span className={`block text-xs ${kind === k.kind ? "text-white/70" : "text-ink/55"}`}>{k.body}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="c-code" className={label}>
            Code
          </label>
          <div className="flex gap-2">
            <input
              id="c-code"
              name="code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              maxLength={20}
              placeholder="DIWALI20"
              className={`${input} font-mono uppercase tracking-wider`}
            />
            <button type="button" onClick={() => setCode(randomCode())} className="shrink-0 rounded-xl px-3 text-sm font-semibold ring-1 ring-ink/15">
              Random
            </button>
          </div>
        </div>
        {(kind === "percent" || kind === "flat") && (
          <div>
            <label htmlFor="c-value" className={label}>
              {kind === "percent" ? "Percent off (any 1–100)" : "Amount off (₹)"}
            </label>
            <input
              id="c-value"
              name="value"
              type="number"
              required
              min={1}
              max={kind === "percent" ? 100 : 100000}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={input}
              placeholder={kind === "percent" ? "20" : "100"}
            />
            {kind === "percent" && (
              <>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Quick pick a percentage">
                  {PERCENTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={value === String(p)}
                      onClick={() => setValue(String(p))}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${value === String(p) ? "bg-ink text-white ring-ink" : "bg-white ring-ink/15 hover:ring-ink/40"}`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink/55">
                  {value === "100"
                    ? "100% off: every product is free and the customer pays only the ₹70 delivery."
                    : "Delivery stays free when the customer pays ₹500 or more for products; otherwise ₹70 is added."}
                </p>
              </>
            )}
          </div>
        )}
        <div>
          <label htmlFor="c-desc" className={label}>
            Note (only you see this)
          </label>
          <input id="c-desc" name="description" maxLength={120} className={input} placeholder="e.g. Diwali campaign" />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Who can use it?</legend>
        <div className="flex flex-wrap gap-2">
          {(["everyone", "customer"] as const).map((w) => (
            <label key={w} className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ring-1 ${who === w ? "bg-ink text-white ring-ink" : "bg-white ring-ink/15"}`}>
              <input type="radio" name="who" value={w} checked={who === w} onChange={() => setWho(w)} className="sr-only" />
              {w === "everyone" ? "Anyone with the code" : "One specific customer"}
            </label>
          ))}
        </div>

        {who === "customer" && (
          <div className="mt-4 rounded-xl bg-pale p-4">
            <label htmlFor="c-find" className={label}>
              Find a customer
            </label>
            <div className="relative">
              <input
                id="c-find"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a name, mobile or email"
                autoComplete="off"
                className={input}
              />
              {matches.length > 0 && (
                <ul className="absolute inset-x-0 top-12 z-10 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-ink/10">
                  {matches.map((c) => (
                    <li key={c.phone}>
                      <button
                        type="button"
                        onClick={() => {
                          setPerson({ phone: c.phone, email: c.email, name: c.name });
                          setSearch(c.name);
                        }}
                        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-pale"
                      >
                        <span>
                          <span className="font-semibold">{c.name}</span> <span className="text-ink/55">+91 {c.phone}</span>
                        </span>
                        <span className="text-xs text-ink/50">{c.orders} order{c.orders === 1 ? "" : "s"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-2 text-xs text-ink/55">Or type the details yourself — they don&apos;t need to have ordered before.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="c-name" className={label}>
                  Name
                </label>
                <input id="c-name" name="assigned_name" value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} className={input} />
              </div>
              <div>
                <label htmlFor="c-phone" className={label}>
                  Mobile
                </label>
                <input
                  id="c-phone"
                  name="assigned_phone"
                  inputMode="numeric"
                  value={person.phone}
                  onChange={(e) => setPerson({ ...person, phone: e.target.value })}
                  placeholder="10 digits"
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="c-email" className={label}>
                  Email
                </label>
                <input id="c-email" name="assigned_email" type="email" value={person.email} onChange={(e) => setPerson({ ...person, email: e.target.value })} className={input} />
              </div>
            </div>
            <p className="mt-2 text-xs text-ink/55">Only someone checking out with this mobile or email can use the code.</p>
          </div>
        )}
      </fieldset>

      <details className="rounded-xl ring-1 ring-ink/10">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Limits and dates (optional)</summary>
        <div className="grid gap-4 px-4 pb-4 sm:grid-cols-3">
          <div>
            <label htmlFor="c-min" className={label}>
              Minimum order (₹)
            </label>
            <input id="c-min" name="min_order" type="number" min={0} defaultValue={0} className={input} />
          </div>
          <div>
            <label htmlFor="c-max" className={label}>
              Total uses allowed
            </label>
            <input id="c-max" name="max_uses" type="number" min={1} placeholder="No limit" className={input} />
          </div>
          <div>
            <label htmlFor="c-per" className={label}>
              Uses per customer
            </label>
            <input id="c-per" name="per_customer" type="number" min={1} defaultValue={1} className={input} />
          </div>
          <div>
            <label htmlFor="c-start" className={label}>
              Starts
            </label>
            <input id="c-start" name="starts_at" type="datetime-local" className={input} />
          </div>
          <div>
            <label htmlFor="c-end" className={label}>
              Ends
            </label>
            <input id="c-end" name="expires_at" type="datetime-local" className={input} />
          </div>
          <p className="self-end pb-2 text-xs text-ink/55">Times are Indian time. Leave empty to start now and never end.</p>
        </div>
      </details>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          {state.message} It&apos;s in the list below.
        </p>
      )}

      <button type="submit" disabled={pending} className="h-12 rounded-full bg-ink px-7 text-[15px] font-semibold text-white disabled:opacity-60">
        {pending ? "Creating…" : "Create coupon"}
      </button>
    </form>
  );
}
