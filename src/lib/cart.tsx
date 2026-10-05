"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getProduct, products } from "./products";

type Line = { slug: string; qty: number };

type CartContextValue = {
  lines: (Line & { product: (typeof products)[number] })[];
  count: number;
  subtotal: number;
  mrpTotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "elanmist-cart";

// Cart lines live in a tiny external store backed by localStorage, so the server
// render (always empty) and the client's saved cart reconcile without mismatches.
const EMPTY: Line[] = [];
const listeners = new Set<() => void>();
let cache: Line[] | null = null;

function readCart(): Line[] {
  if (cache === null) {
    try {
      cache = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      // Storage can be unavailable (private mode); the cart just starts empty.
      cache = [];
    }
  }
  return cache!;
}

function writeCart(update: (prev: Line[]) => Line[]) {
  cache = update(readCart());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readCart, () => EMPTY);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  const add = useCallback((slug: string, qty = 1) => {
    writeCart((prev) => {
      const found = prev.find((l) => l.slug === slug);
      if (found) return prev.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { slug, qty }];
    });
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    writeCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.slug !== slug) : prev.map((l) => (l.slug === slug ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((slug: string) => writeCart((prev) => prev.filter((l) => l.slug !== slug)), []);
  const clear = useCallback(() => writeCart(() => []), []);

  const value = useMemo<CartContextValue>(() => {
    const lines = raw.flatMap((l) => {
      const product = getProduct(l.slug);
      return product ? [{ ...l, product }] : [];
    });
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + l.qty * l.product.price, 0),
      mrpTotal: lines.reduce((s, l) => s + l.qty * l.product.mrp, 0),
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQty,
      remove,
      clear,
    };
  }, [raw, isOpen, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
