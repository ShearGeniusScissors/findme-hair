import Link from 'next/link';
import BusinessCard from '@/components/BusinessCard';
import JsonLd from '@/components/JsonLd';
import { stateName, titleCase } from '@/lib/geo';
import { getSuburbHubUrls } from '@/lib/search';
import type { Business } from '@/types/database';
import type { CityConfig } from '@/lib/cityPivotConfig';

// Specialty tags we'll surface inline in editorial cards. Mirrors the
// best-hairdresser/[city] template — keep these two lists in sync.
const NOTABLE_SPECS = new Set<string>([
  'balayage','curly-hair','colour-specialist','colour-correction','japanese',
  'korean','bridal','keratin','mobile','afro','extensions','barber','kids',
  'mens','blow-dry','highlights','organic','wigs',
]);

function firstSentence(text: string, maxLen = 240): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const stop = t.search(/[.!?]\s/);
  if (stop >= 60 && stop <= maxLen) return t.slice(0, stop + 1);
  return t.length > maxLen ? t.slice(0, maxLen) + '…' : t;
}

export interface PivotContent {
  // SEO + UI strings
  h1Prefix: string; // e.g. "Korean Hair Salons", "Walk-in Barbers", "Kids Hairdressers"
  h1Suffix?: string; // optional appended bit, e.g. "(Kid-Friendly)"
  routePrefix: string; // e.g. "korean-hair-salon" — used for self-link city tags
  metaDescribeShort: string; // descriptive short phrase, e.g. "Korean hair salons specialising in straight perm, magic straightening, and Korean cuts"
  hero: string; // 1-2 sentence intro under H1, with {city}/{state} placeholders
  guideTitle: string; // "How to find a Korean hair salon in {city}"
  guideIntro: string; // 1-2 paragraph intro for the guide section
  whatToLook: string[]; // bullets
  faq: Array<{ q: string; a: string }>; // {city} placeholder allowed
  scissorPlug?: { text: string; linkText: string; linkHref: string };
  cityCardLinkLabel?: string; // optional label override for the cross-city tag pills
}

interface Props {
  city: CityConfig;
  businesses: Business[];
  content: PivotContent;
  allCities: CityConfig[];
  // Optional: if provided, used for the empty-state link target
  emptyStateFallbackHref?: string;
}

const interp = (s: string, vars: Record<string, string>): string =>
  s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export default async function CityPivotPage({ city, businesses, content, allCities, emptyStateFallbackHref }: Props) {
  const fullState = stateName(city.state);
  const year = new Date().getFullYear();
  const hasResults = businesses.length >= 3;
  // Repoint the "suburbs covered" chips off robots-blocked /search onto the real
  // crawlable /[state]/[region]/[suburb] hub. Resolved from the DB; any suburb
  // that doesn't resolve keeps the old link, so this can never regress.
  const suburbHubUrls = await getSuburbHubUrls(city.state, city.suburbs);
  const vars = { city: city.name, state: fullState, suburbs5: city.suburbs.slice(0, 5).map(titleCase).join(', ') };
  const h1 = `${content.h1Prefix} in ${city.name}${content.h1Suffix ? ' ' + content.h1Suffix : ''} (${year})`;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: fullState, item: `https://www.findme.hair/${city.state.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: `${content.h1Prefix} in ${city.name}` },
        ],
      }} />
      {businesses.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${content.h1Prefix} in ${city.name}`,
          numberOfItems: businesses.length,
          itemListElement: businesses.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `https://www.findme.hair/salon/${b.slug}`,
            name: b.name,
          })),
        }} />
      )}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faq.map((f) => ({
          '@type': 'Question',
          name: interp(f.q, vars),
          acceptedAnswer: { '@type': 'Answer', text: interp(f.a, vars) },
        })),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url: `https://www.findme.hair/${content.routePrefix}/${city.slug}`,
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', 'h2', '.text-editorial-overline'],
        },
      }} />

      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <ChevronIcon />
            <Link href={`/${city.state.toLowerCase()}`} className="hover:text-[var(--color-gold-dark)]">
              {fullState}
            </Link>
            <ChevronIcon />
            <span className="text-[var(--color-ink)] font-medium">{content.h1Prefix} in {city.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-editorial-overline">{city.name} &middot; {fullState}</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {h1}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            {interp(content.hero, vars)}
          </p>
        </div>
      </div>

      {/* Listings */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {hasResults ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
              We&rsquo;re still verifying {content.h1Prefix.toLowerCase()} in {city.name}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              Browse all {city.name} hair salons and barbers below — many cover this category.
            </p>
            <Link
              href={emptyStateFallbackHref ?? `/best-hairdresser/${city.slug}`}
              className="mt-6 inline-block btn-gold"
            >
              See all {city.name} salons &amp; barbers
            </Link>
          </div>
        )}

        {/* Notes from the field — editorial commentary on top picks.
            Mirrors the best-hairdresser/[city] page. Built specifically to
            give AI assistants (ChatGPT, Perplexity, etc.) quotable
            attributed paragraphs about each named salon. Brand Radar data
            confirmed AI never cites directory list pages but quotes
            editorial roundups + named-salon commentary extensively. */}
        {businesses.length >= 3 && (
          <section className="mt-14 card p-8">
            <p className="text-editorial-overline mb-3">Notes from the field</p>
            <h2 className="text-xl text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
              Who we&rsquo;d send a friend to in {city.name}
            </h2>
            <p className="mt-3 text-sm text-[var(--color-ink-light)] leading-relaxed">
              Picks from the top of {city.name}&rsquo;s {businesses.length}-strong hand-verified list of {content.h1Prefix.toLowerCase()}. Listings are ranked by Google rating and review depth, never paid placement.
            </p>
            <div className="mt-6 space-y-5">
              {businesses.slice(0, 5).map((b) => {
                const rating = typeof b.google_rating === 'number' ? b.google_rating.toFixed(1) : null;
                const reviews = typeof b.google_review_count === 'number' ? b.google_review_count : null;
                const type = b.business_type === 'barber' ? 'barber shop' : b.business_type === 'unisex' ? 'unisex salon' : 'hair salon';
                const specialties = (b.specialties ?? []) as string[];
                const interestingSpecs = specialties.filter((s) => NOTABLE_SPECS.has(s));
                const specBlurb = interestingSpecs.length > 0
                  ? interestingSpecs.slice(0, 3).map((s) => s.replace(/-/g, ' ')).join(', ')
                  : null;
                const editorialText = b.ai_description
                  ? firstSentence(b.ai_description, 240)
                  : `${b.name} is a verified ${type} in ${titleCase(b.suburb)}, ${fullState}. Listing includes hours, booking link and verified reviews.`;
                return (
                  <article key={b.id} className="border-l-2 border-[var(--color-gold)] pl-5">
                    <h3 className="text-base text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                      <Link href={`/salon/${b.slug}`} className="hover:text-[var(--color-gold-dark)]">
                        {b.name}
                      </Link>
                      <span className="text-sm font-normal text-[var(--color-ink-muted)]">
                        {' '}— {titleCase(b.suburb)}
                      </span>
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {type}
                      {rating && reviews ? ` · ${rating}★ across ${reviews.toLocaleString()} reviews` : ''}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-ink-light)] leading-relaxed">
                      {editorialText}
                      {specBlurb && (
                        <span className="text-[var(--color-ink-muted)]"> Strong on {specBlurb}.</span>
                      )}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Guide content */}
        <section className="mt-14 card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {interp(content.guideTitle, vars)}
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--color-ink-light)]">
            <p>{interp(content.guideIntro, vars)}</p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">What to look for</h3>
            <ul className="list-disc pl-5 space-y-1">
              {content.whatToLook.map((b, i) => (
                <li key={i}>{interp(b, vars)}</li>
              ))}
            </ul>
            {content.scissorPlug && (
              <p className="pt-2">
                {interp(content.scissorPlug.text, vars)}{' '}
                <a href={content.scissorPlug.linkHref} target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                  {content.scissorPlug.linkText}
                </a>.
              </p>
            )}
          </div>
        </section>

        {/* Suburbs covered */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Suburbs covered in {city.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {city.suburbs.map((s) => {
              const hub = suburbHubUrls[s.toLowerCase().trim()];
              return (
                <Link
                  key={s}
                  href={hub ?? `/search?q=${encodeURIComponent(s)}&state=${city.state}`}
                  className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
                >
                  {titleCase(s)}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Cross-links to sister templates */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Related guides for {city.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href={`/best-hairdresser/${city.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
              Best hairdressers in {city.name}
            </Link>
            <span className="text-[var(--color-border)]">·</span>
            <Link href={`/best-barber/${city.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
              Best barbers in {city.name}
            </Link>
            <span className="text-[var(--color-border)]">·</span>
            <Link href={`/mobile-hairdresser/${city.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
              Mobile hairdressers in {city.name}
            </Link>
          </div>
        </section>

        {/* Cross-city tags */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {content.h1Prefix} in other cities
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {allCities.filter((c) => c.slug !== city.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/${content.routePrefix}/${c.slug}`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-3 h-3 text-[var(--color-border)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
