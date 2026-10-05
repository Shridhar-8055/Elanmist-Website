// Descriptive alt text for every photo on the site, keyed by its public path.
const alts: Record<string, string> = {
  "/images/shoot/sunscreen-cactus.webp": "Elanmist Hybrid Sunscreen tube on a rock beside a potted cactus and white pebbles",
  "/images/shoot/sunscreen-stones.webp": "Elanmist Hybrid Sunscreen SPF 50 tube standing on white stones",
  "/images/shoot/sunscreen-stones-2.webp": "Close-up of Elanmist Hybrid Sunscreen tube resting on smooth white stones",
  "/images/shoot/sunscreen-table.webp": "Elanmist Hybrid Sunscreen tube on a wooden table next to a ceramic vase of dried flowers",
  "/images/shoot/duo-monochrome.webp": "Black-and-white photo of Elanmist Hybrid Sunscreen and Glutathione Cream tubes among pebbles",
  "/images/shoot/gel-window-light.webp": "Elanmist HydroBoost Gel jar in soft window light and shadow",
  "/images/shoot/gel-vase.webp": "Elanmist HydroBoost Gel jar beside a ceramic vase and a small decorative tree",
  "/images/shoot/gel-slate.webp": "Elanmist HydroBoost Gel jar with a silver lid on a slate-grey backdrop",
  "/images/shoot/cream-rock.webp": "Elanmist Glutathione Cream tube standing on a natural rock",
  "/images/shoot/trio-lineup.webp": "Elanmist range: Hybrid Sunscreen, HydroBoost Gel and Glutathione Cream side by side",
  "/images/shoot/trio-group.webp": "Elanmist Hybrid Sunscreen, Glutathione Cream and HydroBoost Gel grouped together",
  "/images/shoot/duo-tubes.webp": "Elanmist Hybrid Sunscreen and Glutathione Cream tubes side by side",
  "/images/shoot/cream-box.webp": "Elanmist Glutathione Cream carton with gold floral design",
  "/images/shoot/cream-tube.webp": "Elanmist Glutathione Cream 50 g tube",
  "/images/shoot/cream-tube-box.webp": "Elanmist Glutathione Cream tube in front of its carton",
  "/images/shoot/sunscreen-box.webp": "Elanmist Hybrid Sunscreen SPF 50 carton in pink foil",
  "/images/shoot/gel-box.webp": "Elanmist HydroBoost Gel carton in blue with gooseberry illustration",
  "/images/shoot/sunscreen-tube.webp": "Elanmist Hybrid Sunscreen SPF 50 tube",
  "/images/shoot/sunscreen-tube-box.webp": "Elanmist Hybrid Sunscreen tube in front of its pink carton",
  "/images/shoot/sunscreen-tube-front.webp": "Front of the Elanmist Hybrid Sunscreen tube showing SPF 50 and UVA + UVB protection",
  "/images/shoot/gel-jar-box.webp": "Elanmist HydroBoost Gel jar beside its blue carton",
  "/images/shoot/gel-jar.webp": "Elanmist HydroBoost Gel 50 g jar with silver lid",
  "/images/shoot/sunscreen-with-box.webp": "Elanmist Hybrid Sunscreen tube next to its pink foil carton",
  "/images/skin-dry.webp": "Close-up of dry, flaky skin texture",
  "/images/skin-oily.webp": "Close-up of oily skin with visible shine",
  "/images/skin-combination.webp": "Close-up of combination skin texture",
  "/images/skin-sensitive.webp": "Close-up of sensitive skin with mild redness",
};

export function altFor(src: string, fallback = "Elanmist skincare product") {
  return alts[src] ?? fallback;
}
