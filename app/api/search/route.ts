import { NextRequest, NextResponse } from 'next/server';
import { searchBusinesses } from '@/lib/search';
import type { AuState, Business, BusinessType } from '@/types/database';

// Audit row 9bee1293 (api-search-scraper-bait) +
// audit row 353f6644 (business-data-anon-key-fully-dumpable).
// Public callers see only the columns needed to render a listing card.
// Phone, internal notes, confidence_score, verification_flags, scraped_about,
// scraped_services, preferred_scissor_supplier_url, last_sale_date are
// intentionally omitted. Phone is still rendered on the SSR /salon/[slug]
// page (server-side anon read), just not in the JSON API.
const PUBLIC_BUSINESS_COLUMNS = [
  'id', 'slug', 'name', 'suburb', 'state', 'postcode', 'business_type',
  'lat', 'lng', 'google_rating', 'google_review_count', 'google_photos',
  'specialties', 'walk_ins_welcome', 'is_claimed', 'featured_until',
  'booking_url', 'website_url',
] as const;
type PublicBusinessKey = (typeof PUBLIC_BUSINESS_COLUMNS)[number];
type PublicBusiness = Pick<Business, PublicBusinessKey>;

function project(b: Business): PublicBusiness {
  const out: Partial<PublicBusiness> = {};
  for (const k of PUBLIC_BUSINESS_COLUMNS) {
    // Index-by-key copy; safe because PUBLIC_BUSINESS_COLUMNS is a closed set.
    (out as Record<string, unknown>)[k] = (b as unknown as Record<string, unknown>)[k];
  }
  return out as PublicBusiness;
}

const MAX_LIMIT = 50;        // was 40 in caller, raised to 50 per audit spec
const MAX_OFFSET = 5000;     // beyond this you're scraping, not browsing

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const rawLimit = Number(params.get('limit')) || 20;
  const rawOffset = Number(params.get('offset')) || 0;
  if (rawOffset > MAX_OFFSET) {
    return NextResponse.json(
      { error: 'offset > 5000 not permitted', max_offset: MAX_OFFSET },
      { status: 400 },
    );
  }
  const businesses = await searchBusinesses({
    q: params.get('q') ?? undefined,
    state: (params.get('state') as AuState) ?? undefined,
    region: params.get('region') ?? undefined,
    suburb: params.get('suburb') ?? undefined,
    type: (params.get('type') as BusinessType) ?? undefined,
    service: params.get('service') ?? undefined,
    specialty: params.get('specialty') ?? undefined,
    walk_ins: params.get('walk_ins') === 'true' ? true : undefined,
    min_rating: params.get('min_rating') ? parseFloat(params.get('min_rating')!) : undefined,
    limit: Math.min(Math.max(rawLimit, 1), MAX_LIMIT),
    offset: rawOffset,
  });
  return NextResponse.json({ businesses: businesses.map(project) });
}
