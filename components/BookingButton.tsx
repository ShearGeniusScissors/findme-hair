import type { Business } from '@/types/database';

const PLATFORM_LABEL: Record<Business['booking_platform'], string> = {
  fresha: 'Book on Fresha',
  kitomba: 'Book on Kitomba',
  shortcuts: 'Book on Shortcuts',
  timely: 'Book on Timely',
  other: 'Book online',
  none: 'Book online',
};

export default function BookingButton({ business }: { business: Business }) {
  if (!business.booking_url) {
    if (business.phone) {
      return (
        <a
          href={`tel:${business.phone}`}
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
        >
          Call {business.phone}
        </a>
      );
    }
    return null;
  }

  return (
    <a
      href={business.booking_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
    >
      {PLATFORM_LABEL[business.booking_platform]}
    </a>
  );
}
