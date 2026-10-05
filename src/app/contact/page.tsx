import type { Metadata } from "next";
import Image from "next/image";
import { Faq } from "@/components/Faq";
import { HeadsetIcon, InstagramIcon, TruckIcon } from "@/components/icons";
import { shippingInfo } from "@/lib/products";
import { CallbackForm } from "./CallbackForm";
import { altFor } from "@/lib/imageAlt";

export const metadata: Metadata = { title: "Contact" };

const generalFaqs = [
  { q: "How long does delivery take?", a: "Orders are dispatched within 1–2 business days and delivered in 5–7 business days from dispatch. Remote areas may take a little longer." },
  { q: "Is shipping free?", a: "Yes, on orders above ₹500. Orders below ₹500 have a ₹49 delivery fee. You can pay securely by UPI, card, netbanking or wallet." },
  { q: "Can I return a product?", a: "For hygiene reasons, opened products can't be returned. If your order arrives damaged or wrong, report it within 48 hours with an unboxing video and we'll arrange a replacement." },
  { q: "Are Elanmist products suitable for sensitive skin?", a: "Yes. Every formula is designed to be gentle and skin-kind." },
  { q: "Are your products paraben-free?", a: "Yes. Our formulas are paraben-free and made in India." },
  { q: "How do I build a routine?", a: "Start with HydroBoost Gel or Glutathione Cream, and finish your morning with Hybrid Sunscreen." },
  { q: "Not sure which product is right for you?", a: "Take our skin quiz — it takes under a minute and matches you with a formula." },
];

export default function ContactPage() {
  return (
    <>
      <section className="px-4 pb-10 pt-12 md:pt-16">
        <div className="mx-auto max-w-[1280px]">
          <h1 className="display text-[clamp(52px,9vw,140px)]">
            Say Hi <span className="text-mist">to Us</span>
          </h1>
          <div className="mt-12 grid gap-3 md:grid-cols-3">
            <div className="group rounded-[28px] bg-mist p-2.5 pb-7 text-white">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[20px]">
                <Image src="/images/shoot/gel-vase.webp" alt={altFor("/images/shoot/gel-vase.webp")} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" style={{ objectPosition: "50% 65%" }} />
              </div>
              <HeadsetIcon className="mx-4 mt-6 size-7" />
              <h2 className="mt-4 px-4 text-xl font-bold">Customer care</h2>
              <p className="mt-2 px-4 text-sm text-white/90">Monday to Saturday, 10 AM – 7 PM</p>
              <p className="mt-2 flex flex-col px-4 text-[15px] font-semibold">
                <a href={`mailto:${shippingInfo.support.email}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
                  {shippingInfo.support.email}
                </a>
                <a href={`tel:+91${shippingInfo.support.phone}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
                  +91 {shippingInfo.support.phone}
                </a>
              </p>
            </div>
            <a
              href="https://www.instagram.com/elanmist/"
              target="_blank"
              rel="noreferrer"
              className="group rounded-[28px] bg-pale p-2.5 pb-7 transition-transform hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-[20px]">
                <Image src="/images/shoot/sunscreen-table.webp" alt={altFor("/images/shoot/sunscreen-table.webp")} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" style={{ objectPosition: "50% 50%" }} />
              </div>
              <InstagramIcon className="mx-4 mt-6 size-7" />
              <h2 className="mt-4 px-4 text-xl font-bold">@elanmist</h2>
              <p className="mt-2 px-4 text-sm text-mist">DM us for quick questions.</p>
            </a>
            <div id="track" className="group rounded-[28px] bg-pale p-2.5 pb-7">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[20px]">
                <Image src="/images/shoot/trio-group.webp" alt={altFor("/images/shoot/trio-group.webp")} fill sizes="(min-width: 768px) 33vw, 100vw" className="bg-white object-contain p-3 transition-transform duration-[1200ms] ease-out group-hover:scale-105" style={{ objectPosition: "50% 55%" }} />
              </div>
              <TruckIcon className="mx-4 mt-6 size-7" />
              <h2 className="mt-4 px-4 text-xl font-bold">Track your order</h2>
              {/* TODO: link to the client's shipping partner tracking page. */}
              <p className="mt-2 px-4 text-sm text-mist">Tracking details are sent by SMS and email once your order ships.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="callback" className="px-4 py-12">
        <div className="mx-auto max-w-[1280px] rounded-[36px] bg-pale px-6 py-14 md:rounded-[48px] md:px-14">
          <h2 className="text-[clamp(26px,3vw,40px)] font-bold tracking-tight">Request a callback</h2>
          <p className="mt-2 text-[15px] text-mist">Leave your number and our team will call you back during working hours.</p>
          <CallbackForm />
        </div>
      </section>

      <Faq items={generalFaqs} />
    </>
  );
}
