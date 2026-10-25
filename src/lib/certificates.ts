// Dermatological test certificates (public/certificates/elanmist-dermatology-certificates.pdf).
// All three: Centre for Cruelty-Free Testing (CCFT Laboratories), Meerut — skin irritation
// test as per BIS 4011, found non-irritant, certified 20 March 2026.

export const CERT_LAB = "Centre for Cruelty-Free Testing (CCFT Laboratories), Meerut";
export const CERT_STANDARD = "BIS 4011";
export const CERT_DATE = "20 March 2026";
export const CERT_PDF = "/certificates/elanmist-dermatology-certificates.pdf";

export type Certificate = {
  slug: string;
  /** Product name as printed on the certificate. */
  certifiedAs: string;
  number: string;
  image: string;
};

export const certificates: Certificate[] = [
  {
    slug: "hybrid-sunscreen",
    certifiedAs: "SPF 50 Sun Screen Cream",
    number: "CCFT2026031386A",
    image: "/images/certificates/hybrid-sunscreen.webp",
  },
  {
    slug: "hydroboost-gel",
    certifiedAs: "Hydro Gel",
    number: "CCFT2026031386B",
    image: "/images/certificates/hydroboost-gel.webp",
  },
  {
    // CONFIRM with the client: the certificate names this "Glowfine Skin Brightening Cream".
    slug: "glutathione-cream",
    certifiedAs: "Glowfine Skin Brightening Cream",
    number: "CCFT2026031386C",
    image: "/images/certificates/glutathione-cream.webp",
  },
];
