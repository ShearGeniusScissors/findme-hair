import Link from 'next/link';

export default function ClaimBanner({ slug }: { slug: string }) {
  return (
    <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-5 text-sm">
      <p className="font-semibold text-rose-900">Is this your salon?</p>
      <p className="mt-1 text-rose-800">
        Claim your listing to add photos, update hours, and connect your booking system.
      </p>
      <Link
        href={`/claim?slug=${slug}`}
        className="mt-3 inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
      >
        Claim this listing
      </Link>
    </div>
  );
}
