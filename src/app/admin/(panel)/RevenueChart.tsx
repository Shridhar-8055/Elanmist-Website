"use client";

import { useState } from "react";

type Day = { day: string; revenue: number; orders: number };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const short = (d: string) => new Date(`${d}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** Round a max up to a friendly axis top (1, 2, 3, 4, 5, 6, 8 × 10^n); half-way ticks stay round. */
function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 3, 4, 5, 6, 8, 10].find((m) => m * p >= v) ?? 10) * p;
}

// Daily paid revenue: one series, so one brand colour and no legend (the title names it).
export function RevenueChart({ data }: { data: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const W = 720;
  const H = 220;
  const pad = { top: 12, right: 8, bottom: 26, left: 52 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.max(2, slot - 2); // 2px surface gap between bars
  const ticks = [0, 0.5, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / 8);
  const active = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Revenue per day</h2>
        <button type="button" onClick={() => setTable((v) => !v)} className="text-sm font-semibold text-ink/70 underline underline-offset-4">
          {table ? "Show chart" : "Show as table"}
        </button>
      </div>

      {table ? (
        <div className="max-h-[260px] overflow-y-auto rounded-xl ring-1 ring-ink/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-pale text-left text-ink/60">
              <tr>
                <th className="px-3 py-2 font-medium">Day</th>
                <th className="px-3 py-2 text-right font-medium">Orders</th>
                <th className="px-3 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {[...data].reverse().map((d) => (
                <tr key={d.day}>
                  <td className="px-3 py-2">{short(d.day)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.orders}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{inr(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Keeps axis text readable on phones: the chart scrolls inside its card instead of shrinking.
        <div className="overflow-x-auto">
        <div className="relative min-w-[560px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Paid revenue per day">
            {ticks.map((t) => {
              const y = pad.top + innerH - (t / max) * innerH;
              return (
                <g key={t}>
                  <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="currentColor" className="text-ink/[0.07]" />
                  <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-ink/50 text-[11px] tabular-nums">
                    {t >= 1000 ? `₹${(t / 1000).toLocaleString("en-IN")}k` : `₹${t}`}
                  </text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const h = d.revenue > 0 ? Math.max(2, (d.revenue / max) * innerH) : 0;
              const x = pad.left + i * slot + 1;
              const y = pad.top + innerH - h;
              const r = Math.min(4, barW / 2, h);
              return (
                <g key={d.day}>
                  {h > 0 && (
                    // Rounded top, square base anchored on the axis.
                    <path
                      d={`M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`}
                      className={hover === null || hover === i ? "fill-wine" : "fill-wine/35"}
                    />
                  )}
                  {/* Hit target taller and wider than the bar. */}
                  <rect
                    x={pad.left + i * slot}
                    y={pad.top}
                    width={slot}
                    height={innerH}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${short(d.day)}: ${inr(d.revenue)} from ${d.orders} order${d.orders === 1 ? "" : "s"}`}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    onTouchStart={() => setHover(i)}
                    className="outline-none"
                  />
                  {i % labelEvery === 0 && (
                    <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-ink/50 text-[11px]">
                      {short(d.day)}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={pad.left} x2={W - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke="currentColor" className="text-ink/20" />
          </svg>
          {active && hover !== null && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lg"
              style={{ left: `${((pad.left + hover * slot + slot / 2) / W) * 100}%` }}
            >
              <p className="font-semibold">{short(active.day)}</p>
              <p className="mt-0.5 tabular-nums">
                {inr(active.revenue)} · {active.orders} order{active.orders === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}
