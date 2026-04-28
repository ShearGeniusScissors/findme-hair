import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { AU_STATES, stateName } from '@/lib/geo';
import { listRegions, searchBusinesses, countBusinessesByRegion } from '@/lib/search';
import type { AuState, Region } from '@/types/database';

export const revalidate = 3600; // ISR — regenerate at most once per hour

/* ─── Priority region ordering per state ──────────────── */

const PRIORITY_REGIONS: Record<string, string[]> = {
  VIC: ['melbourne', 'ballarat', 'geelong'],
  NSW: ['sydney', 'newcastle', 'wollongong'],
  QLD: ['brisbane', 'gold-coast', 'sunshine-coast'],
  WA: ['perth'],
  SA: ['adelaide'],
};

function isMelbourneZone(region: Region): boolean {
  const n = region.name.toLowerCase();
  return n.startsWith('melbourne') || n === 'melbourne';
}

function isCityZone(region: Region, city: string): boolean {
  const n = region.name.toLowerCase();
  return n.startsWith(city.toLowerCase());
}

function sortRegions(regions: Region[], stateCode: string): Region[] {
  const priorities = PRIORITY_REGIONS[stateCode] ?? [];
  return [...regions].sort((a, b) => {
    const aSlug = a.slug.toLowerCase();
    const bSlug = b.slug.toLowerCase();
    const aIdx = priorities.findIndex((p) => aSlug.startsWith(p));
    const bIdx = priorities.findIndex((p) => bSlug.startsWith(p));
    const aPri = aIdx >= 0 ? aIdx : 999;
    const bPri = bIdx >= 0 ? bIdx : 999;
    if (aPri !== bPri) return aPri - bPri;
    return a.name.localeCompare(b.name);
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const code = state.toUpperCase() as AuState;
  const name = stateName(code);
  const path = `https://www.findme.hair/${state.toLowerCase()}`;
  // Long state names like "Australian Capital Territory" overflow 60 chars.
  const fullTitle = `Hair Salons & Barbers in ${name} — findme.hair`;
  const title = fullTitle.length <= 60
    ? fullTitle
    : `Hair Salons & Barbers in ${code} — findme.hair`;
  return {
    title,
    description: `Find verified hair salons and barbers across ${name}. Browse by city and suburb. Free listings, real reviews.`,
    alternates: {
      canonical: path,
      languages: {
        'en-AU': path,
        'x-default': path,
      },
    },
    openGraph: {
      title: `Hair Salons & Barbers in ${name} — findme.hair`,
      description: `Find verified hair salons and barbers across ${name}. Browse by city and suburb.`,
      url: path,
      siteName: 'findme.hair',
      locale: 'en_AU',
      type: 'website',
      images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const code = state.toUpperCase() as AuState;
  if (!AU_STATES.some((s) => s.code === code)) notFound();

  const name = stateName(code);
  const allRegions = await listRegions(code);

  // Group Melbourne metro zones into one card (VIC only)
  const melbourneZones = code === 'VIC' ? allRegions.filter(isMelbourneZone) : [];
  const nonMelbourneRegions = code === 'VIC' ? allRegions.filter((r) => !isMelbourneZone(r)) : allRegions;

  // Get counts for all regions in parallel
  const regionIds = allRegions.map((r) => r.id);
  const countResults = await Promise.all(regionIds.map((id) => countBusinessesByRegion(id)));
  const countMap = new Map<string, number>();
  regionIds.forEach((id, i) => countMap.set(id, countResults[i]));

  // Melbourne total
  const melbourneTotal = melbourneZones.reduce((sum, r) => sum + (countMap.get(r.id) ?? 0), 0);

  // Build display regions
  interface DisplayRegion {
    id: string;
    name: string;
    slug: string;
    state: AuState;
    count: number;
    href: string;
  }

  const displayRegions: DisplayRegion[] = [];

  if (melbourneZones.length > 0) {
    // Melbourne is a virtual aggregate (no single 'melbourne' region row — there are 7 melbourne-* zones).
    // Link to the first zone as the primary entry-point so the link is hierarchical rather than a search URL.
    const primaryMelbourneSlug =
      melbourneZones.find((z) => z.slug === 'melbourne-cbd')?.slug ??
      melbourneZones[0]?.slug ??
      'melbourne-cbd';
    displayRegions.push({
      id: 'melbourne-metro',
      name: 'Melbourne',
      slug: primaryMelbourneSlug,
      state: code,
      count: melbourneTotal,
      href: `/${code.toLowerCase()}/${primaryMelbourneSlug}`,
    });
  }

  for (const r of nonMelbourneRegions) {
    displayRegions.push({
      id: r.id,
      name: r.name,
      slug: r.slug,
      state: r.state,
      count: countMap.get(r.id) ?? 0,
      href: `/${code.toLowerCase()}/${r.slug}`,
    });
  }

  // Sort by priority
  const sorted = sortDisplayRegions(displayRegions, code);

  // Get top rated businesses for this state
  const featured = await searchBusinesses({ state: code, limit: 6 });

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Hair salons and barbers in ${name}`,
        url: `https://www.findme.hair/${code.toLowerCase()}`,
        about: { '@id': 'https://www.findme.hair/#organization' },
        isPartOf: { '@id': 'https://www.findme.hair/#website' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `Where can I find a hairdresser in ${name}?`, acceptedAnswer: { '@type': 'Answer', text: `findme.hair lists verified hairdressers across all major ${name} regions and suburbs. Browse the regions below or use the search to find a salon by suburb name.` } },
          { '@type': 'Question', name: `How are listings ranked in ${name}?`, acceptedAnswer: { '@type': 'Answer', text: `Listings are ranked by Google star rating and review count. Featured (paid) placement is clearly marked at the top of each region. The default ranking is editorial.` } },
          { '@type': 'Question', name: `How many hair salons does findme.hair list in ${name}?`, acceptedAnswer: { '@type': 'Answer', text: `findme.hair covers ${sorted.length} regions across ${name} with thousands of verified hair salons, barber shops, and unisex salons. Every listing is hand-verified.` } },
        ],
      }} />
      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium">{name}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-editorial-overline">Directory</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Hair salons &amp; barbers in {name}
          </h1>
          <p className="mt-2 text-[var(--color-ink-light)]">
            Browse {sorted.length} {sorted.length === 1 ? 'region' : 'regions'} across {name}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Regions grid */}
        <section>
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Regions
          </h2>
          {sorted.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
              No regions have been added for {name} yet. Check back soon.
            </p>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {sorted.map((r) => (
                <Link
                  key={r.id}
                  href={r.href}
                  className="card group flex items-center gap-4 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-warm)] text-xs font-bold text-[var(--color-ink-muted)] group-hover:bg-[var(--color-gold-light)] group-hover:text-[var(--color-gold-dark)] transition-colors">
                    {r.state}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-[var(--color-ink)] group-hover:text-[var(--color-gold-dark)] transition-colors">
                      {r.name}
                    </span>
                    {r.count > 0 && (
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                        {r.count.toLocaleString()} {r.count === 1 ? 'listing' : 'listings'}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 flex-shrink-0 text-[var(--color-border)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--color-gold)] transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
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
                Top rated in {name}
              </h2>
              <Link
                href={`/search?state=${code}`}
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
      </div>
    </main>
  );
}

/* ─── Helpers ──────────────────────────────────────────── */

function sortDisplayRegions(
  regions: { id: string; name: string; slug: string; state: AuState; count: number; href: string }[],
  stateCode: string,
) {
  const priorities = PRIORITY_REGIONS[stateCode] ?? [];
  return [...regions].sort((a, b) => {
    const aSlug = a.slug.toLowerCase();
    const bSlug = b.slug.toLowerCase();
    const aIdx = priorities.findIndex((p) => aSlug.startsWith(p));
    const bIdx = priorities.findIndex((p) => bSlug.startsWith(p));
    const aPri = aIdx >= 0 ? aIdx : 999;
    const bPri = bIdx >= 0 ? bIdx : 999;
    if (aPri !== bPri) return aPri - bPri;
    return a.name.localeCompare(b.name);
  });
}

function Chevron() {
  return (
    <svg className="w-3 h-3 text-[var(--color-border)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
