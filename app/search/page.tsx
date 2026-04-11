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

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link href="/" className="text-sm font-semibold text-rose-600 hover:text-rose-500">
            ← findme.hair
          </Link>
          <div className="mt-4">
            <SearchBar defaultValue={params.q ?? ''} />
          </div>

          <form className="mt-4 flex flex-wrap gap-3" action="/search" method="GET">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            <select
              name="region"
              defaultValue={params.region ?? ''}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm"
            >
              <option value="">All regions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name} ({r.state})
                </option>
              ))}
            </select>
            <select
              name="suburb"
              defaultValue={params.suburb ?? ''}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm disabled:opacity-50"
              disabled={suburbs.length === 0}
            >
              <option value="">All suburbs</option>
              {suburbs.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={params.type ?? ''}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm"
            >
              <option value="">All types</option>
              <option value="hair_salon">Hair salon</option>
              <option value="barber">Barber</option>
              <option value="unisex">Unisex</option>
            </select>
            <button
              type="submit"
              className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Apply filters
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {businesses.length} {businesses.length === 1 ? 'result' : 'results'}
          {params.q ? ` for “${params.q}”` : ''}
        </h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
          <div className="space-y-4">
            {businesses.length === 0 ? (
              <EmptyState query={params.q} />
            ) : (
              businesses.map((b) => <BusinessCard key={b.id} business={b} />)
            )}
          </div>
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <MapView businesses={businesses} height={540} />
          </aside>
        </div>
      </div>
    </main>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-neutral-900">No results found</h2>
      <p className="mt-2 text-sm text-neutral-600">
        {query
          ? `We couldn't find any hair salons or barber shops matching “${query}”.`
          : 'Start by typing a suburb or salon name above.'}
      </p>
      <p className="mt-4 text-xs text-neutral-500">
        findme.hair is still in pilot — if we&rsquo;re missing a suburb, we&rsquo;ll add it soon.
      </p>
    </div>
  );
}
