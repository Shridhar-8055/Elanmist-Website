import { NextResponse, type NextRequest } from "next/server";

// The old WordPress site linked to "/our-Vision" (capital V). Redirect rules in
// next.config match paths case-insensitively, so a rule there would also catch
// "/our-vision" and loop. Here we compare the exact path instead.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname !== "/our-vision" && pathname.replace(/\/$/, "").toLowerCase() === "/our-vision") {
    const url = request.nextUrl.clone();
    url.pathname = "/our-vision";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/our-Vision", "/our-Vision/", "/OUR-VISION", "/Our-Vision"],
};
