// Decorative coupon tickets drawn in SVG (original artwork, no stock images) that float
// behind the referral banner's code stub. Purely visual: hidden from screen readers and
// never catches clicks.

type Ticket = {
  accent: string;
  top: string;
  left: string;
  width: string;
  rotate: number;
  opacity: number;
  delay: string;
  big: string;
  small: string;
};

const TICKETS: Ticket[] = [
  { accent: "#e8a6b3", top: "-6%", left: "38%", width: "min(300px,62%)", rotate: 14, opacity: 0.85, delay: "0s", big: "FREE", small: "1 PRODUCT ON US" },
  { accent: "#9fb2f0", top: "76%", left: "-12%", width: "min(260px,54%)", rotate: -12, opacity: 0.7, delay: "-2.5s", big: "100%", small: "OFF · PAY DELIVERY" },
  { accent: "#e9c3a8", top: "80%", left: "60%", width: "min(220px,46%)", rotate: 8, opacity: 0.6, delay: "-5s", big: "GIFT", small: "SHARE THE GLOW" },
];

function TicketSvg({ t, id }: { t: Ticket; id: string }) {
  return (
    <svg viewBox="0 0 320 150" className="block h-auto w-full" role="presentation">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.accent} stopOpacity="0.95" />
          <stop offset="1" stopColor={t.accent} stopOpacity="0.55" />
        </linearGradient>
        {/* Notched ticket: side half-circles and a row of punched holes along the tear line. */}
        <mask id={`${id}-cut`}>
          <rect width="320" height="150" rx="18" fill="#fff" />
          <circle cx="0" cy="75" r="16" fill="#000" />
          <circle cx="320" cy="75" r="16" fill="#000" />
          <circle cx="226" cy="0" r="11" fill="#000" />
          <circle cx="226" cy="150" r="11" fill="#000" />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx="226" cy={22 + i * 13.3} r="2.6" fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${id}-cut)`}>
        <rect width="320" height="150" fill={`url(#${id}-fill)`} />
        {/* Fine guilloche-style lines, like printed vouchers. */}
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M-10 ${30 + i * 16} C 60 ${10 + i * 16}, 140 ${50 + i * 16}, 230 ${24 + i * 16}`}
            stroke="#1a080b"
            strokeOpacity="0.08"
            strokeWidth="1.2"
            fill="none"
          />
        ))}
        <text x="28" y="88" fill="#1a080b" fontFamily="var(--font-inter-tight), system-ui, sans-serif" fontWeight="900" fontSize="58" letterSpacing="-2">
          {t.big}
        </text>
        <text x="30" y="118" fill="#1a080b" fillOpacity="0.7" fontFamily="var(--font-inter), system-ui, sans-serif" fontWeight="700" fontSize="12.5" letterSpacing="2.5">
          {t.small}
        </text>
        <text x="30" y="38" fill="#1a080b" fillOpacity="0.55" fontFamily="var(--font-instrument), Georgia, serif" fontStyle="italic" fontSize="17">
          Elanmist
        </text>
        {/* Stub: a little gift mark. */}
        <g transform="translate(252 50)" stroke="#1a080b" strokeOpacity="0.6" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="0" y="16" width="44" height="34" rx="4" />
          <path d="M-3 16h50M22 16v34" />
          <path d="M22 16c-4-12-18-14-18-5 0 6 10 5 18 5zm0 0c4-12 18-14 18-5 0 6-10 5-18 5z" />
        </g>
      </g>
    </svg>
  );
}

export function CouponArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {TICKETS.map((t, i) => (
        <div
          key={t.big}
          className="absolute"
          style={{ top: t.top, left: t.left, width: t.width, opacity: t.opacity, transform: `rotate(${t.rotate}deg)` }}
        >
          <div
            // Phones stack the code under the copy, so only the top ticket shows there (softer).
            className={`animate-[ticket-float_7s_ease-in-out_infinite] drop-shadow-[0_18px_30px_rgb(0_0_0/0.35)] ${
              i === 0 ? "max-md:opacity-50" : "max-md:hidden"
            }`}
            style={{ animationDelay: t.delay }}
          >
            <TicketSvg t={t} id={`ticket-${i}`} />
          </div>
        </div>
      ))}
      {/* Darken the middle so the code box and copy stay easy to read. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_center,#1a080b_30%,rgb(26_8_11/0.5)_70%,transparent_100%)]" />
    </div>
  );
}

/** Faint repeating pattern of % and ticket marks for the banner's main side. */
export const couponPattern = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='#e8a6b3' stroke-opacity='0.06' stroke-width='1.6'><path d='M18 40l20-20'/><circle cx='20' cy='22' r='4'/><circle cx='36' cy='38' r='4'/><path d='M74 78h30a4 4 0 0 1 4 4v4a5 5 0 0 0 0 10v4a4 4 0 0 1-4 4H74a4 4 0 0 1-4-4v-4a5 5 0 0 0 0-10v-4a4 4 0 0 1 4-4z'/><path d='M94 78v26' stroke-dasharray='2 3'/></g></svg>`,
)}")`;
