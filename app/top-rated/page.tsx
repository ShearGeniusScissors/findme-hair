import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { supabaseServerInternal } from '@/lib/supabase';

const YEAR = 2026;

export const metadata: Metadata = {
  title: `findme.hair Top Rated ${YEAR} — How the Badge Works`,
  description:
    `The findme.hair Top Rated ${YEAR} badge recognises the top 10% of Australian hair salons and barbers by Bayesian-weighted Google rating. See how it's calculated and why it can't be bought.`,
  alternates: { canonical: 'https://www.findme.hair/top-rated', languages: { 'en-AU': 'https://www.findme.hair/top-rated', 'x-default': 'https://www.findme.hair/top-rated' } },
  openGraph: {
    title: `findme.hair Top Rated ${YEAR}`,
    description: `How the Top Rated badge works — the top 10% of Australian salons and barbers by weighted Google rating.`,
    url: 'https://www.findme.hair/top-rated',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'website',
  },
};

export const revalidate = 86400; // award facts change at most yearly; counts drift slowly

export default async function TopRatedPage() {
  const supabase = supabaseServerInternal();

  const { count: winnerCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('top_rated_year', YEAR);

  const { count: activeCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const winners = winnerCount ?? 0;
  const active = activeCount ?? 0;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: `Top Rated ${YEAR}` },
        ],
      }} />

      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium">Top Rated {YEAR}</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1
          className="text-3xl text-[var(--color-ink)] sm:text-4xl leading-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          findme.hair Top Rated {YEAR}
        </h1>
        <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
          One badge. The top 10% of Australian hair salons and barbers, decided by
          their own customers&rsquo; Google reviews — not by us, and never by payment.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--color-ink-light)]">
          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              What the badge means
            </h2>
            <p>
              {winners > 0 && active > 0 ? (
                <>Of the {active.toLocaleString()} verified hair salons and barbers listed on
                findme.hair, {winners.toLocaleString()} earned the Top Rated {YEAR} badge —
                the top 10% nationally.</>
              ) : (
                <>The Top Rated {YEAR} badge marks the top 10% of verified hair salons and
                barbers listed on findme.hair nationally.</>
              )}{' '}
              Every {YEAR} badge holder maintains at least a 4.9-star average on Google
              from a meaningful number of reviews.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              How it&rsquo;s calculated
            </h2>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>
                <strong>Bayesian-weighted Google rating.</strong> A raw star average can be
                gamed with a handful of reviews, so each salon&rsquo;s rating is weighted
                toward the national average until its review volume proves it. A 4.9 from
                hundreds of reviews outranks a 5.0 from three.
              </li>
              <li>
                <strong>Top 10% nationally.</strong> Salons are ranked on that weighted score
                across every active listing in Australia. The top 10% earn the badge.
              </li>
              <li>
                <strong>Minimum review volume.</strong> Listings with only a few reviews
                can&rsquo;t qualify, no matter how high the average.
              </li>
              <li>
                <strong>Year-stamped and recalculated.</strong> The badge carries its award
                year and is recalculated for each new year — it&rsquo;s earned, not kept.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              What it&rsquo;s not
            </h2>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong>It can&rsquo;t be bought.</strong> There is no fee, sponsorship, or upgrade that grants or influences the badge.</li>
              <li><strong>It can&rsquo;t be applied for.</strong> Salons don&rsquo;t nominate themselves — the data decides.</li>
              <li><strong>It isn&rsquo;t our opinion.</strong> The inputs are public Google ratings left by real customers; we just do the maths the same way for everyone.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              Earned the badge? Put it on your website
            </h2>
            <p>
              Badge holders can display the Top Rated {YEAR} badge on their own website.
              Claim your free listing, open your dashboard, and copy the ready-made embed
              code — the badge links back to your findme.hair profile so customers can
              verify it&rsquo;s genuine.
            </p>
            <div className="mt-4">
              <Link href="/claim" className="btn-gold text-xs !py-2 !px-5">
                Claim my free listing
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              Find a Top Rated salon near you
            </h2>
            <p>
              Top Rated salons show a gold <span className="font-medium text-[var(--color-ink)]">Top Rated {YEAR}</span> chip
              on their profile, and suburb pages surface a &ldquo;Top rated&rdquo; rail where
              enough rated salons exist.
            </p>
            <div className="mt-4">
              <Link href="/search" className="btn-gold text-xs !py-2 !px-5">
                Search salons near you
              </Link>
            </div>
          </section>
        </div>
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
