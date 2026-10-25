"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { altFor } from "@/lib/imageAlt";
import { ArrowRight, CheckIcon, CloseIcon } from "./icons";

export type DeckCard = {
  slug: string;
  name: string;
  certifiedAs: string;
  number: string;
  certificate: string;
  photo: string;
  backdrop: string;
};

// A fanned deck of flip cards: the front shows the product, the back its dermatology
// certificate. Arrows, swipe, keyboard or tapping a side card moves through the deck.
export function CertificateDeck({ cards, standard }: { cards: DeckCard[]; standard: string }) {
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  // After a swipe the browser still fires a click, which would land on the card that just
  // slid under the pointer; ignore clicks for a moment.
  const swipedAt = useRef(0);
  const n = cards.length;

  const go = useCallback(
    (to: number) => {
      setActive(((to % n) + n) % n);
      setFlipped(false);
    },
    [n],
  );

  // Full-size view: Escape closes it, and the page doesn't scroll underneath.
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (zoom === null) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoom]);

  return (
    <div>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Product certificates"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(active + 1);
          if (e.key === "ArrowLeft") go(active - 1);
        }}
        className="relative mx-auto h-[440px] w-full max-w-[460px] outline-none [perspective:1600px] sm:h-[500px]"
      >
        {cards.map((c, i) => {
          const offset = (i - active + n) % n; // 0 = front, 1 = right, n-1 = left
          const front = offset === 0;
          const side = offset === 1 ? 1 : -1;
          const pose = front
            ? "translateX(-50%) rotate(0deg) scale(1)"
            : `translateX(calc(-50% + ${side * 34}%)) rotate(${side * 7}deg) scale(0.86)`;
          return (
            <div
              key={c.slug}
              className="absolute left-1/2 top-2 h-[420px] w-[300px] transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none sm:h-[480px] sm:w-[340px]"
              style={{
                transform: pose,
                zIndex: front ? 30 : 20 - offset,
                opacity: front ? 1 : 0.75,
                filter: front ? "none" : "saturate(0.7) brightness(0.92)",
              }}
              aria-hidden={!front}
            >
              {front ? (
                <button
                  type="button"
                  aria-label={flipped ? `Show ${c.name}` : `Show the dermatology certificate for ${c.name}`}
                  aria-pressed={flipped}
                  onPointerDown={(e) => {
                    start.current = { x: e.clientX, y: e.clientY };
                    // Keep receiving the pointer even if it leaves the card mid-swipe.
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerCancel={() => (start.current = null)}
                  // Stops the browser's own "drag this image" gesture from swallowing the swipe.
                  onDragStart={(e) => e.preventDefault()}
                  onPointerUp={(e) => {
                    const s = start.current;
                    start.current = null;
                    if (!s) return;
                    const dx = e.clientX - s.x;
                    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
                      swipedAt.current = Date.now();
                      go(active + (dx < 0 ? 1 : -1));
                    } else setFlipped((f) => !f);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setFlipped((f) => !f);
                    }
                  }}
                  className="group relative block h-full w-full cursor-pointer touch-pan-y select-none text-left [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
                  style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  <CardFront card={c} standard={standard} />
                  <CardBack card={c} />
                </button>
              ) : (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    if (Date.now() - swipedAt.current > 400) go(i);
                  }}
                  className="relative block h-full w-full cursor-pointer text-left"
                >
                  <CardFront card={c} standard={standard} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label="Previous certificate"
          className="grid size-11 place-items-center rounded-full border border-ink/20 bg-white transition-colors hover:bg-ink hover:text-white"
        >
          <ArrowRight className="size-4 rotate-180" />
        </button>
        <div role="tablist" aria-label="Choose a product" className="flex gap-1.5 rounded-full bg-white p-1 ring-1 ring-ink/10">
          {cards.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => go(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                i === active ? "bg-ink text-white" : "text-ink/65 hover:text-ink"
              }`}
            >
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label="Next certificate"
          className="grid size-11 place-items-center rounded-full border border-ink/20 bg-white transition-colors hover:bg-ink hover:text-white"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex min-h-11 items-center justify-center gap-3 text-sm text-ink/55" aria-live="polite">
        {flipped ? (
          <>
            <span>Certificate {cards[active].number}</span>
            <button
              type="button"
              onClick={() => setZoom(active)}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              View full size
            </button>
          </>
        ) : (
          <span>Tap the card to see its certificate</span>
        )}
      </div>

      {zoom !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Certificate for ${cards[zoom].name}`}
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-h-[92svh] w-full max-w-[640px]">
            <button
              ref={closeBtn}
              type="button"
              onClick={() => setZoom(null)}
              aria-label="Close"
              className="absolute -top-3 right-0 z-10 grid size-11 -translate-y-full place-items-center rounded-full bg-white text-ink sm:-right-14 sm:top-0 sm:translate-y-0"
            >
              <CloseIcon className="size-5" />
            </button>
            <div className="relative aspect-[1131/1600] max-h-[92svh] overflow-hidden rounded-xl bg-white shadow-2xl">
              <Image draggable={false} src={cards[zoom].certificate} alt={altFor(cards[zoom].certificate)} fill sizes="640px" className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardFront({ card: c, standard }: { card: DeckCard; standard: string }) {
  return (
    <span
      className="absolute inset-0 overflow-hidden rounded-[28px] text-white shadow-[0_30px_70px_-20px_rgb(0_0_0/0.5)] [backface-visibility:hidden]"
      style={{ background: c.backdrop }}
    >
      <Image draggable={false} src={c.photo} alt={altFor(c.photo)} fill sizes="340px" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-800">
        <CheckIcon className="size-3.5" /> Dermatologically tested
      </span>
      <span className="absolute inset-x-0 bottom-0 p-5">
        <span className="block font-serif text-[30px] italic leading-none">{c.name}</span>
        <span className="mt-2 block text-sm text-white/85">Non-irritant · Skin irritation test, {standard}</span>
        <span className="mt-4 flex items-center justify-between gap-3 border-t border-white/20 pt-3">
          <span className="font-mono text-[11px] tracking-wider text-white/70">{c.number}</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
            See certificate <FlipIcon />
          </span>
        </span>
      </span>
    </span>
  );
}

function CardBack({ card: c }: { card: DeckCard }) {
  return (
    <span
      className="absolute inset-0 flex flex-col overflow-hidden rounded-[28px] bg-white text-ink shadow-[0_30px_70px_-20px_rgb(0_0_0/0.5)] ring-1 ring-ink/10 [backface-visibility:hidden]"
      style={{ transform: "rotateY(180deg)" }}
    >
      <span className="relative m-3 mb-0 flex-1 overflow-hidden rounded-[18px] bg-pale">
        <Image draggable={false} src={c.certificate} alt={altFor(c.certificate)} fill sizes="340px" className="object-contain" />
      </span>
      <span className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{c.certifiedAs}</span>
          <span className="block font-mono text-[11px] text-ink/55">{c.number}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-ink/60">
          Flip back <FlipIcon />
        </span>
      </span>
    </span>
  );
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
