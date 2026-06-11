import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import CardRail from '@/components/CardRail';
import JsonLd from '@/components/JsonLd';
import MapView from '@/components/MapView';
import SuburbGridControls, { type CardFacets } from '@/components/SuburbGridControls';
import { AU_STATES, stateName, titleCase } from '@/lib/geo';
import { isOpenOnDay } from '@/lib/openNow';
import {
  getRegionBySlug,
  getSuburbActiveStats,
  getSuburbBusinesses,
  getSuburbByRegionAndSlug,
  listSuburbsInRegion,
} from '@/lib/search';
import type { AuState } from '@/types/database';

export const revalidate = 3600; // ISR — regenerate at most once per hour

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
  const suburbName = titleCase(suburbRow?.name ?? suburb.replace(/-/g, ' '));
  const postcode = suburbRow?.postcode ?? '';
  const fullState = stateName(stateCode);

  // Check if suburb has active listings — noindex empty pages
  const businesses = await getSuburbBusinesses(stateCode, region, suburb);
  const hasListings = businesses.length > 0;

  const path = `https://www.findme.hair/${state.toLowerCase()}/${region}/${suburb}`;
  // Hard-cap title at 60 chars. Long suburb names (e.g. "Bundaberg Central")
  // overflow the default — fall back to a shorter form keyword-front.
  const fullTitle = `Hair Salons & Barbers in ${suburbName}, ${stateCode} — findme.hair`;
  const title = fullTitle.length <= 60
    ? fullTitle
    : `${suburbName} ${stateCode} Hair & Barbers — findme.hair`;
  return {
    title,
    description: `Find hair salons and barbers in ${suburbName}${postcode ? ` ${postcode}` : ''}, ${fullState}. Verified listings with real Google reviews, hours, and Book Now links.`,
    alternates: {
      canonical: path,
      languages: {
        'en-AU': path,
        'x-default': path,
      },
    },
    ...(!hasListings && { robots: { index: false, follow: true } }),
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
  const readable = titleCase(
    (await getSuburbByRegionAndSlug(regionRow?.id ?? '', suburb))?.name ??
    suburb.replace(/-/g, ' ')
  );

  const businesses = await getSuburbBusinesses(stateCode, region, suburb);

  // Nearby suburbs for internal linking — counted links (Zillow
  // child-geography pattern, playbook Part 3 #10): "Collingwood — 19 salons
  // · 4.6★ avg" beats a bare name. One light query per suburb (5 max, hourly ISR).
  const allSuburbs = regionRow ? await listSuburbsInRegion(regionRow.id) : [];
  const nearbySuburbs = await Promise.all(
    allSuburbs
      .filter((s) => s.slug !== suburb)
      .slice(0, 5)
      .map(async (s) => {
        const stats = regionRow
          ? await getSuburbActiveStats(stateCode, regionRow.id, s.name)
          : { count: 0, avgRating: null };
        return { ...s, count: stats.count, avgRating: stats.avgRating };
      }),
  );

  const fullState = stateName(stateCode);

  // "At a glance" stats — computed from the already-fetched listings, no extra
  // query (playbook Tactic 7: one data sentence + stat block above the grid).
  // Real numbers only; each stat renders only when the data backs it.
  const salonCount = businesses.filter((b) => b.business_type === 'hair_salon').length;
  const barberCount = businesses.filter((b) => b.business_type === 'barber').length;
  const unisexCount = businesses.filter((b) => b.business_type === 'unisex').length;
  const rated = businesses.filter(
    (b) => b.google_rating != null && (b.google_review_count ?? 0) > 0,
  );
  const avgRating =
    rated.length >= 3
      ? rated.reduce((sum, b) => sum + (b.google_rating ?? 0), 0) / rated.length
      : null;
  const totalReviews = rated.reduce((sum, b) => sum + (b.google_review_count ?? 0), 0);
  const walkInCount = businesses.filter((b) => b.walk_ins_welcome === true).length;
  const updatedLabel = new Date().toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: fullState, item: `https://www.findme.hair/${stateCode.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: regionRow?.name ?? region, item: `https://www.findme.hair/${stateCode.toLowerCase()}/${region}` },
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
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <Link href={`/${stateCode.toLowerCase()}`} className="hover:text-[var(--color-gold-dark)]">
              {stateName(stateCode)}
            </Link>
            {regionRow && (
              <>
                <Chevron />
                <Link href={`/${stateCode.toLowerCase()}/${region}`} className="hover:text-[var(--color-gold-dark)]">
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
          <p className="text-editorial-overline">{titleCase(regionRow?.name ?? region)} &middot; {stateName(stateCode)}</p>
          <h1
            className="mt-3 text-3xl capitalize text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Hair salons &amp; barbers in {readable}
          </h1>
          <p className="mt-2 text-[var(--color-ink-light)]">
            {businesses.length} verified {businesses.length === 1 ? 'listing' : 'listings'}
          </p>
          {businesses.length > 1 && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-light)]">
              Compare {businesses.length} hair salons and barbers in {readable} &mdash;{' '}
              {totalReviews > 0
                ? `real Google ratings from ${totalReviews.toLocaleString('en-AU')} reviews, `
                : ''}
              opening hours and booking links, all in one place. (Updated {updatedLabel})
            </p>
          )}
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
          <>
            {/* At a glance — real stats from the listings on this page (Tactic 7) */}
            {businesses.length >= 3 && (
              <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  {readable} at a glance
                </p>
                <dl className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
                  {salonCount > 0 && (
                    <div>
                      <dt className="text-xs text-[var(--color-ink-muted)]">Hair salons</dt>
                      <dd className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                        {salonCount}
                      </dd>
                    </div>
                  )}
                  {barberCount > 0 && (
                    <div>
                      <dt className="text-xs text-[var(--color-ink-muted)]">Barbers</dt>
                      <dd className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                        {barberCount}
                      </dd>
                    </div>
                  )}
                  {unisexCount > 0 && (
                    <div>
                      <dt className="text-xs text-[var(--color-ink-muted)]">Unisex</dt>
                      <dd className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                        {unisexCount}
                      </dd>
                    </div>
                  )}
                  {avgRating != null && (
                    <div>
                      <dt className="text-xs text-[var(--color-ink-muted)]">Average rating on Google</dt>
                      <dd className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                        {avgRating.toFixed(1)} <span className="text-[var(--color-gold)]">★</span>
                      </dd>
                    </div>
                  )}
                  {walkInCount > 0 && (
                    <div>
                      <dt className="text-xs text-[var(--color-ink-muted)]">Welcome walk-ins</dt>
                      <dd className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                        {walkInCount}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Answer-first block (playbook Part 3 #4) — the question users
                and AI engines both ask, answered in one sentence with the top
                three named and linked. Cards are already in weighted-rating
                order; require ≥5 reviews so a 5.0★/2-review listing can't
                headline the suburb. Real data only. */}
            {(() => {
              const topRated = businesses
                .filter((b) => b.google_rating != null && (b.google_review_count ?? 0) >= 5)
                .slice(0, 3);
              if (topRated.length < 3) return null;
              return (
                <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] px-6 py-5">
                  <h2 className="text-base font-semibold text-[var(--color-ink)]">
                    Which are the highest-rated salons in {readable}?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-light)]">
                    {topRated.map((b, i) => (
                      <span key={b.id}>
                        {i === 2 ? ' and ' : i === 1 ? ', ' : ''}
                        <Link
                          href={`/salon/${b.slug}`}
                          className="font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                        >
                          {b.name}
                        </Link>
                      </span>
                    ))}{' '}
                    are currently the highest-rated of {readable}&rsquo;s {businesses.length} listed
                    salons, based on Google ratings and review volume.
                  </p>
                </div>
              );
            })()}
            {/* Card rails (playbook Part 3 #5 — Domain listing-rails rhythm).
                Only on suburbs big enough that a shortlist adds value (≥10
                listings) and only when a rail has ≥4 real qualifiers — never
                pad, never duplicate the whole grid. Businesses arrive in
                weighted-rating order, so "Top rated" is the head of the list. */}
            {businesses.length >= 10 && (() => {
              const railTop = businesses
                .filter((b) => (b.google_rating ?? 0) >= 4.5 && (b.google_review_count ?? 0) >= 5)
                .slice(0, 8);
              const railSat = businesses
                .filter((b) => isOpenOnDay(b.google_hours, 6))
                .slice(0, 8);
              const railWalk = businesses
                .filter((b) => b.walk_ins_welcome === true)
                .slice(0, 8);
              return (
                <>
                  {railTop.length >= 4 && (
                    <CardRail title={`Top rated in ${readable}`} businesses={railTop} />
                  )}
                  {railSat.length >= 4 && (
                    <CardRail title="Open this Saturday" businesses={railSat} />
                  )}
                  {railWalk.length >= 4 && (
                    <CardRail title="Walk-ins welcome" businesses={railWalk} />
                  )}
                </>
              );
            })()}
            <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
            <div>
              {/* Filter sheet + mobile map toggle (Tactic 9). Cards render on
                  the server and pass through as children — filters are pure
                  client state, so no new crawlable URLs are minted and every
                  card stays in the HTML. Facets/pins are trimmed parallel
                  arrays, not full Business rows, to keep the RSC payload lean. */}
              <SuburbGridControls
                facets={businesses.map((b): CardFacets => ({
                  t: b.business_type,
                  r: b.google_rating,
                  w: b.walk_ins_welcome === true,
                  p: b.google_hours?.periods ?? null,
                }))}
                pins={businesses.map((b) => ({
                  lat: b.lat, lng: b.lng, name: b.name, suburb: b.suburb, state: b.state,
                }))}
              >
                {businesses.map((b) => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </SuburbGridControls>
            </div>
            <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
              <MapView
                pins={businesses.map((b) => ({
                  lat: b.lat, lng: b.lng, name: b.name, suburb: b.suburb, state: b.state,
                }))}
                height={500}
              />
            </aside>
            </div>

            {/* Claim interleave (playbook Part 3 #8, Zillow/Domain pattern) —
                owners scanning this page for their own salon see the pitch
                right where they finish scanning. Locked CTA wording; neutral
                fact only, no urgency. */}
            <div className="mt-10 rounded-xl border border-[var(--color-gold)] bg-[var(--color-gold-light)] px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="text-base font-semibold text-[var(--color-ink)]">
                  Run one of these salons?
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-light)]">
                  Claim your free listing to update photos, hours and booking links.
                </p>
              </div>
              <Link href="/claim" className="btn-gold mt-4 inline-block flex-shrink-0 text-sm sm:mt-0">
                Claim my free listing
              </Link>
            </div>
          </>
        )}

        {/* SEO content section — always shown for internal linking + content */}
        <section className="mt-14 card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            About hair salons in {readable}
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-ink-light)]">
            {businesses.length > 0 ? (
              <>
                <p>
                  {businesses.length} hair salons and barbers in {readable}.
                  {businesses.length >= 3
                    ? ` Top rated: ${businesses.slice(0, 3).map((b) => b.name).join(', ')}.`
                    : businesses.length > 0
                    ? ` Top rated: ${businesses.map((b) => b.name).join(', ')}.`
                    : ''}
                  {' '}Popular services include haircuts, colour treatments and barber services.
                </p>
                <p>
                  Every listing on findme.hair is hand-verified against
                  Google, TrueLocal, and Yellow Pages. Browse {readable}&rsquo;s verified
                  salons and barbers with real Google reviews, hours, and Book Now links.
                </p>
              </>
            ) : (
              <p>
                {readable} is a suburb in {regionRow?.name ?? region},{' '}
                {fullState}. While there are no hair salons or barbers listed here yet,
                new businesses are added weekly. Check nearby suburbs below for
                salons and barbers close to {readable}.
              </p>
            )}
            <p>
              Popular services in {readable} include haircuts, colour treatments,
              balayage, blowdries, and barber services. Many salons in {fullState}{' '}
              offer online booking — look for the &ldquo;Book online&rdquo; badge on listings.
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
                      {titleCase(s.name)}
                    </Link>
                    {s.count > 0 && (
                      <span className="text-[var(--color-ink-muted)]">
                        {' '}&mdash; {s.count} {s.count === 1 ? 'salon' : 'salons'}
                        {s.avgRating != null && <> &middot; {s.avgRating.toFixed(1)}&#9733; avg</>}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            )}
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
