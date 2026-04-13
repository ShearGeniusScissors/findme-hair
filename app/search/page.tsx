import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import {
  listRegions,
  listSuburbsInRegion,
  getRegionBySlug,
  searchBusinesses,
  searchBusinessesCount,
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
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [businesses, totalCount, regions] = await Promise.all([
    searchBusinesses({
      q: params.q,
      state: params.state as AuState | undefined,
      region: params.region,
      suburb: params.suburb,
      type: params.type as BusinessType | undefined,
      limit: 20,
    }),
    searchBusinessesCount({
      q: params.q,
      state: params.state as AuState | undefined,
      region: params.region,
      suburb: params.suburb,
      type: params.type as BusinessType | undefined,
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

  const hasFilters = !!(params.q || params.state || params.region || params.suburb || params.type || params.service);

  // Build a label for the results heading
  const queryLabel = params.q || params.suburb || params.region || params.state || null;

  // Params to pass to client for load-more
  const clientParams: Record<string, string> = {};
  if (params.q) clientParams.q = params.q;
  if (params.state) clientParams.state = params.state;
  if (params.region) clientParams.region = params.region;
  if (params.suburb) clientParams.suburb = params.suburb;
  if (params.type) clientParams.type = params.type;

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

            <FilterSelect
              name="service"
              defaultValue={params.service}
              label="Service"
              options={[
                { value: 'haircut', label: 'Haircut' },
                { value: 'colour', label: 'Colour & highlights' },
                { value: 'barber', label: 'Barber' },
                { value: 'blowdry', label: 'Blowdry' },
                { value: 'kids', label: 'Kids haircut' },
                { value: 'extensions', label: 'Extensions' },
                { value: 'mens', label: 'Mens cut' },
                { value: 'womens', label: 'Womens cut' },
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
