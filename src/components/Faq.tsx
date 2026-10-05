"use client";

import { useState } from "react";
import { ChevronDown } from "./icons";

export function Faq({ items, heading = "Frequently Asked Questions" }: { items: { q: string; a: string }[]; heading?: string }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faqs" className="bg-white px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[900px]">
        <h2 className="mb-10 text-center text-[clamp(24px,3vw,36px)] font-bold md:mb-12">{heading}</h2>
        <div className="space-y-1">
          {items.map((it, i) => {
            const active = open === i;
            return (
              <div key={it.q} className="overflow-hidden rounded-[20px] bg-pale shadow-[inset_0_15px_22px_rgb(40_42_49/0.04)] md:rounded-[30px]">
                <button
                  type="button"
                  aria-expanded={active}
                  onClick={() => setOpen(active ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-6 text-center md:px-7"
                >
                  <span className="flex-1 text-[16px] font-semibold md:text-[22px]">{it.q}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 transition-transform duration-300 ${active ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-[600ms] ease-circ ${
                    active ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <p className="overflow-hidden px-6 text-center text-[14px] leading-snug text-mist md:px-10 md:text-[17px]">
                    <span className="block pb-6">{it.a}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
