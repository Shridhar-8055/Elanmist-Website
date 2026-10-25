import type { NextConfig } from "next";

// Permanent redirects from the old WordPress/WooCommerce site (elanmist.com sitemap)
// so search rankings, bookmarks and shared links keep working after the switch.
const legacyRedirects: { source: string; destination: string }[] = [
  { source: "/product/:slug", destination: "/products/:slug" },
  { source: "/product-category/:path*", destination: "/shop" },
  { source: "/category/:path*", destination: "/shop" },
  { source: "/skin-tone-review", destination: "/skin-quiz" },
  { source: "/shipping-and-returns-policy", destination: "/policies/shipping-and-returns" },
  { source: "/privacy-policy", destination: "/policies/privacy" },
  { source: "/terms-and-conditions", destination: "/policies/terms" },
  { source: "/cart", destination: "/shop" },
  // Old WooCommerce account pages go to the new OTP login (no passwords).
  { source: "/registration", destination: "/login" },
  { source: "/my-account/:path*", destination: "/account" },
  { source: "/lost-your-password", destination: "/login" },
  { source: "/hello-world", destination: "/" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return legacyRedirects.map((r) => ({ ...r, permanent: true }));
  },
};

export default nextConfig;
