import { NextResponse, type NextRequest } from 'next/server';
import { TOP_SUBURBS } from '@/lib/suburbConfig';
import { PIVOT_CITIES } from '@/lib/cityPivotConfig';

/**
 * Audit follow-up: pivot routes like /hairdresser/:slug and /best-hairdresser/:city
 * were hard-coded `dynamicParams = false`, so any slug not in TOP_SUBURBS /
 * PIVOT_CITIES returned a Vercel-platform 404. Users typing legitimate names
 * (e.g. /hairdresser/bondi, /best-hairdresser/wagga-wagga) hit dead ends.
 *
 * This middleware intercepts unknown slugs and 307-redirects to /search with
 * a sensible query + type filter, instead of a hard 404. Known slugs pass
 * through to the existing pre-rendered static page.
 *
 * Runs at the edge — adds ~1ms. The set lookups are O(1).
 */

const SUBURB_SLUGS = new Set(TOP_SUBURBS.map((s) => s.slug));
const CITY_SLUGS = new Set(PIVOT_CITIES.map((c) => c.slug));

const SUBURB_PIVOTS: Record<string, 'hair_salon' | 'barber' | undefined> = {
  hairdresser: 'hair_salon',
  'hair-salon': 'hair_salon',
  'at-home-hairdresser': 'hair_salon',
  barber: 'barber',
};

const CITY_PIVOTS: Record<string, 'hair_salon' | 'barber' | undefined> = {
  'best-hairdresser': 'hair_salon',
  'best-barber': 'barber',
  'best-haircut': undefined,
  'mobile-hairdresser': 'hair_salon',
  'korean-hair-salon': 'hair_salon',
  'japanese-hairdresser': 'hair_salon',
  'walk-in-barber': 'barber',
  'kids-hairdresser': 'hair_salon',
  'balayage-specialist': 'hair_salon',
  'bridal-hair': 'hair_salon',
  'hair-extensions': 'hair_salon',
  'mens-haircut': 'barber',
  'curly-hair-specialist': 'hair_salon',
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length !== 2) return NextResponse.next();

  const [base, slug] = parts;

  if (base in SUBURB_PIVOTS && !SUBURB_SLUGS.has(slug)) {
    const dest = new URL('/search', url);
    dest.searchParams.set('q', slug.replace(/-/g, ' '));
    const t = SUBURB_PIVOTS[base];
    if (t) dest.searchParams.set('type', t);
    return NextResponse.redirect(dest, 307);
  }

  if (base in CITY_PIVOTS && !CITY_SLUGS.has(slug)) {
    const dest = new URL('/search', url);
    dest.searchParams.set('q', slug.replace(/-/g, ' '));
    const t = CITY_PIVOTS[base];
    if (t) dest.searchParams.set('type', t);
    return NextResponse.redirect(dest, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/hairdresser/:slug',
    '/hair-salon/:slug',
    '/at-home-hairdresser/:slug',
    '/barber/:slug',
    '/best-hairdresser/:slug',
    '/best-barber/:slug',
    '/best-haircut/:slug',
    '/mobile-hairdresser/:slug',
    '/korean-hair-salon/:slug',
    '/japanese-hairdresser/:slug',
    '/walk-in-barber/:slug',
    '/kids-hairdresser/:slug',
    '/balayage-specialist/:slug',
    '/bridal-hair/:slug',
    '/hair-extensions/:slug',
    '/mens-haircut/:slug',
    '/curly-hair-specialist/:slug',
  ],
};
