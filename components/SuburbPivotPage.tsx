import Link from "next/link";
import BusinessCard from "@/components/BusinessCard";
import JsonLd from "@/components/JsonLd";
import { stateName } from "@/lib/geo";
import type { Business } from "@/types/database";
import type { SuburbConfig } from "@/lib/suburbConfig";

export interface SuburbPivotContent {
  // SEO + UI strings
  h1Prefix: string; // "Hairdressers", "Barbers"
  routePrefix: string; // "hairdresser" | "barber"
  metaDescribeShort: string;
  hero: string; // 1-2 sentence intro under H1, with {suburb}/{state} placeholders
  guideTitle: string;
  guideIntro: string;
  whatToLook: string[];
  faq: Array<{ q: string; a: string }>;
  scissorPlug?: { text: string; linkText: string; linkHref: string };
}

interface Props {
  suburb: SuburbConfig;
  businesses: Business[];
  content: SuburbPivotContent;
  siblingSuburbs: SuburbConfig[]; // up to ~10 same-region siblings
  allSuburbs: SuburbConfig[]; // for "browse other suburbs" tag block
}

const interp = (s: string, vars: Record<string, string>): string =>
  s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export default function SuburbPivotPage({ suburb, businesses, content, siblingSuburbs, allSuburbs }: Props) {
  const fullState = stateName(suburb.state);
  const year = new Date().getFullYear();
  const hasResults = businesses.length >= 3;
  const vars = { suburb: suburb.name, state: fullState, region: suburb.regionName };
  const h1 = `${content.h1Prefix} in ${suburb.name} (${year})`;
  const path = `https://www.findme.hair/${content.routePrefix}/${suburb.slug}`;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: fullState, item: `https://www.findme.hair/${suburb.state.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: suburb.regionName, item: `https://www.findme.hair/${suburb.state.toLowerCase()}/${suburb.regionSlug}` },
          { '@type': 'ListItem', position: 4, name: `${content.h1Prefix} in ${suburb.name}`, item: path },
        ],
      }} />
      {businesses.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${content.h1Prefix} in ${suburb.name}`,
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

      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <ChevronIcon />
            <Link href={`/${suburb.state.toLowerCase()}`} className="hover:text-[var(--color-gold-dark)]">
              {fullState}
            </Link>
            <ChevronIcon />
            <Link href={`/${suburb.state.toLowerCase()}/${suburb.regionSlug}`} className="hover:text-[var(--color-gold-dark)]">
              {suburb.regionName}
            </Link>
            <ChevronIcon />
            <span className="text-[var(--color-ink)] font-medium">{content.h1Prefix} in {suburb.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-editorial-overline">{suburb.name} &middot; {suburb.regionName} &middot; {fullState}</p>
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
              We&rsquo;re still verifying {content.h1Prefix.toLowerCase()} in {suburb.name}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              Browse all {suburb.regionName} listings to find one nearby.
            </p>
            <Link
              href={`/${suburb.state.toLowerCase()}/${suburb.regionSlug}`}
              className="mt-6 inline-block btn-gold"
            >
              See all {suburb.regionName}
            </Link>
          </div>
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

        {/* Sibling suburbs in same region */}
        {siblingSuburbs.length > 0 && (
          <section className="mt-8 card p-8">
            <h2
              className="text-lg text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Nearby suburbs in {suburb.regionName}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {siblingSuburbs.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${content.routePrefix}/${s.slug}`}
                  className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cross-links */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Related guides for {suburb.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href={`/${content.routePrefix === 'hairdresser' ? 'barber' : 'hairdresser'}/${suburb.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
              {content.routePrefix === 'hairdresser' ? 'Barbers' : 'Hairdressers'} in {suburb.name}
            </Link>
            <span className="text-[var(--color-border)]">·</span>
            <Link href={`/${suburb.state.toLowerCase()}/${suburb.regionSlug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
              All {suburb.regionName}
            </Link>
            <span className="text-[var(--color-border)]">·</span>
            <Link href={`/${suburb.state.toLowerCase()}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
              All {fullState}
            </Link>
          </div>
        </section>

        {/* Browse other top suburbs */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {content.h1Prefix} in other top suburbs
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {allSuburbs.filter((s) => s.slug !== suburb.slug).slice(0, 30).map((s) => (
              <Link
                key={s.slug}
                href={`/${content.routePrefix}/${s.slug}`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                {s.name}
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
