import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="w-full max-w-[400px]">
        <p className="text-center text-[34px] leading-none">
          <Wordmark />
        </p>
        <div className="mt-6 rounded-3xl bg-white p-7 shadow-[0_20px_60px_rgb(0_0_0/0.08)] ring-1 ring-ink/5">
          <h1 className="text-xl font-bold">Admin dashboard</h1>
          <p className="mt-1 text-sm text-ink/60">Sign in to see orders, customers and coupons.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
