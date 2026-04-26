import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { TOP_SUBURBS } from "@/lib/suburbConfig";

export interface NearMeContent {
  // SEO
  routePath: string; // "/barber-near-me"
  pageTitle: string;
  metaDescription: string;
  h1: string;
  hero: string;
  // Cross-link targets
  cityRoute: string; // "/best-barber" (so cities link to /best-barber/melbourne)
  suburbRoute: string; // "/barber" (so suburbs link to /barber/south-yarra)
  // Content
  guideTitle: string;
  guideIntro: string;
  whatToDo: string[];
  faq: Array<{ q: string; a: string }>;
  scissorPlug?: { text: string; linkText: string; linkHref: string };
}

export default function NearMePage({ content }: { content: NearMeContent }) {
  const path = `https://www.findme.hair${content.routePath}`;
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: content.pageTitle,
        url: path,
        description: content.metaDescription,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `https://www.findme.hair/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: content.h1, item: path },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }} />

      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <ChevronIcon />
            <span className="text-[var(--color-ink)] font-medium">{content.h1}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-editorial-overline">Australia &middot; {year}</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {content.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            {content.hero}
          </p>
          <form action="/search" method="get" className="mt-6 flex gap-2 max-w-xl">
            <input
              type="text"
              name="q"
              placeholder="Enter your suburb"
              className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--color-gold)]"
            />
            <button type="submit" className="btn-gold whitespace-nowrap">Find Now</button>
          </form>
        </div>
      </div>

      {/* Top cities grid */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            By city
          </h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PIVOT_CITIES.map((c) => (
              <Link
                key={c.slug}
                href={`${content.cityRoute}/${c.slug}`}
                className="card p-4 hover:border-[var(--color-gold)] hover:shadow-md transition-all"
              >
                <p className="text-base font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {c.name}
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">{c.state}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Top suburbs grid */}
        <section className="mt-8 card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Top suburbs
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {TOP_SUBURBS.slice(0, 60).map((s) => (
              <Link
                key={s.slug}
                href={`${content.suburbRoute}/${s.slug}`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Guide content */}
        <section className="mt-14 card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {content.guideTitle}
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--color-ink-light)]">
            <p>{content.guideIntro}</p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">What to do</h3>
            <ul className="list-disc pl-5 space-y-1">
              {content.whatToDo.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            {content.scissorPlug && (
              <p className="pt-2">
                {content.scissorPlug.text}{' '}
                <a href={content.scissorPlug.linkHref} target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                  {content.scissorPlug.linkText}
                </a>.
              </p>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-8 card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-5">
            {content.faq.map((f, i) => (
              <div key={i}>
                <h3 className="text-base font-semibold text-[var(--color-ink)]">{f.q}</h3>
                <p className="mt-1 text-sm text-[var(--color-ink-light)] leading-relaxed">{f.a}</p>
              </div>
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
