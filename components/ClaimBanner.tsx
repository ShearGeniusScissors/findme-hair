import Link from 'next/link';

export default function ClaimBanner({ slug }: { slug: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-gold)] bg-[var(--color-gold-light)] p-6">
      <p className="font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
        Is this your salon?
      </p>
      <p className="mt-2 text-sm text-[var(--color-ink-light)] leading-relaxed">
        Claim your free listing to add photos, update opening hours, and connect your booking system.
      </p>
      <Link
        href={`/claim?slug=${slug}`}
        className="btn-gold mt-4 text-xs !py-2 !px-5"
      >
        Claim this listing
      </Link>
    </div>
  );
}
