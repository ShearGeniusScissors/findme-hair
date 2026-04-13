import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import JsonLd from '@/components/JsonLd';
import MapView from '@/components/MapView';
import { AU_STATES, stateName } from '@/lib/geo';
import {
  getRegionBySlug,
  getSuburbBusinesses,
  getSuburbByRegionAndSlug,
  listSuburbsInRegion,
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
  const postcode = suburbRow?.postcode ?? '';
  const fullState = stateName(stateCode);
  const regionName = regionRow?.name ?? region.replace(/-/g, ' ');
  return {
    title: `Hair Salons & Barbers in ${suburbName}, ${regionName} ${stateCode} — findme.hair`,
    description: `Find hair salons and barbers in ${suburbName}${postcode ? ` ${postcode}` : ''}, ${fullState}. Verified listings with real Google reviews, hours, and Book Now links.`,
    alternates: { canonical: `https://www.findme.hair/${state.toLowerCase()}/${region}/${suburb}` },
    openGraph: {
      title: `Hair Salons & Barbers in ${suburbName} — findme.hair`,
      description: `Find hair salons and barbers in ${suburbName}, ${fullState}. Verified listings with reviews and booking.`,
      url: `https://www.findme.hair/${state.toLowerCase()}/${region}/${suburb}`,
      siteName: 'findme.hair',
      locale: 'en_AU',
      type: 'website',
      images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
    },
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

  // Nearby suburbs for internal linking
  const allSuburbs = regionRow ? await listSuburbsInRegion(regionRow.id) : [];
  const nearbySuburbs = allSuburbs
    .filter((s) => s.slug !== suburb)
    .slice(0, 5);

  const fullState = stateName(stateCode);

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: fullState, item: `https://www.findme.hair/${stateCode.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: regionRow?.name ?? region, item: `https://www.findme.hair/search?region=${region}` },
          { '@type': 'ListItem', position: 4, name: readable },
        ],
      }} />
      {businesses.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Hair Salons & Barbers in ${readable}`,
          numberOfItems: businesses.length,
          itemListElement: businesses.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `https://www.findme.hair/salon/${b.slug}`,
            name: b.name,
          })),
        }} />
      )}
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
              <MapView pins={businesses} height={500} />
            </aside>
          </div>
        )}

        {/* SEO content section */}
        {businesses.length > 0 && (
          <section className="mt-14 card p-8">
            <h2
              className="text-xl text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              About hair salons in {readable}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-ink-light)]">
              <p>
                There {businesses.length === 1 ? 'is' : 'are'} {businesses.length} verified hair{' '}
                {businesses.length === 1 ? 'salon' : 'salons'} and{' '}
                {businesses.length === 1 ? 'barber' : 'barbers'} in {readable},{' '}
                {fullState}. Every listing on findme.hair is hand-verified against
                Google, TrueLocal, and Yellow Pages.
              </p>
              <p>
                Popular services in {readable} include haircuts, colour treatments,
                balayage, blowdries, and barber services. Many salons offer online
                booking — look for the &ldquo;Book online&rdquo; badge above.
              </p>
              {nearbySuburbs.length > 0 && (
                <p>
                  Nearby suburbs:{' '}
                  {nearbySuburbs.map((s, i) => (
                    <span key={s.slug}>
                      {i > 0 && ', '}
                      <Link
                        href={`/${stateCode.toLowerCase()}/${region}/${s.slug}`}
                        className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                      >
                        {s.name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          </section>
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
