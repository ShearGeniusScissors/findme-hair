import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import { AU_STATES, stateName } from '@/lib/geo';
import {
  getRegionBySlug,
  getSuburbBusinesses,
  getSuburbByRegionAndSlug,
} from '@/lib/search';
import type { AuState } from '@/types/database';

export const dynamic = 'force-dynamic';

interface Params {
  state: string;
  region: string;
  suburb: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { state, region, suburb } = await params;
  const stateCode = state.toUpperCase() as AuState;
  const regionRow = await getRegionBySlug(region);
  const suburbRow = regionRow ? await getSuburbByRegionAndSlug(regionRow.id, suburb) : null;
  const suburbName = suburbRow?.name ?? suburb.replace(/-/g, ' ');
  const regionName = regionRow?.name ?? region;
  return {
    title: `Hair Salons & Barbers in ${suburbName}, ${regionName} ${stateCode}`,
    description: `Find hair salons and barbers in ${suburbName}. Browse verified listings, read reviews, and book online.`,
  };
}

export default async function SuburbDirectoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { state, region, suburb } = await params;
  const stateCode = state.toUpperCase() as AuState;
  if (!AU_STATES.some((s) => s.code === stateCode)) notFound();

  const regionRow = await getRegionBySlug(region);
  const readable = (await getSuburbByRegionAndSlug(regionRow?.id ?? '', suburb))?.name ??
    suburb.replace(/-/g, ' ');

  const businesses = await getSuburbBusinesses(stateCode, region, suburb);

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-rose-600">
              findme.hair
            </Link>
            {' / '}
            <Link href={`/search?state=${stateCode}`} className="hover:text-rose-600">
              {stateName(stateCode)}
            </Link>
            {regionRow && (
              <>
                {' / '}
                <Link
                  href={`/search?region=${region}`}
                  className="hover:text-rose-600"
                >
                  {regionRow.name}
                </Link>
              </>
            )}
            {' / '}
            <span className="capitalize text-neutral-800">{readable}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-semibold capitalize text-neutral-900">
            Hair salons &amp; barbers in {readable}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {regionRow?.name ?? region}, {stateName(stateCode)}
          </p>
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
