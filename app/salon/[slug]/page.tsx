import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingButton from '@/components/BookingButton';
import ClaimBanner from '@/components/ClaimBanner';
import MapView from '@/components/MapView';
import { getBusinessBySlug } from '@/lib/search';
import { stateName } from '@/lib/geo';

export const dynamic = 'force-dynamic';

const TYPE_LABEL = {
  hair_salon: 'Hair salon',
  barber: 'Barber shop',
  unisex: 'Unisex hair salon',
} as const;

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <Link
            href="/"
            className="text-sm font-semibold text-rose-600 hover:text-rose-500"
          >
            ← findme.hair
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
              {TYPE_LABEL[business.business_type]}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-neutral-900 sm:text-4xl">
              {business.name}
            </h1>
            <p className="mt-2 text-neutral-600">
              {business.address_line1}, {business.suburb} {business.postcode},{' '}
              {stateName(business.state)}
            </p>
            {business.google_rating != null && (
              <p className="mt-2 text-sm text-neutral-700">
                ★ {business.google_rating.toFixed(1)}
                {business.google_review_count != null &&
                  ` · ${business.google_review_count} Google reviews`}
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

        {business.description && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              About
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-neutral-800">
              {business.description}
            </p>
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
              <DetailRow label="Suburb">{business.suburb}, {business.state}</DetailRow>
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
          <p className="mt-3 text-sm text-neutral-500">
            Hours not yet provided. {business.is_claimed ? 'The owner can add them from the dashboard.' : 'Claim this listing to add hours.'}
          </p>
          <p className="mt-1 text-xs text-neutral-400">Days: {DAYS.join(' · ')}</p>
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
