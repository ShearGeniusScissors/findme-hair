import Link from 'next/link';
import BusinessCard from '@/components/BusinessCard';
import MapView from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import { searchBusinesses } from '@/lib/search';
import type { AuState, BusinessType } from '@/types/database';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  state?: string;
  type?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const businesses = await searchBusinesses({
    q: params.q,
    state: params.state as AuState | undefined,
    type: params.type as BusinessType | undefined,
    limit: 40,
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link
            href="/"
            className="text-sm font-semibold text-rose-600 hover:text-rose-500"
          >
            ← findme.hair
          </Link>
          <div className="mt-4">
            <SearchBar defaultValue={params.q ?? ''} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {businesses.length} {businesses.length === 1 ? 'result' : 'results'}
            {params.q ? ` for “${params.q}”` : ''}
          </h1>
        </div>

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
        findme.hair is still in pilot — if we&rsquo;re missing a suburb, we&rsquo;ll
        add it soon.
      </p>
    </div>
  );
}
