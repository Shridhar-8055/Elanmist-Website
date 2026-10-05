"use client";

import { useState } from "react";
import { averageRating, type Review } from "@/lib/products";
import { ChevronDown, StarIcon } from "./icons";

export function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-ink" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= Math.round(value)} className={className} />
      ))}
    </span>
  );
}

const PER_PAGE = 4;

export function Reviews({ reviews }: { reviews: Review[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const avg = averageRating(reviews);
  const pages = Math.max(1, Math.ceil(reviews.length / PER_PAGE));
  const shown = reviews.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <section className="bg-white px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[1000px]">
        <h2 className="mb-12 text-center text-[clamp(24px,4vw,48px)] font-bold tracking-[0.02em]">The Verdict Is In</h2>

        <div className="grid gap-10 md:grid-cols-[300px_1fr] md:gap-16">
          <div className="rounded-[28px] bg-pale p-7 text-center md:text-left">
            <p className="text-6xl font-black tracking-tight">{avg ? avg.toFixed(1) : "–"}</p>
            <div className="mt-2">
              <Stars value={avg} className="size-5" />
            </div>
            <p className="mt-2 text-sm text-mist">
              Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </p>
            <div className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((s) => {
                const n = reviews.filter((r) => r.rating === s).length;
                const pct = reviews.length ? Math.round((n / reviews.length) * 100) : 0;
                return (
                  <div key={s} className="flex items-center gap-3 text-xs text-mist">
                    <span className="w-3">{s}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                      <span className="block h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-8 text-right tabular-nums">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            {shown.map((r, i) => {
              const idx = page * PER_PAGE + i;
              const active = open === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setOpen(active ? null : idx)}
                  className={`mb-2 block w-full rounded-[20px] px-6 py-7 text-center transition-colors duration-300 ${
                    active ? "bg-pale" : "hover:bg-pale/60"
                  }`}
                >
                  <Stars value={r.rating} />
                  <p className="mt-2 text-lg font-bold uppercase tracking-[0.08em]">{r.title}</p>
                  <p className="mt-1 text-sm text-mist">{r.author}</p>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-500 ${
                      active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <p className="overflow-hidden text-[15px] leading-relaxed">
                      <span className="block pt-4">{r.body}</span>
                    </p>
                  </div>
                  <ChevronDown className={`mx-auto mt-3 size-4 text-mist transition-transform ${active ? "rotate-180" : ""}`} />
                </button>
              );
            })}

            {pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 text-sm">
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`size-8 rounded-full ${i === page ? "bg-ink font-bold text-white" : "text-mist"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
