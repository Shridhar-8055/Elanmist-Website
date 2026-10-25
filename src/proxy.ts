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
  matcher: ["/admin", "/admin/:path*", "/our-Vision", "/our-Vision/", "/OUR-VISION", "/Our-Vision"],
};
