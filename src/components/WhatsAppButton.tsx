"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getProduct, shippingInfo } from "@/lib/products";
import { CloseIcon } from "./icons";

const NUMBER = `91${shippingInfo.support.phone}`;
const SEEN_KEY = "elanmist-wa-greeting-seen";

/** Pre-filled message that mentions the product when the visitor is on a product page. */
function messageFor(pathname: string) {
  const slug = pathname.match(/^\/products\/([^/]+)/)?.[1];
  const product = slug ? getProduct(slug) : undefined;
  if (product) return `Hi Elanmist! I'm interested in the ${product.name}. Could you help me with a few questions?`;
  if (pathname.startsWith("/track") || pathname.startsWith("/account")) return "Hi Elanmist! I have a question about my order.";
  return "Hi Elanmist! I'd like to know more about your skincare products.";
}

// Floating WhatsApp chat button (bottom right) on every shop page. First-time visitors
// get a one-off greeting bubble. Sits below the header menu and the cart drawer.
export function WhatsAppButton() {
  const pathname = usePathname();
  const [greet, setGreet] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (seen) return;
    const show = setTimeout(() => {
      setGreet(true);
      // Once per visitor: remember it as soon as it has been shown.
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }, 4000);
    const hide = setTimeout(() => setGreet(false), 16000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  function dismiss() {
    setGreet(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent(messageFor(pathname))}`;
  // Product pages have a docked "Add to cart" bar on smaller screens; sit above it.
  const raised = pathname.startsWith("/products/");

  return (
    <div
      className={`fixed right-4 z-[35] flex flex-col items-end gap-3 md:right-6 ${
        raised ? "bottom-[104px] lg:bottom-6" : "bottom-5 md:bottom-6"
      } pb-[env(safe-area-inset-bottom)]`}
    >
      {greet && (
        <div role="status" className="relative max-w-[240px] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm text-ink shadow-[0_12px_40px_rgb(0_0_0/0.18)] ring-1 ring-black/5 motion-safe:animate-[fade-up_.4s_ease-out]">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close message"
            className="absolute -left-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-white"
          >
            <CloseIcon className="size-3" />
          </button>
          <p className="font-semibold">Questions about your skin?</p>
          <p className="mt-0.5 text-ink/70">Chat with us on WhatsApp — we usually reply within a few hours.</p>
        </div>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={dismiss}
        aria-label="Chat with Elanmist on WhatsApp"
        title="Chat with us on WhatsApp"
        className="group flex h-14 items-center gap-2 rounded-full bg-[#25D366] pl-4 pr-4 text-white shadow-[0_10px_30px_rgb(37_211_102/0.45)] transition-[transform,padding] duration-300 hover:scale-105 hover:pr-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-7 shrink-0 fill-current">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.62-.93-2.22-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.58-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.03C2.62 6.86 6.85 2.63 12.05 2.63a9.36 9.36 0 0 1 6.66 2.76 9.36 9.36 0 0 1 2.75 6.66c0 5.2-4.22 9.45-9.41 9.45zm8.02-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.72 5.8.72 12.04c0 2 .52 3.94 1.51 5.65L.62 23.5l5.95-1.56a11.3 11.3 0 0 0 5.48 1.4h.01c6.24 0 11.32-5.08 11.32-11.32 0-3.03-1.18-5.87-3.31-8z" />
        </svg>
        <span className="hidden text-[15px] font-semibold sm:inline">Chat with us</span>
      </a>
    </div>
  );
}
