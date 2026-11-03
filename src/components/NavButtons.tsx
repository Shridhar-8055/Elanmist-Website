"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** Smooth-scrolls to the top (instantly for reduced-motion users) and moves focus there. */
export function BackToTop({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        // Keyboard and screen-reader users land at the top too.
        const target = document.getElementById("main") ?? document.body;
        target.focus({ preventScroll: true });
      }}
    >
      {children}
    </button>
  );
}

/** Goes to the previous page, or to `fallback` if the visitor arrived here directly. */
export function GoBack({ className, children, fallback = "/" }: { className?: string; children: ReactNode; fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        // A tab opened straight on this page has nothing to go back to.
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      {children}
    </button>
  );
}
