import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { TOP_SUBURBS } from "@/lib/suburbConfig";

export const revalidate = 86400;

const path = "https://www.findme.hair/best-haircut-australia";
const year = new Date().getFullYear();
const title = `Best Haircut in Australia ${year} | findme.hair`;
const description = `Find the best haircut in Australia. Verified top hairdressers and barbers in every major city — Melbourne, Sydney, Brisbane, Perth, Adelaide and beyond. Ranked by Google rating and review count.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: {
    title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "article",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function BestHaircutAustraliaPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        image: 'https://www.findme.hair/og-image.jpg',
        datePublished: `${year}-04-26`,
        dateModified: `${year}-04-26`,
        author: { '@id': 'https://www.findme.hair/#organization' },
        publisher: { '@id': 'https://www.findme.hair/#organization' },
        mainEntityOfPage: path,
        inLanguage: 'en-AU',
        about: { '@id': 'https://www.findme.hair/#organization' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Best Haircut Australia', item: path },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Where can I get the best haircut in Australia?', acceptedAnswer: { '@type': 'Answer', text: 'The best haircut in Australia depends on what you want. For colour, balayage and longer cuts, book a hairdresser in your nearest capital city. For fades, scissor cuts and beard work, book a barber. findme.hair lists the top-rated hairdressers and barbers in every major city, ranked by Google rating and review count.' } },
          { '@type': 'Question', name: 'How much does the best haircut in Australia cost?', acceptedAnswer: { '@type': 'Answer', text: "A men's cut at a senior barber typically runs $65-$90, a women's cut at a senior stylist $120-$200, and balayage colour $400-$650. Premium 'best of' salons charge a 30-50% premium over standard rates because of senior-stylist time, included bond-builders, and longer service durations." } },
          { '@type': 'Question', name: 'Which Australian city has the best hair scene?', acceptedAnswer: { '@type': 'Answer', text: "Melbourne and Sydney lead Australia's hair scene by depth and density of senior-trained stylists, but Brisbane, Perth and Adelaide all have world-class salons. Regional centres like Geelong, Ballarat, the Sunshine Coast and Hobart are increasingly competitive — many capital-trained stylists now run boutique salons in regional Australia." } },
          { '@type': 'Question', name: 'What is the difference between best haircut and best hair salon?', acceptedAnswer: { '@type': 'Answer', text: '"Best haircut" usually refers to the result and the stylist who delivered it. "Best hair salon" usually refers to the venue and the team. The two often overlap — the best salons employ the best stylists — but a senior stylist at a quiet salon can deliver an equal or better haircut than a junior at a famous salon.' } },
          { '@type': 'Question', name: 'How do I find a top-rated hairdresser near me?', acceptedAnswer: { '@type': 'Answer', text: 'Type your suburb into findme.hair to see verified salons nearby, sorted by Google rating and review count. For city-level browsing, use the listings below — every major Australian city has a dedicated top-rated page.' } },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-4xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Best Haircut Australia</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-editorial-overline">Editorial guide · {year}</p>
          <h1 className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Best Haircut in Australia ({year})
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            Where to get the best haircut in Australia, city by city. Top-rated hairdressers and barbers in every major city, verified against Google reviews and ranked by rating and review count.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-10">

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>How we rank</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            Every salon and barber on findme.hair is hand-verified against Google Business Profile, TrueLocal and Yellow Pages. Within each city, the &ldquo;best&rdquo; ranking is editorial — Google rating multiplied by review count, with verification-flag adjustments. We don&rsquo;t take payments to move salons up the list. Senior-stylist availability and recent review freshness break ties.
          </p>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Best haircut by city</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">Click through to the verified shortlist for any major Australian city.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PIVOT_CITIES.map((c) => (
              <div key={c.slug} className="card p-5">
                <p className="text-base font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {c.name}, {c.state}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li><Link href={`/best-hairdresser/${c.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Best hairdressers in {c.name}</Link></li>
                  <li><Link href={`/best-barber/${c.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Best barbers in {c.name}</Link></li>
                  <li><Link href={`/mobile-hairdresser/${c.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Mobile hairdressers in {c.name}</Link></li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>What to look for in a top haircut</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed mb-3">Five things separate a top haircut from a routine one in Australia:</p>
          <ul className="text-sm text-[var(--color-ink-light)] leading-relaxed list-disc pl-5 space-y-2">
            <li><strong>Senior stylist availability</strong> — for any cut you&rsquo;ll wear for the next two months, a senior stylist&rsquo;s eye matters more than the salon fit-out.</li>
            <li><strong>Consultation step</strong> — top salons spend 5-10 minutes on consultation before lifting scissors. If they&rsquo;re skipping consultation, you&rsquo;re in a quick-cut shop, not a top salon.</li>
            <li><strong>Recent reviews</strong> — top hair shops earn most of their reviews in the last 90 days because they&rsquo;re consistently good. Lifetime ratings hide stylist turnover.</li>
            <li><strong>Bond-builders included</strong> — for any colour service, top salons include Olaplex or equivalent bond-building as standard, not an upsell.</li>
            <li><strong>Photographic evidence</strong> — top stylists post fresh work weekly on Instagram. Active accounts with consistent style signal a working stylist; dormant accounts signal otherwise.</li>
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Best haircut by suburb</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">For high-density suburbs, jump to the dedicated shortlist.</p>
          <div className="flex flex-wrap gap-2">
            {TOP_SUBURBS.slice(0, 50).map((s) => (
              <Link
                key={s.slug}
                href={`/hairdresser/${s.slug}`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)]"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Find the best haircut near you</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            <li><Link href="/hairdresser-near-me" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Hairdresser Near Me</Link></li>
            <li><Link href="/barber-near-me" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Barber Near Me</Link></li>
            <li><Link href="/haircut-near-me" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Haircut Near Me</Link></li>
            <li><Link href="/mobile-hairdresser-near-me" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Mobile Hairdresser Near Me</Link></li>
            <li><Link href="/cheap-haircut-near-me" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Cheap Haircut Near Me</Link></li>
            <li><Link href="/directory" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Full directory index</Link></li>
          </ul>
        </section>

      </div>
    </main>
  );
}
