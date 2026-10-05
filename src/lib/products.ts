// Catalogue for Elanmist. Copy is taken from the current elanmist.com site and the
// product labels. Items marked "CONFIRM" need sign-off from the client before launch.

export type Ingredient = {
  name: string;
  note: string;
  swatch: string;
};

export type Review = {
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
};

export type Product = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  summary: string;
  description: string;
  price: number;
  mrp: number;
  size: string;
  image: string;
  imageAlt: string;
  // Short, scannable benefits shown on cards and the buy box.
  benefits: string[];
  // Backdrop colour of the product photo, so panels blend into the image.
  backdrop: string;
  accent: string;
  skinTypes: string[];
  ingredients: Ingredient[];
  freeFrom: string[];
  why: { title: string; body: string }[];
  // CONFIRM: usage steps are drafted from standard guidance for each format.
  howToUse: { title: string; body: string }[];
  // CONFIRM: FAQ answers are drafts for the client to review.
  faqs: { q: string; a: string }[];
  reviews: Review[];
};

export const products: Product[] = [
  {
    slug: "hybrid-sunscreen",
    name: "Hybrid Sunscreen",
    shortName: "Sunscreen",
    tagline: "SPF 50 PA++++. Broad Spectrum.",
    summary: "UVA + UVB + HEV protection, powered with Gooseberry.",
    description:
      "A hybrid sunscreen with SPF 50 PA++++ that shields against UVA, UVB and high-energy visible light, while Indian Gooseberry adds antioxidant care for everyday wear.",
    // CONFIRM: shop page shows ₹525 / ₹599, homepage shows ₹579 / ₹699.
    price: 525,
    mrp: 599,
    size: "50 g",
    image: "/images/shoot/sunscreen-stones.webp",
    imageAlt: "Elanmist Hybrid Sunscreen SPF 50 tube standing on white stones",
    benefits: [
      "SPF 50 PA++++ broad-spectrum UVA + UVB protection",
      "Shields against HEV (blue) light",
      "Lightweight lotion that's easy to apply",
      "Powered with Indian Gooseberry",
    ],
    backdrop: "#230a0e",
    accent: "#e8a6b3",
    skinTypes: ["Oily", "Combination", "Sensitive"],
    ingredients: [
      { name: "Hybrid UV Filters", note: "Broad-spectrum UVA + UVB defence at SPF 50 PA++++.", swatch: "#e8a6b3" },
      { name: "HEV Shield", note: "Helps guard skin from high-energy visible (blue) light.", swatch: "#b7a4d6" },
      { name: "Indian Gooseberry", note: "Vitamin C-rich antioxidant that supports a brighter tone.", swatch: "#9cc28a" },
    ],
    // CONFIRM: only "paraben-free" is stated on the current site for this product.
    freeFrom: ["Parabens"],
    why: [
      { title: "Hybrid, Not Heavy.", body: "Combines filters for broad protection in a finish that sits comfortably under makeup." },
      { title: "Beyond UV.", body: "Protection extends to HEV light from screens and daylight, not just the sun." },
      { title: "Care In Every Layer.", body: "Gooseberry antioxidants work alongside the filters while you're out." },
    ],
    howToUse: [
      { title: "Apply", body: "Two finger-lengths on face and neck as the last step of your AM routine." },
      { title: "Wait", body: "Give it 10–15 minutes before stepping out into the sun." },
      { title: "Reapply", body: "Every 2–3 hours outdoors, and after sweating or swimming." },
    ],
    faqs: [
      { q: "Will it leave a white cast?", a: "The hybrid formula is designed to blend in. Rub in gently and let it set for a minute." },
      { q: "Can I wear it under makeup?", a: "Yes. Let it absorb for a minute, then apply your makeup as usual." },
      { q: "Do I need it indoors?", a: "Yes, if you sit near windows or in front of screens for long hours." },
      { q: "Is it suitable for oily skin?", a: "Yes. It is suitable for all skin types, including oily and combination." },
    ],
    reviews: [
      { author: "Verified buyer", rating: 5, title: "True", body: "True !!", date: "2026-01-28" },
    ],
  },
  {
    slug: "glutathione-cream",
    name: "Glutathione Cream",
    shortName: "Cream",
    tagline: "Brighter Tone. Deep Hydration.",
    summary: "Glutathione + 2% Clair Blanche-II + 1% Hymagic™-4D.",
    description:
      "A lightweight daily-use cream formulated with Glutathione, 2% Clair Blanche-II and 1% Hymagic™ 4D Hyaluronic Acid to support brighter-looking skin and long-lasting hydration.",
    price: 579,
    mrp: 699,
    size: "50 g",
    image: "/images/shoot/cream-rock.webp",
    imageAlt: "Elanmist Glutathione Cream tube standing on a natural rock",
    benefits: [
      "Improves the look of uneven tone and dullness",
      "Multi-layer, long-lasting hydration",
      "Strengthens the moisture barrier",
      "Non-sticky, lightweight texture",
    ],
    backdrop: "#37201f",
    accent: "#e9c3a8",
    skinTypes: ["Combination", "Dry", "Normal"],
    ingredients: [
      { name: "Glutathione", note: "The master antioxidant for a luminous, even-looking tone.", swatch: "#e9c3a8" },
      { name: "2% Clair Blanche-II", note: "Targets dullness and the look of uneven tone.", swatch: "#f1e3d3" },
      { name: "1% Hymagic™-4D", note: "Multi-layer hyaluronic acid for lasting hydration.", swatch: "#a9c8e0" },
      { name: "Niacinamide", note: "Vitamin B3 that strengthens the moisture barrier.", swatch: "#c9b7d9" },
      { name: "Indian Gooseberry", note: "Vitamin C-rich botanical that supports radiance.", swatch: "#9cc28a" },
    ],
    freeFrom: ["Parabens", "Sulfates", "Phthalates", "Silicones"],
    why: [
      { title: "Brightens, Gently.", body: "Glutathione and Clair Blanche-II work on dullness without harsh actives." },
      { title: "Hydrates In Layers.", body: "Hymagic™-4D hyaluronic acid delivers moisture at multiple depths." },
      { title: "Barrier First.", body: "Niacinamide and ceramides help your skin hold on to what it needs." },
    ],
    howToUse: [
      { title: "Cleanse", body: "Start on clean, slightly damp skin." },
      { title: "Apply", body: "Massage a pea-sized amount over face and neck, AM and PM." },
      { title: "Protect", body: "In the morning, follow with Hybrid Sunscreen." },
    ],
    faqs: [
      { q: "When will I see results?", a: "Skin feels hydrated immediately. Tone and radiance improve with consistent use over several weeks." },
      { q: "Is it sticky?", a: "No. It's a lightweight, non-sticky cream that absorbs quickly." },
      { q: "Can I use it every day?", a: "Yes. It's formulated for daily use, morning and night." },
      { q: "Is it suitable for all skin types?", a: "Yes. The label lists it as suitable for all skin types." },
    ],
    reviews: [
      { author: "Verified buyer", rating: 4, title: "Real", body: "Real !!", date: "2026-01-28" },
    ],
  },
  {
    slug: "hydroboost-gel",
    name: "HydroBoost Gel",
    shortName: "Gel",
    tagline: "Water-Light Hydration. Zero Grease.",
    summary: "Hyaluronic Acid 4D + Aquaxyl™ + Aloe Vera.",
    description:
      "A lightweight, fast-absorbing hydration gel with Hyaluronic Acid and Aloe Vera. Oil-free and non-sticky, it keeps skin hydrated day or night and layers cleanly under sunscreen and makeup.",
    price: 409,
    mrp: 499,
    size: "50 g",
    image: "/images/shoot/gel-slate.webp",
    imageAlt: "Elanmist HydroBoost Gel jar with a silver lid on a slate-grey backdrop",
    benefits: [
      "Fast-absorbing, oil-free hydration",
      "Non-sticky finish",
      "Layers cleanly under sunscreen and makeup",
      "Suitable for day or night",
    ],
    backdrop: "#33364a",
    accent: "#9fb2f0",
    skinTypes: ["Dry", "Oily", "Sensitive"],
    ingredients: [
      { name: "Hyaluronic Acid 4D", note: "Draws in water to plump and hydrate from within.", swatch: "#9fb2f0" },
      { name: "Aquaxyl™", note: "Helps skin retain moisture for longer.", swatch: "#b8e0e6" },
      { name: "1% Gooseberry Extract", note: "Vitamin C-rich antioxidant care.", swatch: "#9cc28a" },
      { name: "Niacinamide", note: "Refines the look of pores and evens tone.", swatch: "#c9b7d9" },
      { name: "Alpha Arbutin", note: "Supports a more even-looking complexion.", swatch: "#f0d9b5" },
    ],
    // CONFIRM: "oil-free" is on the current site; "paraben-free" is a site-wide badge.
    freeFrom: ["Oil", "Parabens"],
    why: [
      { title: "Hydration, Weightless.", body: "A gel that drinks in instantly and never feels greasy." },
      { title: "Layers Like Water.", body: "Sits cleanly under sunscreen and makeup, morning or night." },
      { title: "Kind To Sensitive Skin.", body: "A gentle, skin-kind formula for easily irritated skin." },
    ],
    howToUse: [
      { title: "Cleanse", body: "Start on clean skin." },
      { title: "Apply", body: "Smooth a small amount over face and neck until absorbed." },
      { title: "Layer", body: "Follow with Hybrid Sunscreen in the morning." },
    ],
    faqs: [
      { q: "Is it oil-free?", a: "Yes. It's an oil-free gel with a non-sticky finish." },
      { q: "Can I use it under sunscreen?", a: "Yes. It absorbs fast and layers cleanly under sunscreen and makeup." },
      { q: "Will it work for dry skin?", a: "Yes. Hyaluronic Acid and Aquaxyl™ help deliver deep, lasting hydration." },
      { q: "Should I refrigerate it?", a: "No. Store in a cool, dry place. Do not refrigerate." },
    ],
    reviews: [
      { author: "Verified buyer", rating: 5, title: "Great", body: "Great", date: "2026-01-28" },
      { author: "Verified buyer", rating: 4, title: "Awesome", body: "Awesome!!", date: "2026-01-28" },
      {
        author: "Sneha D.",
        rating: 5,
        title: "Perfect for sensitive skin",
        body: "As someone with sensitive skin, finding products that work without irritation is hard. This gel is perfect.",
        date: "2026-01-20",
      },
    ],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function discount(p: Pick<Product, "price" | "mrp">) {
  return Math.round(((p.mrp - p.price) / p.mrp) * 100);
}

export function averageRating(reviews: Review[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

// Shipping & returns, from the client's current policy (elanmist.com/shipping-and-returns-policy).
export const FREE_SHIPPING_THRESHOLD = 500;
export const shippingInfo = {
  freeShipping: `Free shipping on orders above ₹${FREE_SHIPPING_THRESHOLD}`,
  feeNote: `₹49 delivery fee on orders below ₹${FREE_SHIPPING_THRESHOLD}`,
  dispatch: "Dispatched within 1–2 business days",
  delivery: "Delivered in 5–7 business days from dispatch",
  // COD is in the client policy but not offered online yet (phase 2: needs an order database).
  payment: "Secure prepaid checkout: UPI, cards, netbanking & wallets",
  returns: "No returns on opened products for hygiene reasons. Damaged or wrong items are replaced — report within 48 hours with an unboxing video.",
  support: { email: "support@elanmist.com", phone: "9353276878" },
};

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const skinTypes = [
  {
    key: "dry",
    label: "Dry Skin",
    feel: "Feels tight, flaky, and lacks moisture.",
    image: "/images/skin-dry.webp",
    product: "hydroboost-gel",
    pitch: "HydroBoost Gel for deep, lasting hydration.",
  },
  {
    key: "oily",
    label: "Oily Skin",
    feel: "Excess sebum, enlarged pores, and shine.",
    image: "/images/skin-oily.webp",
    product: "hybrid-sunscreen",
    pitch: "Hybrid Sunscreen for protection without the grease.",
  },
  {
    key: "combination",
    label: "Combination Skin",
    feel: "Oily T-zone with dry patches elsewhere.",
    image: "/images/skin-combination.webp",
    product: "glutathione-cream",
    pitch: "Glutathione Cream for balanced care.",
  },
  {
    key: "sensitive",
    label: "Sensitive Skin",
    feel: "Easily irritated, prone to redness.",
    image: "/images/skin-sensitive.webp",
    product: "hydroboost-gel",
    pitch: "Every formula is gentle and skin-kind.",
  },
] as const;
