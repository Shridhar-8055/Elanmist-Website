"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { inr, products, shippingInfo } from "@/lib/products";
import {
  BagIcon,
  ChatIcon,
  CloseIcon,
  DocIcon,
  HomeIcon,
  LeafIcon,
  MenuIcon,
  SearchIcon,
  SparkIcon,
  TruckIcon,
} from "./icons";
import { Wordmark } from "./Wordmark";

const nav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/skin-quiz", label: "Skin Quiz" },
  { href: "/our-vision", label: "Our Vision" },
  { href: "/contact", label: "Contact" },
];

const mobileLinks = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/skin-quiz", label: "Skin Quiz", Icon: SparkIcon },
  { href: "/our-vision", label: "Our Vision", Icon: LeafIcon },
  { href: "/contact", label: "Contact", Icon: ChatIcon },
  { href: "/track", label: "Track Order", Icon: TruckIcon },
  { href: "/policies/shipping-and-returns", label: "Shipping", Icon: DocIcon },
];

export function Header() {
  const pathname = usePathname();
  const { count, open: openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu and search on navigation (state adjusted during render, per React docs).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  // "/" opens search from anywhere, like most shops.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
        if (window.innerWidth < 1024) setMenuOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pages that open on a dark, full-bleed visual get a light logo until scrolled.
  const darkTop = pathname === "/";
  const light = darkTop && !scrolled && !menuOpen;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]));

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-300 ${
        darkTop ? "-mb-[68px]" : ""
      } ${scrolled || menuOpen ? "bg-white/95 shadow-[0_1px_0_rgb(0_0_0/0.08)] backdrop-blur-xl" : "bg-transparent"}`}
    >
      <div className="mx-auto grid h-[68px] max-w-[1440px] grid-cols-[1fr_auto] items-center gap-4 px-4 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link
          href="/"
          aria-label="Elanmist home"
          className={`flex h-11 items-center text-[28px] leading-none transition-colors ${light ? "text-white" : "text-ink"}`}
        >
          <Wordmark />
        </Link>

        {/* Desktop pill nav, swapped for the search field when search is open. */}
        <div className="relative hidden lg:block">
          {searchOpen ? (
            <SearchBox onClose={() => setSearchOpen(false)} />
          ) : (
            <nav
              aria-label="Main"
              className="flex h-[46px] items-center gap-[clamp(1.25rem,2.8vw,3rem)] rounded-full border border-black/5 bg-white px-8 shadow-[0_2px_12px_rgb(0_0_0/0.08)]"
            >
              {nav.map((n) => {
                const active = isActive(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative py-1 text-[15px] transition-colors hover:text-ink ${
                      active ? "font-semibold text-ink" : "font-medium text-ink/65"
                    }`}
                  >
                    {n.label}
                    {active && <span className="absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-ink" />}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            aria-label="Search products"
            title="Search (press /)"
            onClick={() => {
              setSearchOpen((v) => !v);
              if (window.innerWidth < 1024) setMenuOpen(true);
            }}
            className={`flex h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors lg:px-4 ${
              light ? "border-white/70 bg-black/20 text-white hover:bg-black/35" : "border-ink/20 bg-white text-ink hover:bg-pale"
            }`}
          >
            <SearchIcon className="size-5" />
            <span className="hidden lg:inline">Search</span>
          </button>
          <button
            type="button"
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            onClick={openCart}
            className={`relative flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-transform hover:scale-[1.03] lg:px-4 ${
              light ? "bg-white text-ink" : "bg-ink text-white"
            }`}
          >
            <BagIcon className="size-5" />
            <span className="hidden lg:inline">Cart</span>
            <span
              className={`grid min-w-[22px] place-items-center rounded-full px-1.5 text-xs font-bold leading-[22px] ${
                light
                  ? count > 0 ? "bg-ink text-white" : "bg-ink/10 text-ink"
                  : count > 0 ? "bg-white text-ink" : "bg-white/20 text-white"
              }`}
            >
              {count}
            </span>
          </button>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={`grid size-11 place-items-center rounded-full border lg:hidden ${
              light ? "border-white/70 bg-black/20 text-white" : "border-ink/20 bg-white text-ink"
            }`}
          >
            {menuOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu: search, every product with its price, then clearly labelled pages. */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 top-[68px] bg-ink/40 transition-opacity duration-300 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`fixed inset-x-0 top-[68px] overflow-y-auto rounded-b-[28px] bg-white shadow-2xl transition-[max-height] duration-[650ms] ease-circ lg:hidden ${
          menuOpen ? "max-h-[calc(100svh-68px)]" : "max-h-0"
        }`}
      >
        <nav aria-label="Mobile" className="space-y-5 p-4 pb-7">
          <SearchBox onClose={() => setMenuOpen(false)} tone="dark" autoFocus={searchOpen} />

          <div>
            <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Shop</p>
            <ul className="divide-y divide-pale-2 overflow-hidden rounded-[20px] border border-pale-2">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link href={`/products/${p.slug}`} className="flex items-center gap-3 p-3 active:bg-pale">
                    <Image
                      src={p.image}
                      alt={p.imageAlt}
                      width={52}
                      height={52}
                      className="size-[52px] rounded-xl object-cover"
                      style={{ background: p.backdrop }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold">{p.name}</span>
                      <span className="block truncate text-sm text-ink/70">{p.tagline}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-base font-bold">{inr(p.price)}</span>
                      <span className="block text-xs text-ink/55 line-through">{inr(p.mrp)}</span>
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="flex items-center justify-between p-4 text-base font-semibold">
                  Shop all products <BagIcon className="size-5" />
                </Link>
              </li>
            </ul>
          </div>

          <ul className="grid grid-cols-2 gap-2">
            {mobileLinks.map(({ href, label, Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`flex h-14 items-center gap-3 rounded-2xl px-4 text-base font-medium ${
                    isActive(href) ? "bg-ink text-white" : "bg-pale text-ink"
                  }`}
                >
                  <Icon className="size-5 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="flex items-center gap-2 rounded-2xl bg-pale px-4 py-3 text-sm text-ink/80">
            <TruckIcon className="size-5 shrink-0" /> {shippingInfo.freeShipping}
          </p>
        </nav>
      </div>
    </header>
  );
}

function SearchBox({
  onClose,
  tone = "light",
  autoFocus = true,
}: {
  onClose: () => void;
  tone?: "light" | "dark";
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products.filter((p) =>
      [p.name, p.tagline, p.summary, ...p.ingredients.map((i) => i.name)].join(" ").toLowerCase().includes(term),
    );
  }, [q]);

  return (
    <div className="relative">
      <div
        className={`flex h-12 items-center gap-2 rounded-full px-4 lg:h-[46px] lg:w-[560px] ${
          tone === "dark" ? "border border-ink/15 bg-pale text-ink" : "border border-ink/15 bg-white text-ink shadow-[0_2px_12px_rgb(0_0_0/0.08)]"
        }`}
      >
        <SearchIcon className="size-5 shrink-0 text-ink/60" />
        <input
          ref={ref}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          aria-label="Search products"
          placeholder="Search sunscreen, niacinamide, hydration…"
          className="w-full bg-transparent text-base outline-none placeholder:text-ink/50"
        />
        {tone === "light" && (
          <button type="button" aria-label="Close search" onClick={onClose}>
            <CloseIcon className="size-5 text-ink/70" />
          </button>
        )}
      </div>
      {q && (
        <div className="absolute inset-x-0 top-[50px] z-50 max-h-[420px] overflow-y-auto rounded-2xl bg-white p-2 text-ink shadow-[0_8px_32px_rgb(0_0_0/0.14)]">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">Products</p>
          {results.length ? (
            results.map((p) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-pale"
              >
                <Image
                  src={p.image}
                  alt={p.imageAlt}
                  width={44}
                  height={44}
                  className="size-11 rounded-md object-cover"
                  style={{ background: p.backdrop }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block text-sm font-semibold text-ink/80">{inr(p.price)}</span>
                </span>
              </Link>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-ink/50">No products match “{q}”.</p>
          )}
        </div>
      )}
    </div>
  );
}
