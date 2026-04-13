import Link from 'next/link';
import BusinessCard from '@/components/BusinessCard';
import MapView from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import {
  listRegions,
  listSuburbsInRegion,
  getRegionBySlug,
  searchBusinesses,
} from '@/lib/search';
import type { AuState, BusinessType } from '@/types/database';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  state?: string;
  region?: string;
  suburb?: string;
  type?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [businesses, regions] = await Promise.all([
    searchBusinesses({
      q: params.q,
      state: params.state as AuState | undefined,
      region: params.region,
      suburb: params.suburb,
      type: params.type as BusinessType | undefined,
      limit: 40,
    }),
    listRegions(params.state as AuState | undefined),
  ]);

  let suburbs: { id: string; name: string; slug: string }[] = [];
  if (params.region) {
    const region = await getRegionBySlug(params.region);
    if (region) {
      const subs = await listSuburbsInRegion(region.id);
      suburbs = subs.map((s) => ({ id: s.id, name: s.name, slug: s.slug }));
    }
  }

  const hasFilters = !!(params.q || params.state || params.region || params.suburb || params.type);

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      {/* ─── Search header ────────────────────────────── */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-white)]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="max-w-2xl">
            <SearchBar defaultValue={params.q ?? ''} />
          </div>

          {/* Filters */}
          <form className="mt-4 flex flex-wrap gap-3" action="/search" method="GET">
            {params.q && <input type="hidden" name="q" value={params.q} />}

            <FilterSelect
              name="state"
              defaultValue={params.state}
              label="State"
              options={[
                { value: 'VIC', label: 'Victoria' },
                { value: 'NSW', label: 'New South Wales' },
                { value: 'QLD', label: 'Queensland' },
                { value: 'WA', label: 'Western Australia' },
                { value: 'SA', label: 'South Australia' },
                { value: 'TAS', label: 'Tasmania' },
                { value: 'NT', label: 'Northern Territory' },
                { value: 'ACT', label: 'ACT' },
              ]}
            />

            <FilterSelect
              name="region"
              defaultValue={params.region}
              label="Region"
              options={regions.map((r) => ({
                value: r.slug,
                label: `${r.name} (${r.state})`,
              }))}
            />

            {suburbs.length > 0 && (
              <FilterSelect
                name="suburb"
                defaultValue={params.suburb}
                label="Suburb"
                options={suburbs.map((s) => ({
                  value: s.name,
                  label: s.name,
                }))}
              />
            )}

            <FilterSelect
              name="type"
              defaultValue={params.type}
              label="Type"
              options={[
                { value: 'hair_salon', label: 'Hair Salon' },
                { value: 'barber', label: 'Barber' },
                { value: 'unisex', label: 'Unisex' },
              ]}
            />

            <button type="submit" className="btn-gold text-xs !py-2 !px-5">
              Apply
            </button>

            {hasFilters && (
              <Link
                href="/search"
                className="flex items-center text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                Clear all
              </Link>
            )}
          </form>
        </div>
      </div>

      {/* ─── Results ──────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-xl font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
            {businesses.length} {businesses.length === 1 ? 'result' : 'results'}
            {params.q ? (
              <span className="font-normal text-[var(--color-ink-muted)]">
                {' '}for &ldquo;{params.q}&rdquo;
              </span>
            ) : null}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,480px)]">
          {/* Listings */}
          <div>
            {businesses.length === 0 ? (
              <EmptyState query={params.q} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {businesses.map((b) => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </div>
            )}
          </div>

          {/* Map sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <MapView businesses={businesses} height={600} />
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-components ────────────────────────────────────── */

function FilterSelect({
  name,
  defaultValue,
  label,
  options,
}: {
  name: string;
  defaultValue?: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ''}
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none"
    >
      <option value="">All {label.toLowerCase()}s</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-warm)]">
        <svg className="w-6 h-6 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
        No results found
      </h2>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
        {query
          ? `We couldn't find any hair salons or barber shops matching "${query}".`
          : 'Try searching by suburb name, salon name, or postcode.'}
      </p>
      <p className="mt-4 text-xs text-[var(--color-ink-muted)]">
        findme.hair is growing &mdash; new suburbs are added weekly.
      </p>
    </div>
  );
}
