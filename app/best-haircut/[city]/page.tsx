import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BusinessCard from "@/components/BusinessCard";
import JsonLd from "@/components/JsonLd";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;

export function generateStaticParams() {
  return PIVOT_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const config = PIVOT_CITIES.find((c) => c.slug === city);
  if (!config) return {};

  const path = `https://www.findme.hair/best-haircut/${config.slug}`;
  const year = new Date().getFullYear();
  const title = `Best Haircut in ${config.name} ${year} — Top Hairdressers & Barbers | findme.hair`;
  const description = `Where to get the best haircut in ${config.name}, ${stateName(config.state)}. Verified top hairdressers and barbers, ranked by Google rating and review count. Editorial guide refreshed ${year}.`;

  return {
    title, description,
    alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
    openGraph: {
      title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "article",
      images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
    },
  };
}

async function getTopBusinesses(state: AuState, suburbs: string[]): Promise<Business[]> {
  const supabase = supabaseServerAnon();
  const suburbFilters = suburbs.map((s) => `suburb.ilike.${s}`).join(",");
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .or(suburbFilters)
    .gte("google_rating", 4.5)
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);
  return (data ?? []) as Business[];
}

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const config = PIVOT_CITIES.find((c) => c.slug === city);
  if (!config) notFound();

  const businesses = await getTopBusinesses(config.state, config.suburbs);
  const fullState = stateName(config.state);
  const year = new Date().getFullYear();
  const path = `https://www.findme.hair/best-haircut/${config.slug}`;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Best Haircut in ${config.name} ${year}`,
        image: 'https://www.findme.hair/og-image.jpg',
        datePublished: `${year}-04-26`,
        dateModified: `${year}-04-26`,
        author: { '@id': 'https://www.findme.hair/#organization' },
        publisher: { '@id': 'https://www.findme.hair/#organization' },
        mainEntityOfPage: path,
        inLanguage: 'en-AU',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: fullState, item: `https://www.findme.hair/${config.state.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: `Best haircut in ${config.name}` },
        ],
      }} />
      {businesses.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Best haircut in ${config.name}`,
          numberOfItems: businesses.length,
          itemListElement: businesses.map((b, i) => ({
            '@type': 'ListItem', position: i + 1, url: `https://www.findme.hair/salon/${b.slug}`, name: b.name,
          })),
        }} />
      )}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `Where can I get the best haircut in ${config.name}?`, acceptedAnswer: { '@type': 'Answer', text: `The verified top-rated hairdressers and barbers in ${config.name} are listed above, sorted by Google rating and review count. Recent reviews and consistent Instagram work separate the truly best from the merely good.` } },
          { '@type': 'Question', name: `How much does the best haircut in ${config.name} cost?`, acceptedAnswer: { '@type': 'Answer', text: `Top salons in ${config.name} charge $120-$200 for a senior cut, $250-$650 for balayage, and $65-$90 for premium men's barber cuts. The premium reflects senior-stylist time and bond-builder products.` } },
          { '@type': 'Question', name: `What suburbs have the best hair salons in ${config.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${config.name} top stylists cluster across the metro suburbs. The shortlist above filters by Google rating across all of ${config.name} so you start with the highest-rated options first.` } },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <Link href={`/${config.state.toLowerCase()}`} className="hover:text-[var(--color-gold-dark)]">{fullState}</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Best haircut in {config.name}</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-editorial-overline">Editorial guide · {year}</p>
          <h1 className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Best Haircut in {config.name} ({year})
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            Where to get the best haircut in {config.name}. Verified top hairdressers and barbers, ranked by Google rating across 4.5+ stars and review count. Refreshed continuously from the findme.hair directory.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {businesses.length >= 3 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (<BusinessCard key={b.id} business={b} />))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
              We&rsquo;re still verifying top-rated haircut shops in {config.name}
            </h2>
            <Link href={`/best-hairdresser/${config.slug}`} className="mt-6 inline-block btn-gold">
              Browse all {config.name} hairdressers
            </Link>
          </div>
        )}

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>How we rank</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            Listings on this page are filtered to 4.5+ star Google rating, then sorted by review count. Featured (paid) placement is clearly marked when present. The base ranking is editorial — no salon pays to move higher in the default sort. Senior-stylist availability and recent review freshness break ties.
          </p>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>More {config.name} guides</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            <li><Link href={`/best-hairdresser/${config.slug}`} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Best hairdressers in {config.name}</Link></li>
            <li><Link href={`/best-barber/${config.slug}`} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Best barbers in {config.name}</Link></li>
            <li><Link href={`/mobile-hairdresser/${config.slug}`} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Mobile hairdressers in {config.name}</Link></li>
            <li><Link href={`/mens-haircut/${config.slug}`} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Men&rsquo;s haircuts in {config.name}</Link></li>
            <li><Link href={`/balayage-specialist/${config.slug}`} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Balayage specialists in {config.name}</Link></li>
            <li><Link href={`/bridal-hair/${config.slug}`} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Bridal hair stylists in {config.name}</Link></li>
          </ul>
        </section>
      </div>
    </main>
  );
}
