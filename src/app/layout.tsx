import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts are self-hosted from the @fontsource packages (latin subset) so builds never
// depend on reaching Google Fonts, which has failed Vercel builds before.
// (next/font needs literal values here, so the paths are written out in full.)
const inter = localFont({
  variable: "--font-inter",
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
});
const interTight = localFont({
  variable: "--font-inter-tight",
  src: "../../node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2",
  weight: "100 900",
});
const instrument = localFont({
  variable: "--font-instrument",
  src: [
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
});
// Footer type: fonts already used on the current elanmist.com site.
const poppins = localFont({
  variable: "--font-poppins",
  src: [
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-300-italic.woff2", weight: "300", style: "italic" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-600-italic.woff2", weight: "600", style: "italic" },
  ],
});
const dmSans = localFont({
  variable: "--font-dm-sans",
  src: "../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  weight: "100 1000",
});

export const metadata: Metadata = {
  title: {
    default: "Elanmist — Premium Skincare Powered by Nature and Science",
    template: "%s | Elanmist",
  },
  description:
    "Science-backed formulas with natural ingredients like Indian Gooseberry for luminous, healthy skin. Hybrid Sunscreen, Glutathione Cream and HydroBoost Gel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${interTight.variable} ${instrument.variable} ${poppins.variable} ${dmSans.variable}`}>
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
