import Link from "next/link";
import { GoBack } from "@/components/NavButtons";
import { SiteChrome } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <SiteChrome>
    <section className="grid min-h-[70svh] place-items-center px-5 text-center">
      <div>
        <h1 className="display text-[clamp(64px,12vw,180px)] text-pale-2">404</h1>
        <p className="mt-4 text-lg text-mist">This page drifted off like mist.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <GoBack className="inline-flex h-[46px] cursor-pointer items-center rounded-full border-2 border-ink px-6 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white">
            &larr; Go back
          </GoBack>
          <Link href="/shop" className="pill-dark inline-flex h-[46px] items-center rounded-full px-7 text-sm">
            Back to the shop
          </Link>
        </div>
      </div>
    </section>
    </SiteChrome>
  );
}
