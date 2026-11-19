// Outbound links to the sites findme.hair links to (19 Nov 2026).
//
// One tagging pattern for every outbound link, so the receiving site's analytics
// can tell which findme.hair page and which block a visit came from:
//   utm_source=findme.hair & utm_medium=referral & utm_campaign=<page> & utm_content=<block>
//
// `page` is the page's own slug (for-salons, scissor-sharpening, blog-what-is-balayage).
// Templated pages pass the template name instead (salon, near-me-haircut,
// suburb-pivot-hairdresser) so a campaign is one row per page type, not one per URL.
// Before this, links used three conventions (findme.hair, findme_hair, none at all).
//
// Links to ShearGenius link only the word "ShearGenius" (Matt, 6 Nov): build the
// href here, keep the anchor text to the brand name.

const SG_ORIGIN = 'https://www.sheargenius.com.au';

export type LinkTag = { page: string; block: string };

/** Adds the findme.hair UTM set to any absolute URL (replacing any UTM already on it). */
export function tagged(url: string, { page, block }: LinkTag): string {
  const u = new URL(url);
  for (const k of Array.from(u.searchParams.keys())) {
    if (k.startsWith('utm_')) u.searchParams.delete(k);
  }
  u.searchParams.set('utm_source', 'findme.hair');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', page);
  u.searchParams.set('utm_content', block);
  return u.toString();
}

/** A ShearGenius URL (path like "/collections/barber-scissors", or a full URL) with the findme.hair UTM set. */
export function sgLink(pathOrUrl: string, tag: LinkTag): string {
  const raw = pathOrUrl.startsWith('http') ? pathOrUrl : `${SG_ORIGIN}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  const u = new URL(raw);
  // Always the canonical host (the bare domain redirects).
  if (u.hostname === 'sheargenius.com.au') u.hostname = 'www.sheargenius.com.au';
  return tagged(u.toString(), tag);
}
