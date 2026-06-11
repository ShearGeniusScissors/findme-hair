import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/search';

// FindMe Hair Top Rated — embeddable SVG badge. Served ONLY for salons that
// earned the badge (top 10% of active listings by Bayesian-weighted Google
// rating). Owners embed it wrapped in a link back to their profile — the
// backlinks + claims flywheel. /api/ is robots-disallowed, so the image
// itself mints no crawlable page; the value is the inbound link around it.

export const revalidate = 86400; // badge facts change at most yearly

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (
    !business ||
    business.status !== 'active' ||
    business.top_rated_year == null ||
    business.google_rating == null
  ) {
    return new NextResponse('Not found', { status: 404 });
  }

  const year = business.top_rated_year;
  const rating = business.google_rating.toFixed(1);
  const reviews = business.google_review_count ?? 0;
  const name = esc(business.name);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="72" viewBox="0 0 220 72" role="img" aria-label="${name} — findme.hair Top Rated ${year}">
  <rect x="1" y="1" width="218" height="70" rx="10" fill="#FFFDF8" stroke="#C9A96E" stroke-width="2"/>
  <path d="M26 14l3.7 7.5 8.3 1.2-6 5.85 1.4 8.25-7.4-3.9-7.4 3.9 1.4-8.25-6-5.85 8.3-1.2L26 14z" fill="#C9A96E"/>
  <text x="50" y="28" font-family="Georgia, serif" font-size="15" font-weight="bold" fill="#1A1A1A">Top Rated ${year}</text>
  <text x="50" y="45" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#6B6B6B">${rating}★ · ${reviews} Google reviews</text>
  <text x="50" y="61" font-family="Helvetica, Arial, sans-serif" font-size="10" fill="#A8895A">findme.hair</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
