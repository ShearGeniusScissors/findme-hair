/**
 * Display formatter for salon specialty tags.
 *
 * The underlying tag values in `businesses.specialties` are lowercase kebab/snake
 * (e.g. "colour-specialist", "natulique", "Organic_colour"). They're useful as
 * filter keys but ugly as visible chips. `formatTag` turns them into clean
 * Title Case strings, with a brand/term overrides map so vendor names render
 * with their canonical capitalisation (NATULIQUE, KEVIN.MURPHY, etc.) and a
 * handful of multi-word terms get the spacing right ("Low Tox" not "Lowtox").
 *
 * IMPORTANT: This is display-only. Filter chip click handlers must still use
 * the underlying raw tag value — never the formatted one — or chip clicks will
 * stop matching `businesses.specialties` rows.
 */

/**
 * Brand/term overrides keyed by the *normalised* form (lowercase, hyphens and
 * underscores collapsed to single spaces). The value is rendered verbatim.
 * Add new entries here as the dataset grows.
 */
const OVERRIDES: Record<string, string> = {
  // Product/brand names — render with their canonical capitalisation
  natulique: 'NATULIQUE',
  davines: 'DAVINES',
  wella: 'WELLA',
  goldwell: 'GOLDWELL',
  schwarzkopf: 'SCHWARZKOPF',
  'kevin murphy': 'KEVIN MURPHY',
  aveda: 'AVEDA',
  // Multi-word terms the title-caser would otherwise mangle or run together
  lowtox: 'Low Tox',
  'low tox': 'Low Tox',
  'curly hair': 'Curly Hair',
  'colour specialist': 'Colour Specialist',
  'colour correction': 'Colour Correction',
  'scalp spa': 'Scalp Spa',
  // Single-word terms where Title Case is already correct but we lock them
  // explicitly so a future override doesn't drift them.
  balayage: 'Balayage',
  highlights: 'Highlights',
  organic: 'Organic',
  sustainable: 'Sustainable',
  keratin: 'Keratin',
  extensions: 'Extensions',
  bridal: 'Bridal',
  barber: 'Barber',
  mobile: 'Mobile',
  japanese: 'Japanese',
  korean: 'Korean',
  kids: 'Kids',
  mens: 'Mens',
  wigs: 'Wigs',
  afro: 'Afro',
  'blow dry': 'Blow Dry',
};

function normalise(tag: string): string {
  return tag.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatTag(tag: string): string {
  if (!tag) return '';
  const norm = normalise(tag);
  if (norm in OVERRIDES) return OVERRIDES[norm];
  return titleCase(norm);
}
