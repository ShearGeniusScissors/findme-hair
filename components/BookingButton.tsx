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
          className="btn-outline gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
          {business.phone}
        </a>
      );
    }
    return null;
  }

  return (
    <a
      href={business.booking_url}
      target="_blank"
      rel="nofollow noopener noreferrer"
      className="btn-gold gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
      {PLATFORM_LABEL[business.booking_platform]}
    </a>
  );
}
