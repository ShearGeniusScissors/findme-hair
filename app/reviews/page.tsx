import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { supabaseServerAnon } from "@/lib/supabase";
import { stateName } from "@/lib/geo";

export const revalidate = 3600;

const path = "https://www.findme.hair/reviews";
const title = `Top-Rated Hair Salons & Barbers in Australia ${new Date().getFullYear()} — Verified Reviews | findme.hair`;
const description = "The top-rated hair salons and barber shops across Australia, ranked by verified Google reviews. The single most-reviewed and highest-rated businesses on findme.hair, refreshed hourly.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: {
    title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "article",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default async function ReviewsPage() {
  const supabase = supabaseServerAnon();

  const { data: topByReviews } = await supabase
    .from('businesses')
    .select('id, name, slug, suburb, state, business_type, google_rating, google_review_count')
    .eq('status', 'active')
    .gte('google_rating', 4.5)
    .gte('google_review_count', 50)
    .order('google_review_count', { ascending: false })
    .limit(30);

  const { data: top5Star } = await supabase
    .from('businesses')
    .select('id, name, slug, suburb, state, business_type, google_rating, google_review_count')
    .eq('status', 'active')
    .gte('google_rating', 5.0)
    .gte('google_review_count', 100)
    .order('google_review_count', { ascending: false })
    .limit(20);

  const TYPE_LABEL: Record<string, string> = {
    hair_salon: 'Hair salon', barber: 'Barber shop', unisex: 'Unisex salon',
  };

  const reviewsList = topByReviews ?? [];
  const fiveStarList = top5Star ?? [];

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        url: path,
        description,
        about: { '@id': 'https://www.findme.hair/#organization' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Reviews', item: path },
        ],
      }} />
      {reviewsList.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Top-rated hair salons and barbers in Australia',
          numberOfItems: reviewsList.length,
          itemListElement: reviewsList.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `https://www.findme.hair/salon/${b.slug}`,
            name: b.name,
          })),
        }} />
      )}

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-4xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Reviews</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-editorial-overline">Verified reviews</p>
          <h1 className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Top-Rated Hair Salons &amp; Barbers in Australia
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            The most-reviewed and highest-rated salons and barber shops on findme.hair. Ranked by verified Google reviews — every listing hand-verified against Google Business Profile, TrueLocal and Yellow Pages. Refreshed hourly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-10">

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Most-reviewed (4.5+ stars, 50+ reviews)</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">Sorted by Google review count. These are the salons and barbers with the longest, most consistent track record.</p>
          <ol className="space-y-4">
            {reviewsList.map((b, i) => (
              <li key={b.id} className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border-light)] pb-3">
                <div className="flex-1">
                  <span className="text-xs text-[var(--color-ink-muted)] mr-2">#{i + 1}</span>
                  <Link href={`/salon/${b.slug}`} className="text-base font-semibold text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]" style={{ fontFamily: 'var(--font-serif)' }}>
                    {b.name}
                  </Link>
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    {TYPE_LABEL[b.business_type]} · {b.suburb}, {stateName(b.state)}
                  </p>
                </div>
                <div className="text-right text-sm text-[var(--color-ink)] whitespace-nowrap">
                  {b.google_rating?.toFixed(1)} ★ &middot; {b.google_review_count?.toLocaleString()}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {fiveStarList.length > 0 && (
          <section className="card p-8">
            <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Perfect 5-star (100+ reviews)</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mb-6">Salons and barbers maintaining a perfect 5.0 star average across 100 or more verified Google reviews.</p>
            <ol className="space-y-4">
              {fiveStarList.map((b, i) => (
                <li key={b.id} className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border-light)] pb-3">
                  <div className="flex-1">
                    <span className="text-xs text-[var(--color-ink-muted)] mr-2">#{i + 1}</span>
                    <Link href={`/salon/${b.slug}`} className="text-base font-semibold text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]" style={{ fontFamily: 'var(--font-serif)' }}>
                      {b.name}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {TYPE_LABEL[b.business_type]} · {b.suburb}, {stateName(b.state)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-[var(--color-ink)] whitespace-nowrap">
                    5.0 ★ &middot; {b.google_review_count?.toLocaleString()}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Methodology</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">All review data comes from Google Business Profile and is refreshed hourly on findme.hair. Listings included require an active findme.hair verification, a 4.5+ star rating, and 50+ verified Google reviews. The 5-star section requires a perfect 5.0 average across 100+ verified reviews. Sorting is by review count (most-reviewed first), not paid placement.</p>
        </section>

      </div>
    </main>
  );
}
