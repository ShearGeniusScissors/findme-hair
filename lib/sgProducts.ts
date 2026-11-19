// Live ShearGenius product facts for the salon-owner resource (/for-salons).
//
// Prices and lengths are read from the public storefront at request time (cached
// 10 minutes), never typed into the page: sale prices start and end, sizes sell out.
// If a fetch fails, the card shows no price rather than a stale one.
// No findme.hair database calls.

const SG_ORIGIN = 'https://www.sheargenius.com.au';

type ShopifyVariant = { price: number; available: boolean; options?: string[] };
type ShopifyProduct = {
  handle: string;
  title: string;
  options: { name: string; position: number; values: string[] }[];
  variants: ShopifyVariant[];
};

export type LiveProduct = {
  handle: string;
  /** Lowest price of an in-stock variant, in dollars. */
  fromPrice: number | null;
  /** Blade lengths with at least one in-stock variant, in the store's order (e.g. ["5.5", "6.0"]). */
  lengths: string[];
};

export async function getLiveProduct(handle: string): Promise<LiveProduct | null> {
  try {
    const res = await fetch(`${SG_ORIGIN}/products/${handle}.js`, {
      // AU market: without these cookies Vercel's servers can be served another currency.
      headers: { Cookie: 'localization=AU; cart_currency=AUD', Accept: 'application/json' },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const p = (await res.json()) as ShopifyProduct;
    const inStock = (p.variants ?? []).filter((v) => v.available);
    if (inStock.length === 0) return { handle, fromPrice: null, lengths: [] };
    const fromCents = Math.min(...inStock.map((v) => v.price));
    const sizeOpt = (p.options ?? []).find((o) => /size|length/i.test(o.name));
    let lengths: string[] = [];
    if (sizeOpt) {
      const idx = sizeOpt.position - 1;
      const available = new Set(inStock.map((v) => v.options?.[idx]).filter(Boolean) as string[]);
      lengths = sizeOpt.values.filter((v) => available.has(v));
    }
    return { handle, fromPrice: Number.isFinite(fromCents) ? fromCents / 100 : null, lengths };
  } catch {
    return null;
  }
}

export function formatAud(dollars: number): string {
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** "5.5″, 6.0″ and 6.5″" */
export function formatLengths(lengths: string[]): string {
  const l = lengths.map((x) => `${x}″`);
  if (l.length <= 1) return l.join('');
  return `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`;
}
