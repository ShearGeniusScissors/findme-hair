import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import { AU_STATES, stateName } from '@/lib/geo';
import { getSuburbBusinesses } from '@/lib/search';
import type { AuState } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function SuburbDirectoryPage({
  params,
}: {
  params: Promise<{ state: string; suburb: string }>;
}) {
  const { state, suburb } = await params;
  const stateCode = state.toUpperCase() as AuState;
  if (!AU_STATES.some((s) => s.code === stateCode)) notFound();

  const readable = decodeURIComponent(suburb).replace(/-/g, ' ');
  const businesses = await getSuburbBusinesses(stateCode, readable);

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <Link
            href="/"
            className="text-sm font-semibold text-rose-600 hover:text-rose-500"
          >
            ← findme.hair
          </Link>
          <h1 className="mt-4 text-3xl font-semibold capitalize text-neutral-900">
            Hair salons & barbers in {readable}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">{stateName(stateCode)}</p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {businesses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">
            No active listings for {readable} yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
