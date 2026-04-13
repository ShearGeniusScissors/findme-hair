import Link from 'next/link';
import type { Business } from '@/types/database';
import StarRating from './StarRating';

const TYPE_LABEL: Record<Business['business_type'], string> = {
  hair_salon: 'Hair Salon',
  barber: 'Barber',
  unisex: 'Unisex',
};

const SPECIALTY_DISPLAY: Record<string, string> = {
  'colour-specialist': 'Colour Specialist',
  'curly-hair': 'Curly Hair',
  'balayage': 'Balayage',
  'extensions': 'Extensions',
  'bridal': 'Bridal Hair',
  'kids': 'Kids',
  'mens': 'Mens Cuts',
  'mobile': 'Mobile',
  'japanese': 'Japanese',
  'korean': 'Korean',
  'keratin': 'Keratin',
  'highlights': 'Highlights',
  'organic': 'Organic',
  'barber': 'Barber',
  'blow-dry': 'Blow Dry',
  'afro': 'Textured Hair',
  'colour-correction': 'Colour Correction',
  'wigs': 'Wigs',
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

  const isFeatured = business.featured_until && new Date(business.featured_until) > new Date();
  const specialties = (business.specialties ?? []).slice(0, 4);

  return (
    <Link
      href={`/salon/${business.slug}`}
      className={`card group block overflow-hidden ${isFeatured ? 'ring-2 ring-[var(--color-gold)] shadow-md' : ''}`}
    >
      {/* Photo — 16:9 aspect */}
      <div className="relative aspect-video bg-[var(--color-surface-warm)] overflow-hidden">
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

        {/* Type badge overlay — top left */}
        <span className="absolute top-3 left-3 badge badge-type backdrop-blur-sm bg-white/90">
          {TYPE_LABEL[business.business_type]}
        </span>
        {isFeatured && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-gold)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured
          </span>
        )}
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

        {/* Specialty tags */}
        {specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specialties.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-[var(--color-gold-light)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-gold-dark)]"
              >
                {SPECIALTY_DISPLAY[tag] ?? tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
