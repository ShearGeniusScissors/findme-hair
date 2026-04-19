import MatrixSearch from '@/components/MatrixSearch';
import SearchFilters from '@/components/SearchFilters';
import SearchResults from '@/components/SearchResults';
import {
  listRegions,
  listSuburbsInRegion,
  getRegionBySlug,
  searchBusinesses,
  searchBusinessesCount,
  detectRegionFromQuery,
} from '@/lib/search';
import type { AuState, BusinessType } from '@/types/database';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  state?: string;
  region?: string;
  suburb?: string;
  type?: string;
  service?: string;
  specialty?: string;
  walk_ins?: string;
  min_rating?: string;
  distance?: string;
  open_now?: string;
  claimed?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Auto-detect region from query if not explicitly set
  let effectiveRegion = params.region;
  if (!effectiveRegion && params.q) {
    const detected = await detectRegionFromQuery(params.q);
    if (detected) {
      effectiveRegion = detected.slug;
    }
  }

  const filters = {
    q: params.q,
    state: params.state as AuState | undefined,
    region: effectiveRegion,
    suburb: params.suburb,
    type: params.type as BusinessType | undefined,
    service: params.service,
    specialty: params.specialty,
    walk_ins: params.walk_ins === 'true' || params.walk_ins === '1' ? true : undefined,
    claimed: params.claimed === '1' ? true : undefined,
    open_now: params.open_now === '1' ? true : undefined,
    min_rating: params.min_rating ? parseFloat(params.min_rating) : undefined,
  };

  const [businesses, totalCount, regions] = await Promise.all([
    searchBusinesses({ ...filters, limit: 20 }),
    searchBusinessesCount(filters),
    listRegions(),
  ]);

  let suburbs: { id: string; name: string; slug: string }[] = [];
  const activeRegion = effectiveRegion || params.region;
  if (activeRegion) {
    const region = await getRegionBySlug(activeRegion);
    if (region) {
      const subs = await listSuburbsInRegion(region.id);
      suburbs = subs.map((s) => ({ id: s.id, name: s.name, slug: s.slug }));
    }
  }

  // Build a label for the results heading
  const queryLabel = params.q || params.suburb || params.region || params.state || null;

  // Params to pass to client for load-more
  const clientParams: Record<string, string> = {};
  if (params.q) clientParams.q = params.q;
  if (params.state) clientParams.state = params.state;
  if (params.region) clientParams.region = params.region;
  if (params.suburb) clientParams.suburb = params.suburb;
  if (params.type) clientParams.type = params.type;
  if (params.service) clientParams.service = params.service;
  if (params.specialty) clientParams.specialty = params.specialty;
  if (params.walk_ins) clientParams.walk_ins = params.walk_ins;
  if (params.claimed) clientParams.claimed = params.claimed;
  if (params.open_now) clientParams.open_now = params.open_now;
  if (params.min_rating) clientParams.min_rating = params.min_rating;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      {/* ─── Sticky MatrixSearch (compact) ─────────── */}
      <div className="sticky top-16 z-30 border-b border-[var(--color-border)] bg-[var(--color-white)]">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <MatrixSearch
            totalCount={totalCount}
            variant="compact"
            initial={{
              q: params.q,
              type: params.type,
              service: params.service,
              distance: params.distance,
              walk_ins: params.walk_ins === 'true' || params.walk_ins === '1',
              open_now: params.open_now === '1',
              claimed: params.claimed === '1',
              min_rating_4: params.min_rating ? parseFloat(params.min_rating) >= 4 : false,
            }}
          />
        </div>
      </div>

      {/* ─── Advanced filters (regions, specialties) ──── */}
      <SearchFilters
        regions={regions.map((r) => ({ slug: r.slug, name: r.name, state: r.state }))}
        suburbs={suburbs}
        totalCount={totalCount}
      />

      {/* ─── Results ──────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-xl font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
            {totalCount.toLocaleString()} {totalCount === 1 ? 'salon & barber' : 'salons & barbers'}
            {queryLabel ? (
              <span className="font-normal text-[var(--color-ink-muted)]">
                {' '}in {queryLabel}
              </span>
            ) : null}
          </h1>
        </div>

        <SearchResults
          initialBusinesses={businesses}
          totalCount={totalCount}
          searchParams={clientParams}
        />
      </div>
    </main>
  );
}
