/**
 * Shared storefront helpers for the Maison theme.
 *
 * The visual language uses soft category-keyed gradient "tones" behind every
 * product, with the product's initial set in a serif overlay. Real product
 * images (when present) layer on top. These helpers keep that language
 * consistent across the catalog, detail, cart and order surfaces.
 */

/** Display price in USD to match the Maison design language. */
export function money(value: number | string): string {
  const n = Number(value);
  return '$' + (Math.round(n * 100) / 100).toFixed(2);
}

/** Compact whole-dollar money for charts/labels, e.g. 3420.5 → "$3,420". */
export function compactMoney(value: number | string): string {
  return '$' + Math.round(Number(value)).toLocaleString('en-US');
}

/** Free-shipping threshold and flat fee, mirrored in the cart summary. */
export const SHIPPING_THRESHOLD = 150;
export const SHIPPING_FEE = 9.99;
export const PROMO_CODE = 'SAVE10';
export const PROMO_RATE = 0.1;

/**
 * Client-side cart estimate shown in the cart and checkout summaries. The
 * authoritative subtotal/tax/shipping/total are computed by the API at order
 * creation — this is presentational so the shopper sees a running total and
 * the promo/free-shipping affordances before they commit.
 */
export function cartEstimate(subtotal: number, hasItems: boolean, promoApplied: boolean) {
  const discount = promoApplied ? subtotal * PROMO_RATE : 0;
  const base = subtotal - discount;
  const shipping = !hasItems ? 0 : base >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { discount, shipping, total: base + shipping };
}

/** The soft two-stop gradients used as product backdrops, by category. */
const TONES: Record<string, string> = {
  Apparel: 'linear-gradient(145deg,#ECE4D8 0%,#D7CABA 100%)',
  Footwear: 'linear-gradient(145deg,#E9EBEE 0%,#CDD3D9 100%)',
  Accessories: 'linear-gradient(145deg,#EFE0D3 0%,#D9BFA8 100%)',
  Home: 'linear-gradient(145deg,#E6E9DF 0%,#C9D1BE 100%)',
  'Home & Living': 'linear-gradient(145deg,#E6E9DF 0%,#C9D1BE 100%)',
  Tech: 'linear-gradient(145deg,#E4E6EB 0%,#C6CBD6 100%)',
  Electronics: 'linear-gradient(145deg,#E4E6EB 0%,#C6CBD6 100%)',
  Beauty: 'linear-gradient(145deg,#F2E3E4 0%,#E1C6CA 100%)',
};

/** Deterministic fallback palette for categories not named above. */
const FALLBACK_TONES = Object.values(TONES);

/** Resolve a backdrop gradient for a category, stable per name. */
export function categoryTone(categoryName?: string | null): string {
  if (!categoryName) return FALLBACK_TONES[0];
  if (TONES[categoryName]) return TONES[categoryName];
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = (hash * 31 + categoryName.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_TONES[hash % FALLBACK_TONES.length];
}

/** First letter of a product name, for the serif overlay. */
export function productInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'M';
}

/** A five-glyph star string for a 0–5 rating. */
export function stars(rating: number): string {
  const filled = Math.round(rating);
  return '★★★★★'.slice(0, filled) + '☆☆☆☆☆'.slice(0, 5 - filled);
}
