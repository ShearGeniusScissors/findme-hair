import { Suspense } from 'react';
import ClaimForm from './ClaimForm';
import { getBusinessBySlug } from '@/lib/search';

// Screen 1 of the claim funnel (playbook Part 3): confirm the salon — name +
// address server-fetched from the slug so the owner never has to search.
// ClaimForm still falls back to the ?slug= param client-side when the page is
// reached without a server match.
export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  const business = slug ? await getBusinessBySlug(slug) : null;
  const salon = business
    ? {
        slug: business.slug,
        name: business.name,
        address: business.address_line1 ?? null,
        suburb: business.suburb,
        state: business.state,
      }
    : null;
  return (
    <Suspense fallback={<p className="p-10 text-sm text-neutral-500">Loading…</p>}>
      <ClaimForm salon={salon} />
    </Suspense>
  );
}
