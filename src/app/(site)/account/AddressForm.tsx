"use client";

import { useActionState } from "react";
import { INDIAN_STATES } from "@/lib/checkout-schema";
import { saveAddressAction } from "./actions";

export type SavedAddress = {
  name: string | null;
  phone: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
};

const input = "h-12 w-full rounded-2xl border border-ink/20 bg-white px-4 text-base outline-none focus:border-ink";
const label = "mb-1.5 block text-sm font-semibold";

export function AddressForm({ saved }: { saved: SavedAddress | null }) {
  const [state, action, pending] = useActionState(saveAddressAction, null);
  const v = (k: keyof SavedAddress) => saved?.[k] ?? "";
  return (
    <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="a-name" className={label}>Full name</label>
        <input id="a-name" name="name" autoComplete="name" defaultValue={v("name")} required className={input} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="a-phone" className={label}>Mobile number</label>
        <input id="a-phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" defaultValue={v("phone")} required className={input} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="a-1" className={label}>House no., building, street</label>
        <input id="a-1" name="address1" autoComplete="address-line1" defaultValue={v("address1")} required className={input} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="a-2" className={label}>Area, landmark (optional)</label>
        <input id="a-2" name="address2" autoComplete="address-line2" defaultValue={v("address2")} className={input} />
      </div>
      <div>
        <label htmlFor="a-city" className={label}>City</label>
        <input id="a-city" name="city" autoComplete="address-level2" defaultValue={v("city")} required className={input} />
      </div>
      <div>
        <label htmlFor="a-pin" className={label}>Pincode</label>
        <input id="a-pin" name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" defaultValue={v("pincode")} required className={input} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="a-state" className={label}>State</label>
        <select id="a-state" name="state" autoComplete="address-level1" defaultValue={v("state")} required className={input}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm font-semibold text-emerald-800 sm:col-span-2">
          ✓ Address saved
        </p>
      )}
      <button type="submit" disabled={pending} className="pill-dark h-12 rounded-full text-base font-semibold disabled:opacity-60 sm:col-span-2">
        {pending ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
