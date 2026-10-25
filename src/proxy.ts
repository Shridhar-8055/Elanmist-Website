import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin area: send anyone without a valid session to the login page. (Each admin
  // page and action checks again on the server; this just stops the obvious cases early.)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!(await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Customer account: refresh the Supabase login session (it lives in cookies) and send
  // visitors who aren't logged in to /login. The page checks the user again itself.
  if (pathname.startsWith("/account")) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const toLogin = () => {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(login);
    };
    if (!url || !key) return toLogin();
    let response = NextResponse.next({ request });
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list, headers) => {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
          for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    return data.user ? response : toLogin();
  }

  // The old WordPress site linked to "/our-Vision" (capital V). Redirect rules in
  // next.config match paths case-insensitively, so a rule there would also catch
  // "/our-vision" and loop. Here we compare the exact path instead.
  if (pathname !== "/our-vision" && pathname.replace(/\/$/, "").toLowerCase() === "/our-vision") {
    const url = request.nextUrl.clone();
    url.pathname = "/our-vision";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*", "/our-Vision", "/our-Vision/", "/OUR-VISION", "/Our-Vision"],
};
