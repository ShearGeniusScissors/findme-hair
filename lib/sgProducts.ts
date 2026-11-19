// Live ShearGenius product facts for the salon-owner resource (/for-salons).
//
// Prices and lengths are read from the public storefront at request time (cached
// 10 minutes), never typed into the page: sale prices start and end, sizes sell out.
// If a read fails, the card shows no price rather than a stale one.
// No findme.hair database calls.
//
// One request for the whole range (the collection JSON, as shearlo.com does), with a
// per-product .js read only for a handle missing from it. The store answers bursts of
// parallel requests with 429, so reads are sequential with a short backoff.

const SG_ORIGIN = 'https://www.sheargenius.com.au';
// AU market: without these cookies Vercel's servers can be served another currency.
const HEADERS = { Cookie: 'localization=AU; cart_currency=AUD', Accept: 'application/json' };

type Option = { name: string; position: number; values: string[] };
// Collection JSON: price is a string in dollars; product .js: price is an integer in cents.
type CollectionVariant = { price: string; available: boolean; option1: string | null; option2: string | null; option3: string | null };
type CollectionProduct = { handle: string; options: Option[]; variants: CollectionVariant[] };
type JsVariant = { price: number; available: boolean; options?: string[] };
type JsProduct = { handle: string; options: Option[]; variants: JsVariant[] };

export type LiveProduct = {
  handle: string;
  /** Lowest price of an in-stock variant, in dollars. */
  fromPrice: number | null;
  /** Blade lengths with at least one in-stock variant, in the store's order (e.g. ["5.5", "6.0"]). */
  lengths: string[];
};

async function getJson<T>(url: string): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, next: { revalidate: 600 }, signal: AbortSignal.timeout(8000) });
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }
  return null;
}

function summarise(
  handle: string,
  options: Option[],
  inStock: { dollars: number; values: (string | null | undefined)[] }[],
): LiveProduct {
  if (inStock.length === 0) return { handle, fromPrice: null, lengths: [] };
  const from = Math.min(...inStock.map((v) => v.dollars));
  const sizeOpt = (options ?? []).find((o) => /size|length/i.test(o.name));
  let lengths: string[] = [];
  if (sizeOpt) {
    const idx = sizeOpt.position - 1;
    const available = new Set(inStock.map((v) => v.values[idx]).filter(Boolean) as string[]);
    lengths = sizeOpt.values.filter((v) => available.has(v));
  }
  return { handle, fromPrice: Number.isFinite(from) ? from : null, lengths };
}

/** Live price + in-stock lengths for each handle; a handle that can't be read maps to null. */
export async function getLiveProducts(handles: string[]): Promise<Map<string, LiveProduct | null>> {
  const out = new Map<string, LiveProduct | null>();
  const coll = await getJson<{ products: CollectionProduct[] }>(
    `${SG_ORIGIN}/collections/hairdressing-scissors/products.json?limit=250`,
  );
  const byHandle = new Map((coll?.products ?? []).map((p) => [p.handle, p]));
  for (const h of handles) {
    const p = byHandle.get(h);
    if (p) {
      const inStock = p.variants
        .filter((v) => v.available)
        .map((v) => ({ dollars: Number(v.price), values: [v.option1, v.option2, v.option3] }))
        .filter((v) => Number.isFinite(v.dollars));
      out.set(h, summarise(h, p.options, inStock));
      continue;
    }
    const js = await getJson<JsProduct>(`${SG_ORIGIN}/products/${h}.js`);
    if (!js) {
      out.set(h, null);
      continue;
    }
    const inStock = js.variants
      .filter((v) => v.available)
      .map((v) => ({ dollars: v.price / 100, values: v.options ?? [] }));
    out.set(h, summarise(h, js.options, inStock));
  }
  return out;
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
