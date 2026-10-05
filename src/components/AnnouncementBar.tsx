"use client";

import { useEffect, useState } from "react";
import { shippingInfo } from "@/lib/products";

// Shipping facts come from the client's current policy (see shippingInfo).
const messages = [
  shippingInfo.freeShipping,
  "Ships in 1–2 business days · COD available",
  "Powered with Indian Gooseberry · Made in India",
];

export function AnnouncementBar() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative z-50 h-9 overflow-hidden bg-ink text-white" role="region" aria-label="Store announcements">
      <div
        className="flex flex-col transition-transform duration-500 ease-in-out"
        style={{ transform: `translateY(-${i * 2.25}rem)` }}
      >
        {messages.map((m) => (
          <p
            key={m}
            className="flex h-9 shrink-0 items-center justify-center px-4 text-center text-xs font-semibold uppercase tracking-[0.1em] sm:text-[13px]"
          >
            {m}
          </p>
        ))}
      </div>
    </div>
  );
}
