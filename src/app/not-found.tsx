import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid min-h-[70svh] place-items-center px-5 text-center">
      <div>
        <h1 className="display text-[clamp(64px,12vw,180px)] text-pale-2">404</h1>
        <p className="mt-4 text-lg text-mist">This page drifted off like mist.</p>
        <Link href="/shop" className="pill-dark mt-8 inline-flex h-[46px] items-center rounded-full px-7 text-sm">
          Back to the shop
        </Link>
      </div>
    </section>
  );
}
