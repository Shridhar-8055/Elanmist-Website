import { Wordmark } from "@/components/Wordmark";
import { requireAdmin } from "@/lib/admin-auth";
import { logoutAction } from "../actions";
import { AdminNav } from "./AdminNav";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="lg:grid lg:min-h-svh lg:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 z-30 bg-wine text-white lg:h-svh">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-6 lg:py-7">
          <p className="text-[26px] leading-none">
            <Wordmark />
            <span className="ml-2 align-middle text-[11px] font-semibold uppercase not-italic tracking-[0.2em] text-[#e8a6b3]">
              Admin
            </span>
          </p>
          <form action={logoutAction} className="lg:hidden">
            <button type="submit" className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold">
              Sign out
            </button>
          </form>
        </div>
        <AdminNav />
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-[1240px] px-4 py-6 md:px-8 md:py-9">{children}</main>
    </div>
  );
}
