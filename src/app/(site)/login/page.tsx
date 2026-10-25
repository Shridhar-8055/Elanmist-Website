import type { Metadata } from "next";
import Image from "next/image";
import { CheckIcon } from "@/components/icons";
import { redirect } from "next/navigation";
import { altFor } from "@/lib/imageAlt";
import { currentCustomer } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Elanmist account to see your orders, track deliveries and check out faster.",
  robots: { index: false },
};

const perks = [
  "Every order in one place, with live delivery tracking",
  "Your address saved for a faster checkout",
  "No password to remember: we send a one-time code",
];

const IMAGE = "/images/shoot/sunscreen-stones-2.webp";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const redirectTo = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  // Already logged in: skip the form.
  if (await currentCustomer()) redirect(redirectTo);

  return (
    <section className="px-4 pb-20 pt-6 md:pb-28 md:pt-10">
      <div className="mx-auto grid max-w-[1180px] overflow-hidden rounded-[36px] bg-white md:grid-cols-[1fr_1.05fr] md:shadow-[0_20px_60px_rgb(0_0_0/0.08)] md:ring-1 md:ring-ink/5">
        {/* Brand panel: product photo under a wine wash, with what an account gives you. */}
        <div className="relative hidden min-h-[640px] overflow-hidden bg-wine text-white md:block">
          <Image src={IMAGE} alt={altFor(IMAGE)} fill preload sizes="50vw" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-wine from-35% via-wine/80 via-60% to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-10 lg:p-12">
            <p className="font-serif text-2xl italic text-[#e8a6b3]">Your Elanmist account</p>
            <h2 className="mt-3 max-w-[14ch] text-[clamp(34px,3.4vw,48px)] font-bold leading-[1.05] tracking-tight">
              Your skincare routine, all in one place.
            </h2>
            <ul className="mt-8 space-y-3.5">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] text-white/85">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/15">
                    <CheckIcon className="size-3" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-2 sm:p-10 lg:p-14">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </section>
  );
}
