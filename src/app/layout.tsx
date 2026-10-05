import type { Metadata } from "next";
import { DM_Sans, Inter, Inter_Tight, Instrument_Serif, Poppins } from "next/font/google";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["700", "800", "900"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
// Footer type: fonts already used on the current elanmist.com site.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

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
      <body className="min-h-svh">
        <CartProvider>
          <AnnouncementBar />
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
