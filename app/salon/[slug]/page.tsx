import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingButton from '@/components/BookingButton';
import ClaimBanner from '@/components/ClaimBanner';
import MapView from '@/components/MapView';
import StarRating from '@/components/StarRating';
import OpenStatus from '@/components/OpenStatus';
import { getBusinessBySlug } from '@/lib/search';
import { stateName, slugify } from '@/lib/geo';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const TYPE_LABEL = {
  hair_salon: 'Hair Salon',
  barber: 'Barber Shop',
  unisex: 'Unisex Salon',
} as const;

function PhotoUrl(photoName: string, maxHeight = 600) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeight}&key=${key}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return { title: 'Salon not found' };
  return {
    title: `${business.name} — ${TYPE_LABEL[business.business_type]} in ${business.suburb} | findme.hair`,
    description: `${business.name} is a ${TYPE_LABEL[business.business_type].toLowerCase()} in ${business.suburb}, ${stateName(business.state)}. ${business.google_rating ? `Rated ${business.google_rating}/5` : ''} — find hours, photos, and booking info.`,
  };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const suburbSlug = slugify(business.suburb);
  const verified = (business.confidence_score ?? 0) >= 75;
  const photos = business.google_photos ?? [];

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      {/* ─── Breadcrumb ───────────────────────────────── */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <Link href={`/${business.state.toLowerCase()}`} className="hover:text-[var(--color-gold-dark)]">
              {stateName(business.state)}
            </Link>
            <Chevron />
            <Link
              href={`/search?suburb=${encodeURIComponent(business.suburb)}&state=${business.state}`}
              className="hover:text-[var(--color-gold-dark)]"
            >
              {business.suburb}
            </Link>
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium truncate">{business.name}</span>
          </nav>
        </div>
      </div>

      {/* ─── Photo gallery ────────────────────────────── */}
      {photos.length > 0 && (
        <div className="bg-[var(--color-white)]">
          <div className="mx-auto max-w-6xl px-6 py-4">
            {photos.length === 1 ? (
              <div className="overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PhotoUrl(photos[0].name, 800)!}
                  alt={business.name}
                  className="w-full h-72 sm:h-96 object-cover"
                />
              </div>
            ) : (
              <div className="grid gap-2 rounded-xl overflow-hidden" style={{
                gridTemplateColumns: photos.length >= 3 ? '2fr 1fr' : '1fr 1fr',
                gridTemplateRows: photos.length >= 3 ? '1fr 1fr' : '1fr',
                height: '24rem',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PhotoUrl(photos[0].name, 800)!}
                  alt={`${business.name} photo 1`}
                  className="w-full h-full object-cover"
                  style={photos.length >= 3 ? { gridRow: '1 / -1' } : undefined}
                />
                {photos.slice(1, photos.length >= 3 ? 3 : 2).map((p, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.name + idx}
                    src={PhotoUrl(p.name, 400)!}
                    alt={`${business.name} photo ${idx + 2}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Main content ─────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div>
            {/* Header */}
            <div className="flex flex-wrap items-start gap-3">
              <span className="badge badge-type">{TYPE_LABEL[business.business_type]}</span>
              {verified && <span className="badge badge-verified">Verified</span>}
              {business.is_claimed && <span className="badge badge-gold">Claimed</span>}
            </div>

            <h1
              className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {business.name}
            </h1>

            <p className="mt-2 text-[var(--color-ink-light)]">
              {business.address_line1}, {business.suburb} {business.postcode}, {stateName(business.state)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              {business.google_rating != null && (
                <StarRating
                  rating={business.google_rating}
                  reviewCount={business.google_review_count}
                  size="md"
                />
              )}
              <OpenStatus hours={business.google_hours} />
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <BookingButton business={business} />
              {business.website_url && (
                <a
                  href={business.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-sm gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Website
                </a>
              )}
              {business.google_place_id && (
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-sm gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Google Maps
                </a>
              )}
            </div>

            {/* Divider */}
            <div className="my-10 h-px bg-[var(--color-border)]" />

            {/* Description */}
            {business.description && (
              <section>
                <h2
                  className="text-xl text-[var(--color-ink)]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  About {business.name}
                </h2>
                <p className="mt-4 text-[var(--color-ink-light)] leading-relaxed whitespace-pre-wrap">
                  {business.description}
                </p>
              </section>
            )}

            {/* Opening hours */}
            <section className={business.description ? 'mt-10' : ''}>
              <h2
                className="text-xl text-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Opening hours
              </h2>
              {business.google_hours?.weekdayDescriptions &&
              business.google_hours.weekdayDescriptions.length > 0 ? (
                <div className="mt-4 card p-0 divide-y divide-[var(--color-border-light)]">
                  {business.google_hours.weekdayDescriptions.map((line) => {
                    const parts = line.split(/:\s(.+)/);
                    const day = parts[0] || line;
                    const times = parts[1] || '';
                    return (
                      <div key={line} className="flex items-center justify-between px-5 py-3 text-sm">
                        <span className="font-medium text-[var(--color-ink)]">{day}</span>
                        <span className="text-[var(--color-ink-light)]">{times || 'Closed'}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
                  Hours not yet available.{' '}
                  {business.is_claimed
                    ? 'The owner can add them from the dashboard.'
                    : 'Claim this listing to add hours.'}
                </p>
              )}
            </section>

            {/* Reviews link */}
            {business.google_rating != null && business.google_review_count != null && (
              <section className="mt-10">
                <h2
                  className="text-xl text-[var(--color-ink)]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Reviews
                </h2>
                <div className="mt-4 card p-6 flex items-center justify-between">
                  <div>
                    <StarRating rating={business.google_rating} reviewCount={business.google_review_count} size="md" />
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      Based on {business.google_review_count} Google reviews
                    </p>
                  </div>
                  {business.google_place_id && (
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                    >
                      Read all reviews &rarr;
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right column */}
          <aside className="space-y-6">
            {/* Details card */}
            <div className="card p-6 space-y-4">
              <h3
                className="text-lg text-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Details
              </h3>
              <div className="space-y-3">
                <DetailRow label="Address">
                  {business.address_line1}, {business.suburb} {business.postcode}
                </DetailRow>
                {business.phone && (
                  <DetailRow label="Phone">
                    <a href={`tel:${business.phone}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                      {business.phone}
                    </a>
                  </DetailRow>
                )}
                <DetailRow label="Type">{TYPE_LABEL[business.business_type]}</DetailRow>
                {business.booking_platform !== 'none' && business.booking_platform && (
                  <DetailRow label="Booking">
                    <span className="capitalize">{business.booking_platform}</span>
                  </DetailRow>
                )}
                {business.confidence_score != null && (
                  <DetailRow label="Confidence">
                    {business.confidence_score}/100
                  </DetailRow>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="card p-0 overflow-hidden">
              <MapView businesses={[business]} height={280} />
            </div>

            {/* Claim banner */}
            {!business.is_claimed && <ClaimBanner slug={business.slug} />}
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-components ────────────────────────────────────── */

function Chevron() {
  return (
    <svg className="w-3 h-3 text-[var(--color-border)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-[var(--color-ink-muted)] flex-shrink-0">{label}</span>
      <span className="text-right font-medium text-[var(--color-ink)]">{children}</span>
    </div>
  );
}
