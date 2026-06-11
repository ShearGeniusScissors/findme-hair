import Link from 'next/link';

// Claim copy locked per FINDME-HAIR-PLAYBOOK-2026-06-11 Part 4:
// self-selecting question ("Own or work at…?"), first-person button
// ("Claim my free listing" — +90% CTR vs second-person, ContentVerve),
// benefit triplet + reassurance bullets. No urgency, no "before someone else".
export default function ClaimBanner({
  slug,
  name,
  topRatedYear,
}: {
  slug: string;
  name?: string;
  /** When set, the salon earned the Top Rated badge — lead the claim pitch with it. */
  topRatedYear?: number | null;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-gold)] bg-[var(--color-gold-light)] p-6">
      <p className="font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
        {name ? `Own or work at ${name}?` : 'Own or work at this salon?'}
      </p>
      <p className="mt-2 text-sm text-[var(--color-ink-light)] leading-relaxed">
        {topRatedYear != null
          ? `This salon earned the findme.hair Top Rated ${topRatedYear} badge — top 10% of Australian salons by Google rating. Claim this free listing to get the badge for your own website, update your details and add photos.`
          : 'Claim this free listing to update your details, add photos and see how many people viewed your page.'}
      </p>
      <Link
        href={`/claim?slug=${slug}`}
        className="btn-gold mt-4 text-xs !py-2 !px-5"
      >
        Claim my free listing
      </Link>
      <ul className="mt-4 space-y-1 text-xs text-[var(--color-ink-muted)]">
        <li>✓ Free forever</li>
        <li>✓ Takes 2 minutes</li>
        <li>✓ You control what customers see</li>
      </ul>
    </div>
  );
}
