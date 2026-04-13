import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import MapView from '@/components/MapView';
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
  return {
    title: `Hair Salons & Barbers in ${suburbName}, ${stateCode} | findme.hair`,
    description: `Browse verified hair salons and barber shops in ${suburbName}, ${stateName(stateCode)}. Find opening hours, reviews, and booking info.`,
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
  const readable =
    (await getSuburbByRegionAndSlug(regionRow?.id ?? '', suburb))?.name ??
    suburb.replace(/-/g, ' ');

  const businesses = await getSuburbBusinesses(stateCode, region, suburb);

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <Link href={`/${stateCode.toLowerCase()}`} className="hover:text-[var(--color-gold-dark)]">
              {stateName(stateCode)}
            </Link>
            {regionRow && (
              <>
                <Chevron />
                <Link href={`/search?region=${region}`} className="hover:text-[var(--color-gold-dark)]">
                  {regionRow.name}
                </Link>
              </>
            )}
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium capitalize">{readable}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-editorial-overline">{regionRow?.name ?? region} &middot; {stateName(stateCode)}</p>
          <h1
            className="mt-3 text-3xl capitalize text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Hair salons &amp; barbers in {readable}
          </h1>
          <p className="mt-2 text-[var(--color-ink-light)]">
            {businesses.length} verified {businesses.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {businesses.length === 0 ? (
          <div className="card p-12 text-center">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
              No listings yet
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              We haven&rsquo;t found any active hair salons or barbers in {readable} yet.
              New suburbs are added weekly.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
            <div className="grid gap-5 sm:grid-cols-2 content-start">
              {businesses.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
            <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
              <MapView businesses={businesses} height={500} />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Chevron() {
  return (
    <svg className="w-3 h-3 text-[var(--color-border)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
