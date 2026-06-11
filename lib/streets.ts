// Salon-strip detection from real address data (playbook Part 3 item 9 —
// the editorial "Domain depth" upgrade, done with data instead of prose).
// A strip sentence only renders when a street GENUINELY dominates the
// suburb's listings, so it can never overstate.

const STREET_TYPES =
  'Street|St|Road|Rd|Avenue|Ave|Parade|Pde|Highway|Hwy|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Crescent|Cres|Mall|Square|Esplanade|Terrace|Tce|Boulevard|Blvd|Way';

const EXPAND: Record<string, string> = {
  st: 'Street', rd: 'Road', ave: 'Avenue', pde: 'Parade', hwy: 'Highway',
  ln: 'Lane', dr: 'Drive', ct: 'Court', pl: 'Place', cres: 'Crescent',
  tce: 'Terrace', blvd: 'Boulevard',
};

const STREET_RE = new RegExp(
  `([A-Za-z][A-Za-z'. ]*?(?:${STREET_TYPES})(?:\\s+(?:North|South|East|West))?)\\.?$`,
  'i',
);

/** Extract a normalised street name ("Sturt Street") from an AU address line. */
export function extractStreet(addressLine1: string | null): string | null {
  if (!addressLine1) return null;
  const m = addressLine1.trim().match(STREET_RE);
  if (!m) return null;
  let street = m[1]
    .replace(/\s+/g, ' ')
    // Unit-letter artifact: "1A Mair Street" matches from the stray "A".
    .replace(/^[A-Za-z]\s+/, '')
    .trim();
  if (!street.includes(' ')) return null; // bare street type, no name
  const words = street.toLowerCase().split(' ');
  street = words
    .map((w, i) => {
      // Expand abbreviations anywhere except the first word ("St Georges
      // Road" keeps its St; "Doveton St North" → "Doveton Street North").
      const expanded = i > 0 && EXPAND[w] ? EXPAND[w] : w;
      return expanded.charAt(0).toUpperCase() + expanded.slice(1);
    })
    .join(' ');
  return street;
}

export interface SalonStrip {
  /** One or two dominant street names. */
  streets: string[];
  /** Listings on those streets. */
  count: number;
}

/**
 * Returns the suburb's dominant salon strip(s), or null when no street
 * genuinely dominates. A single street needs ≥5 listings, ≥⅕ of the suburb,
 * AND ≥2× the runner-up street (dominance, not just volume); a two-street
 * pair needs ≥3 each AND ≥⅓ combined.
 */
export function findSalonStrips(
  addressLines: Array<string | null>,
  total: number,
): SalonStrip | null {
  if (total < 8) return null;
  const counts = new Map<string, number>();
  for (const line of addressLines) {
    const street = extractStreet(line);
    if (street) counts.set(street, (counts.get(street) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [top1, top2] = ranked;
  if (
    top1 &&
    top1[1] >= 5 &&
    top1[1] >= Math.ceil(total / 5) &&
    top1[1] >= (top2?.[1] ?? 0) * 2
  ) {
    return { streets: [top1[0]], count: top1[1] };
  }
  if (
    top1 && top2 &&
    top1[1] >= 3 && top2[1] >= 3 &&
    top1[1] + top2[1] >= Math.ceil(total / 3)
  ) {
    return { streets: [top1[0], top2[0]], count: top1[1] + top2[1] };
  }
  return null;
}
