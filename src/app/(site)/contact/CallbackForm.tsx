"use client";

import { useState } from "react";

export function CallbackForm() {
  const [sent, setSent] = useState(false);

  if (sent) return <p className="mt-8 text-lg">Thanks — we&apos;ll call you back soon.</p>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: connect to the client's support inbox / CRM.
        setSent(true);
      }}
      className="mt-8 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
    >
      <input
        required
        placeholder="Your name"
        aria-label="Your name"
        className="h-[52px] rounded-full bg-white px-6 text-[15px] outline-none focus:ring-2 focus:ring-mist/30"
      />
      <input
        required
        type="tel"
        inputMode="tel"
        pattern="[0-9+ ]{10,14}"
        placeholder="Phone number"
        aria-label="Phone number"
        className="h-[52px] rounded-full bg-white px-6 text-[15px] outline-none focus:ring-2 focus:ring-mist/30"
      />
      <button type="submit" className="pill-dark h-[52px] rounded-full px-8 text-[15px]">
        Call me back
      </button>
    </form>
  );
}
