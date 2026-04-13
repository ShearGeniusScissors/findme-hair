import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AU_STATES, stateName } from '@/lib/geo';
import { listRegions, searchBusinesses } from '@/lib/search';
import type { AuState } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const code = state.toUpperCase() as AuState;
  const name = stateName(code);
  return {
    title: `Hair Salons & Barbers in ${name} | findme.hair`,
    description: `Browse verified hair salons and barber shops across ${name}. Find opening hours, reviews, and booking info for salons near you.`,
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
  const regions = await listRegions(code);

  // Get top rated businesses for this state
  const featured = await searchBusinesses({ state: code, limit: 6 });

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
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
            Browse {regions.length} {regions.length === 1 ? 'region' : 'regions'} across {name}
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
          {regions.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
              No regions have been added for {name} yet. Check back soon.
            </p>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {regions.map((r) => (
                <Link
                  key={r.id}
                  href={`/search?region=${r.slug}`}
                  className="card flex items-center gap-4 p-5 group"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-warm)] text-xs font-bold text-[var(--color-ink-muted)] group-hover:bg-[var(--color-gold-light)] group-hover:text-[var(--color-gold-dark)] transition-colors">
                    {r.state}
                  </span>
                  <span className="font-medium text-sm text-[var(--color-ink)] group-hover:text-[var(--color-gold-dark)] transition-colors">
                    {r.name}
                  </span>
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

function Chevron() {
  return (
    <svg className="w-3 h-3 text-[var(--color-border)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
