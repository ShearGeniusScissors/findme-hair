import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingButton from '@/components/BookingButton';
import ClaimBanner from '@/components/ClaimBanner';
import MapView from '@/components/MapView';
import { getBusinessBySlug } from '@/lib/search';
import { stateName, slugify } from '@/lib/geo';

export const dynamic = 'force-dynamic';

const TYPE_LABEL = {
  hair_salon: 'Hair salon',
  barber: 'Barber shop',
  unisex: 'Unisex hair salon',
} as const;

function PhotoUrl(photoName: string) {
  // Places (New) photo reference → authenticated URL via the server-side key.
  // We can't call it from a Server Component without exposing the key, so we
  // render via the Google Places Photo API using the public Maps key.
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=480&key=${key}`;
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

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-rose-600">findme.hair</Link>
            {' / '}
            <Link href={`/search?state=${business.state}`} className="hover:text-rose-600">
              {stateName(business.state)}
            </Link>
            {' / '}
            <Link
              href={`/${business.state.toLowerCase()}/placeholder/${suburbSlug}`}
              className="hover:text-rose-600 capitalize"
            >
              {business.suburb}
            </Link>
            {' / '}
            <span className="text-neutral-800">{business.name}</span>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
              {TYPE_LABEL[business.business_type]}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
                {business.name}
              </h1>
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  ✓ Verified listing
                </span>
              )}
            </div>
            <p className="mt-2 text-neutral-600">
              {business.address_line1}, {business.suburb} {business.postcode}, {stateName(business.state)}
            </p>
            {business.google_rating != null && (
              <p className="mt-2 text-sm text-neutral-700">
                ★ {business.google_rating.toFixed(1)}
                {business.google_review_count != null && (
                  <>
                    {' · '}
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-rose-600"
                    >
                      {business.google_review_count} Google reviews
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3">
            <BookingButton business={business} />
            {business.website_url && (
              <a
                href={business.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
              >
                Visit website →
              </a>
            )}
          </div>
        </div>

        {business.google_photos && business.google_photos.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Photos
            </h2>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {business.google_photos.map((p, idx) => {
                const url = PhotoUrl(p.name);
                if (!url) return null;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.name + idx}
                    src={url}
                    alt={`${business.name} photo ${idx + 1}`}
                    className="h-48 w-auto rounded-xl object-cover"
                    loading="lazy"
                  />
                );
              })}
            </div>
          </section>
        )}

        {business.description && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              About
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-neutral-800">{business.description}</p>
          </section>
        )}

        <section className="mt-10 grid gap-8 md:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Details
            </h2>
            <dl className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
              {business.phone && (
                <DetailRow label="Phone">
                  <a href={`tel:${business.phone}`} className="text-rose-600 hover:underline">
                    {business.phone}
                  </a>
                </DetailRow>
              )}
              <DetailRow label="Suburb">
                {business.suburb}, {business.state}
              </DetailRow>
              {business.booking_platform !== 'none' && (
                <DetailRow label="Booking">
                  <span className="capitalize">{business.booking_platform}</span>
                </DetailRow>
              )}
            </dl>

            {!business.is_claimed && (
              <div className="mt-6">
                <ClaimBanner slug={business.slug} />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Location
            </h2>
            <div className="mt-3">
              <MapView businesses={[business]} height={360} />
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Opening hours
          </h2>
          {business.google_hours?.weekdayDescriptions &&
          business.google_hours.weekdayDescriptions.length > 0 ? (
            <ul className="mt-3 grid max-w-md gap-1 text-sm">
              {business.google_hours.weekdayDescriptions.map((line) => (
                <li key={line} className="flex justify-between border-b border-neutral-100 py-1">
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              Hours not yet provided.{' '}
              {business.is_claimed
                ? 'The owner can add them from the dashboard.'
                : 'Claim this listing to add hours.'}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-900">{children}</dd>
    </div>
  );
}
