import Link from 'next/link';
import type { Business } from '@/types/database';
import StarRating from './StarRating';
import OpenStatus from './OpenStatus';

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

function PhotoUrl(p: { url?: string; name?: string }): string | null {
  // Self-hosted storage URL preferred — zero Google billing at render time
  // (May 2026 cost incident). Fallback: /api/photo proxy so site-audit
  // crawlers see findme.hair URLs (blocked by robots.txt) instead of
  // crawling places.googleapis.com.
  if (p.url) return p.url;
  if (p.name) return `/api/photo?name=${encodeURIComponent(p.name)}&h=400`;
  return null;
}

export default function BusinessCard({ business }: { business: Business }) {
  const photo =
    business.google_photos && business.google_photos.length > 0
      ? PhotoUrl(business.google_photos[0])
      : null;

  const isFeatured = business.featured_until && new Date(business.featured_until) > new Date();
  // Playbook Tactic 8: identical attribute slots, max 2 service tags.
  const specialties = (business.specialties ?? []).slice(0, 2);
  // Teaser may be hard-cut at the 160-char generated-column cap — append an
  // ellipsis when it doesn't end on sentence punctuation.
  const teaser = business.card_teaser
    ? /[.!?]$/.test(business.card_teaser) ? business.card_teaser : `${business.card_teaser}…`
    : null;

  return (
    <div className="relative">
    <Link
      href={`/salon/${business.slug}`}
      className={`card group block overflow-hidden ${isFeatured ? 'ring-2 ring-[var(--color-gold)] shadow-md' : ''}`}
    >
      {/* Photo — 16:9 aspect. Only rendered when a photo exists: 0 of 13,872
          listings have google_photos today (audit 2026-06-11), so an
          always-on placeholder was ~50% dead space on every card. The photo
          code path stays for when photos arrive. */}
      {photo && (
        <div className="relative aspect-video bg-[var(--color-surface-warm)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={business.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

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
      )}

      {/* Content — right padding reserves the tap-to-call corner */}
      <div className={business.phone ? 'p-5 pr-16' : 'p-5'}>
        {/* Type (+ featured) shown inline when there's no photo to overlay */}
        {!photo && (
          <div className="mb-2 flex items-center gap-2">
            <span className="badge badge-type">{TYPE_LABEL[business.business_type]}</span>
            {isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-gold)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Featured
              </span>
            )}
          </div>
        )}
        <h3 className="text-base font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-gold-dark)] transition-colors leading-snug"
            style={{ fontFamily: 'var(--font-sans)' }}>
          {business.name}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {business.suburb}, {business.state} {business.postcode}
        </p>

        {/* Rating — consistent slot, never collapses (Tactic 8): a quiet
            placeholder keeps card scan-rhythm identical when data is missing. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {business.google_rating != null ? (
            <StarRating
              rating={business.google_rating}
              reviewCount={business.google_review_count}
            />
          ) : (
            <span className="text-xs text-[var(--color-ink-muted)]">No reviews yet</span>
          )}
          <OpenStatus hours={business.google_hours ?? null} />
        </div>

        {/* One-line teaser — first sentence of the AI description */}
        {teaser && (
          <p className="mt-2 text-sm text-[var(--color-ink-light)] leading-snug line-clamp-2">
            {teaser}
          </p>
        )}

        {/* Specialty + walk-ins tags */}
        {(specialties.length > 0 || business.walk_ins_welcome) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specialties.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-[var(--color-gold-light)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-ink)]"
              >
                {SPECIALTY_DISPLAY[tag] ?? tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            ))}
            {business.walk_ins_welcome && (
              <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[11px] font-medium text-green-700">
                Walk-ins welcome
              </span>
            )}
          </div>
        )}
      </div>
    </Link>

    {/* Tap-to-call — 48dp target, sibling of the Link (never nested anchors).
        Phone is only present on SSR-rendered cards; the public JSON API
        omits it by audit design, so load-more cards simply skip the button. */}
    {business.phone && (
      <a
        href={`tel:${business.phone}`}
        aria-label={`Call ${business.name}`}
        data-track="call"
        data-track-source="card"
        data-track-business={business.id}
        className="absolute bottom-3 right-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-gold-dark)] shadow-sm hover:bg-[var(--color-gold-light)] transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      </a>
    )}
    </div>
  );
}
