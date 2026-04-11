import Link from 'next/link';
import type { Business } from '@/types/database';

const TYPE_LABEL: Record<Business['business_type'], string> = {
  hair_salon: 'Hair salon',
  barber: 'Barber',
  unisex: 'Unisex salon',
};

export default function BusinessCard({ business }: { business: Business }) {
  return (
    <Link
      href={`/salon/${business.slug}`}
      className="group block rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-rose-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rose-600">
            {TYPE_LABEL[business.business_type]}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-neutral-900 group-hover:text-rose-600">
            {business.name}
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            {business.suburb}, {business.state} {business.postcode}
          </p>
        </div>
        {business.google_rating != null && (
          <div className="rounded-lg bg-neutral-50 px-2 py-1 text-right">
            <p className="text-sm font-semibold text-neutral-900">
              ★ {business.google_rating.toFixed(1)}
            </p>
            {business.google_review_count != null && (
              <p className="text-[11px] text-neutral-500">
                {business.google_review_count} reviews
              </p>
            )}
          </div>
        )}
      </div>

      {business.description && (
        <p className="mt-3 line-clamp-2 text-sm text-neutral-600">{business.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        {business.is_claimed && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            Claimed
          </span>
        )}
        {business.booking_url && (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
            Book online
          </span>
        )}
      </div>
    </Link>
  );
}
