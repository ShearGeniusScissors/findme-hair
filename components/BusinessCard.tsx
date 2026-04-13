import Link from 'next/link';
import type { Business } from '@/types/database';
import StarRating from './StarRating';

const TYPE_LABEL: Record<Business['business_type'], string> = {
  hair_salon: 'Hair Salon',
  barber: 'Barber',
  unisex: 'Unisex',
};

function PhotoUrl(photoName: string) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${key}`;
}

export default function BusinessCard({ business }: { business: Business }) {
  const photo =
    business.google_photos && business.google_photos.length > 0
      ? PhotoUrl(business.google_photos[0].name)
      : null;

  return (
    <Link
      href={`/salon/${business.slug}`}
      className="card group block overflow-hidden"
    >
      {/* Photo */}
      <div className="relative h-44 bg-[var(--color-surface-warm)] overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={business.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="w-10 h-10 text-[var(--color-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}

        {/* Type badge overlay */}
        <span className="absolute top-3 left-3 badge badge-type backdrop-blur-sm bg-white/90">
          {TYPE_LABEL[business.business_type]}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-gold-dark)] transition-colors leading-snug"
            style={{ fontFamily: 'var(--font-sans)' }}>
          {business.name}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {business.suburb}, {business.state} {business.postcode}
        </p>

        {/* Rating */}
        {business.google_rating != null && (
          <div className="mt-2.5">
            <StarRating
              rating={business.google_rating}
              reviewCount={business.google_review_count}
            />
          </div>
        )}

        {/* Badges row */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {business.is_claimed && (
            <span className="badge badge-verified">Claimed</span>
          )}
          {business.booking_url && (
            <span className="badge badge-gold">Book online</span>
          )}
          {(business.confidence_score ?? 0) >= 75 && (
            <span className="badge badge-verified">Verified</span>
          )}
        </div>
      </div>
    </Link>
  );
}
