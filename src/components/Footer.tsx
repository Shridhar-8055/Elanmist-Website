import Link from "next/link";
import { products, shippingInfo } from "@/lib/products";
import { ArrowRight, ArrowUpRight, ClockIcon, HeadsetIcon, InstagramIcon, ReturnIcon, TruckIcon } from "./icons";
import { Wordmark } from "./Wordmark";

const columns = [
  {
    title: "Shop",
    links: [
      ...products.map((p) => ({ href: `/products/${p.slug}`, label: p.name })),
      { href: "/shop", label: "Shop all" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/our-vision", label: "Our Vision" },
      { href: "/skin-quiz", label: "Skin Quiz" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact#faqs", label: "FAQs" },
      { href: "/contact#callback", label: "Request a callback" },
      { href: "/contact#track", label: "Track your order" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/policies/shipping-and-returns", label: "Shipping & Returns" },
      { href: "/policies/privacy", label: "Privacy Policy" },
      { href: "/policies/terms", label: "Terms & Conditions" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#1a080b] font-dm text-white">
      {/* Soft rose glow, echoing the sunscreen photography. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-[#e8a6b3] opacity-[0.07] blur-3xl"
      />

      <div className="relative mx-auto max-w-[1280px] px-5 pt-20 md:px-8 md:pt-28">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <h2 className="font-poppins text-[clamp(40px,5.6vw,84px)] font-light leading-[1.05] tracking-[-0.03em]">
              Embrace your <em className="text-[#e8a6b3]">natural</em> radiance.
            </h2>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-6 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                Shop the range <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/skin-quiz"
                className="inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-sm ring-1 ring-white/25 transition-colors hover:bg-white/10"
              >
                Find your match
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] bg-white/[0.05] p-7 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <HeadsetIcon className="size-5 text-[#e8a6b3]" />
              <p className="text-sm font-semibold">Customer care</p>
            </div>
            <p className="mt-4 text-[15px] text-white/85">Monday to Saturday, 10 AM – 7 PM</p>
            <p className="mt-2 flex flex-wrap gap-x-4 text-[15px]">
              <a href={`mailto:${shippingInfo.support.email}`} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
                {shippingInfo.support.email}
              </a>
              <a href={`tel:+91${shippingInfo.support.phone}`} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
                +91 {shippingInfo.support.phone}
              </a>
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/contact#callback"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] transition-colors hover:bg-white/20"
              >
                Request a callback <ArrowUpRight className="size-3.5" />
              </Link>
              <a
                href="https://www.instagram.com/elanmist/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-[13px] transition-colors hover:bg-white/20"
              >
                <InstagramIcon className="size-4" /> @elanmist
              </a>
            </div>
          </div>
        </div>

        {/* Shipping, delivery and returns at a glance. */}
        <ul className="mt-16 grid gap-3 sm:grid-cols-3">
          {[
            { Icon: TruckIcon, title: shippingInfo.freeShipping, body: "Pay securely by UPI, card or netbanking" },
            { Icon: ClockIcon, title: "Dispatched in 1–2 business days", body: "Delivered in 5–7 business days" },
            { Icon: ReturnIcon, title: "Damaged or wrong item?", body: "Report within 48 hours for a replacement" },
          ].map(({ Icon, title, body }) => (
            <li key={title}>
              <Link
                href="/policies/shipping-and-returns"
                className="flex h-full items-start gap-3 rounded-[22px] bg-white/[0.06] p-5 ring-1 ring-white/10 transition-colors hover:bg-white/10"
              >
                <Icon className="mt-0.5 size-6 shrink-0 text-[#e8a6b3]" />
                <span>
                  <span className="block text-[15px] font-semibold">{title}</span>
                  <span className="mt-0.5 block text-sm text-white/80">{body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <nav aria-label="Footer" className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 md:mt-20 md:grid-cols-4">
          {columns.map((c) => (
            <div key={c.title} className="border-t border-white/15 pt-5">
              <p className="font-poppins text-lg font-medium text-white/80">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-1.5 text-[15px] text-white/90 transition-colors hover:text-white"
                    >
                      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                        {l.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-16 flex flex-col-reverse items-start justify-between gap-4 border-t border-white/15 py-6 text-xs text-white/75 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Elanmist. Premium skincare powered by nature and science. Made in India.</p>
          <a href="#" className="inline-flex items-center gap-2 text-white/85 transition-colors hover:text-white">
            Back to top
            <span className="grid size-11 place-items-center rounded-full ring-1 ring-white/40">
              <ArrowRight className="size-3.5 -rotate-90" />
            </span>
          </a>
        </div>
      </div>

      {/* Oversized wordmark that fades out and bleeds off the bottom edge. */}
      <div aria-hidden className="relative -mb-[0.22em] select-none text-center leading-none">
        <Wordmark className="block font-poppins not-italic font-semibold tracking-[-0.05em] bg-gradient-to-b from-white/25 to-white/0 bg-clip-text pr-[0.08em] text-[clamp(96px,23vw,340px)] text-transparent" />
      </div>
    </footer>
  );
}
