import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { AU_STATES, stateName, titleCase } from '@/lib/geo';
import {
  countBusinessesByRegion,
  getRegionBySlug,
  listSuburbsInRegion,
  searchBusinesses,
} from '@/lib/search';
import type { AuState } from '@/types/database';

export const revalidate = 3600; // ISR — regenerate at most once per hour

interface Params {
  state: string;
  region: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { state, region } = await params;
  const stateCode = state.toUpperCase() as AuState;
  const regionRow = await getRegionBySlug(region);
  const fullState = stateName(stateCode);
  const regionName = titleCase(regionRow?.name ?? region.replace(/-/g, ' '));

  const path = `https://www.findme.hair/${state.toLowerCase()}/${region}`;

  // Hard-cap title at 60 chars. Long region names overflow the default form;
  // fall back to a shorter form keyword-front.
  const fullTitle = `Hair Salons & Barbers in ${regionName}, ${fullState} — findme.hair`;
  const title = fullTitle.length <= 60
    ? fullTitle
    : `${regionName} ${stateCode} Hair & Barbers — findme.hair`;

  return {
    title,
    description: `Find verified hair salons and barbers across ${regionName}, ${fullState}. Browse by suburb, real Google reviews, hours, and Book Now links.`,
    alternates: {
      canonical: path,
      languages: {
        'en-AU': path,
        'x-default': path,
      },
    },
    openGraph: {
      title: `Hair Salons & Barbers in ${regionName} — findme.hair`,
      description: `Find verified hair salons and barbers across ${regionName}, ${fullState}.`,
      url: path,
      siteName: 'findme.hair',
      locale: 'en_AU',
      type: 'website',
      images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function RegionDirectoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { state, region } = await params;
  const stateCode = state.toUpperCase() as AuState;
  if (!AU_STATES.some((s) => s.code === stateCode)) notFound();

  // Tolerant fallback — if the region row isn't found, render with slug-derived
  // display name and fetch by slug instead of region_id. Avoids spurious 404s
  // when name/slug data is being backfilled.
  const regionRow = await getRegionBySlug(region);
  const fullState = stateName(stateCode);
  const regionName = titleCase(regionRow?.name ?? region.replace(/-/g, ' '));
  const regionSlug = regionRow?.slug ?? region;

  // Suburbs in this region (alphabetical) — fall back to filtering by region slug
  // joined through suburbs.region_id when the region row is missing.
  const allSuburbs = regionRow ? await listSuburbsInRegion(regionRow.id) : [];
  const suburbs = [...allSuburbs].sort((a, b) => a.name.localeCompare(b.name));

  // Featured businesses for this region (top rated)
  const featured = await searchBusinesses({ region: regionSlug, limit: 6 });
  const totalCount = regionRow ? await countBusinessesByRegion(regionRow.id) : 0;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: fullState, item: `https://www.findme.hair/${stateCode.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: regionName },
        ],
      }} />
      {suburbs.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Suburbs in ${regionName}, ${fullState}`,
          numberOfItems: suburbs.length,
          itemListElement: suburbs.slice(0, 100).map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `https://www.findme.hair/${stateCode.toLowerCase()}/${region}/${s.slug}`,
            name: titleCase(s.name),
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
              {fullState}
            </Link>
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium">{regionName}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-editorial-overline">{fullState}</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Hair salons &amp; barbers in {regionName}
          </h1>
          <p className="mt-2 text-[var(--color-ink-light)]">
            {totalCount.toLocaleString()} verified {totalCount === 1 ? 'listing' : 'listings'} across {suburbs.length} {suburbs.length === 1 ? 'suburb' : 'suburbs'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Suburbs grid */}
        <section>
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Browse by suburb
          </h2>
          {suburbs.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
              No suburbs have been added for {regionName} yet. Check back soon.
            </p>
          ) : (
            <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {suburbs.map((s) => (
                <Link
                  key={s.id}
                  href={`/${stateCode.toLowerCase()}/${region}/${s.slug}`}
                  className="group flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-2 text-sm text-[var(--color-ink)] transition-colors hover:border-[var(--color-gold)] hover:bg-[var(--color-gold-light)] hover:text-[var(--color-gold-dark)]"
                >
                  <span className="capitalize truncate">
                    {titleCase(s.name)}
                  </span>
                  {s.postcode && (
                    <span className="text-[10px] text-[var(--color-ink-muted)] group-hover:text-[var(--color-gold-dark)] flex-shrink-0 ml-2">
                      {s.postcode}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured listings */}
        {featured.length > 0 && (
          <section className="mt-14">
            <div className="flex items-baseline justify-between">
              <h2
                className="text-xl text-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Top rated in {regionName}
              </h2>
              <Link
                href={`/search?region=${region}`}
                className="text-sm font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {featured.map((b) => (
                <Link
                  key={b.id}
                  href={`/salon/${b.slug}`}
                  className="card p-5 group"
                >
                  <p className="text-xs font-medium text-[var(--color-ink-muted)]">
                    {b.suburb}
                  </p>
                  <p className="mt-1 font-semibold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-gold-dark)] transition-colors">
                    {b.name}
                  </p>
                  {b.google_rating != null && (
                    <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">
                      <span className="text-[var(--color-gold)]">&#9733;</span> {b.google_rating.toFixed(1)}
                      {b.google_review_count != null && ` (${b.google_review_count})`}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SEO content */}
        <section className="mt-14 card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            About hair salons in {regionName}
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-ink-light)]">
            <p>
              {regionName} is home to {totalCount.toLocaleString()} verified hair salons and barbers across{' '}
              {suburbs.length} {suburbs.length === 1 ? 'suburb' : 'suburbs'}. Every listing on findme.hair is
              hand-verified against Google, TrueLocal, and Yellow Pages.
            </p>
            <p>
              Popular services across {regionName} include haircuts, colour treatments, balayage, blowdries,
              and barber services. Many salons in {fullState} offer online booking — look for the{' '}
              &ldquo;Book online&rdquo; badge on listings.
            </p>
          </div>
        </section>
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
