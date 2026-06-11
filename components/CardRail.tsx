import Link from 'next/link';
import type { Business } from '@/types/database';
import StarRating from './StarRating';

const TYPE_LABEL: Record<Business['business_type'], string> = {
  hair_salon: 'Hair Salon',
  barber: 'Barber',
  unisex: 'Unisex',
};

/**
 * Horizontal card rail (playbook Part 3 #5 — Domain listing-rails rhythm).
 * Server-rendered, real data only: callers gate on a minimum count and pass
 * pre-filtered/sorted lists. Compact cards so the rail reads as a shortlist
 * above the full grid, not a second grid. Links are plain /salon/[slug]
 * anchors — no new crawlable URLs, SEO freeze respected.
 */
export default function CardRail({
  title,
  businesses,
}: {
  title: string;
  businesses: Business[];
}) {
  if (businesses.length === 0) return null;
  return (
    <section className="mb-8">
      <h2
        className="text-lg text-[var(--color-ink)]"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {title}
      </h2>
      <div className="mt-3 -mx-4 px-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin]">
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/salon/${b.slug}`}
            className="card group block w-60 shrink-0 snap-start p-4 hover:shadow-md transition-shadow"
          >
            <span className="badge badge-type">{TYPE_LABEL[b.business_type]}</span>
            <h3
              className="mt-2 text-sm font-semibold leading-snug text-[var(--color-ink)] line-clamp-2 group-hover:text-[var(--color-gold-dark)] transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {b.name}
            </h3>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {b.suburb}, {b.state}
            </p>
            <div className="mt-2">
              {b.google_rating != null ? (
                <StarRating rating={b.google_rating} reviewCount={b.google_review_count} />
              ) : (
                <span className="text-xs text-[var(--color-ink-muted)]">No reviews yet</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
