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
  // The new site has no customer accounts.
  { source: "/login", destination: "/" },
  { source: "/registration", destination: "/" },
  { source: "/my-account/:path*", destination: "/" },
  { source: "/lost-your-password", destination: "/" },
  { source: "/hello-world", destination: "/" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return legacyRedirects.map((r) => ({ ...r, permanent: true }));
  },
};

export default nextConfig;
