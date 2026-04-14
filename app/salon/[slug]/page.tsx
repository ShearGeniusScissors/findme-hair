import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingButton from '@/components/BookingButton';
import ClaimBanner from '@/components/ClaimBanner';
import JsonLd from '@/components/JsonLd';
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

const SPECIALTY_DISPLAY: Record<string, string> = {
  'colour-specialist': 'Colour Specialist',
  'curly-hair': 'Curly Hair',
  'balayage': 'Balayage',
  'extensions': 'Extensions',
  'bridal': 'Bridal Hair',
  'kids': 'Kids',
  'mens': 'Mens Cuts',
  'mobile': 'Mobile',
  'japanese': 'Japanese',
  'korean': 'Korean',
  'keratin': 'Keratin',
  'highlights': 'Highlights',
  'organic': 'Organic',
  'barber': 'Barber',
  'blow-dry': 'Blow Dry',
  'afro': 'Textured Hair',
  'colour-correction': 'Colour Correction',
  'wigs': 'Wigs',
};

const SPECIALTY_SLUG: Record<string, string> = {
  'colour-specialist': 'colour-specialist',
  'curly-hair': 'curly-hair-specialist',
  'balayage': 'balayage-specialist',
  'extensions': 'hair-extensions',
  'bridal': 'bridal-hair',
  'kids': 'kids-hairdresser',
  'mens': 'mens-haircut',
  'mobile': 'mobile-hairdresser',
  'japanese': 'japanese-hairdresser',
  'korean': 'korean-hair-salon',
  'keratin': 'keratin-treatment',
  'highlights': 'highlights',
  'organic': 'organic',
  'barber': 'barber',
  'blow-dry': 'blow-dry',
  'afro': 'afro',
  'colour-correction': 'colour-correction',
  'wigs': 'wigs',
};

// ─── Service quality filter (mirrors scraper logic) ───
const NAV_JUNK = new Set([
  'home', 'about', 'contact', 'gallery', 'blog', 'shop', 'menu', 'team', 'faq',
  'book', 'booking', 'call', 'email', 'instagram', 'facebook', 'gift card',
  'book now', 'call us', 'contact us', 'our team', 'meet the team', 'find us',
  'login', 'sign in', 'sign up', 'register', 'cart', 'checkout', 'search',
  'back to top', 'read more', 'learn more', 'view all', 'see more', 'more info',
  'privacy', 'terms', 'sitemap', 'careers', 'jobs',
]);
const RETAIL_BRANDS = new Set([
  'biolage', 'matrix', 'kms', 'muk', 'nak', 'goldwell', 'wella', 'schwarzkopf',
  'kerasilk', 'fanola', 'dermalogica', 'revitafoam', '12 reasons', 'quidad',
  'mermade hair', 'silver bullet', 'natural look', 'ori lab', 'genetix',
  'keracolor', 'eco minerals', 'azure tan', 'mine tan', 'the collagen co',
  'olaplex', 'redken', 'joico', 'milkshake', 'moroccanoil', 'kevin murphy',
  'de lorenzo', 'aveda', 'pureology', 'loreal', "l'oreal", 'tigi', 'sexy hair',
  'nak haircare', 'matrix styling', 'nak hair',
]);
const NON_HAIR_RE = [
  /\bwax(ing)?\b/i, /\btann(ing|ed)?\b/i, /\blash(es)?\b/i, /\bbrow(s)?\b/i,
  /\bfacial(s)?\b/i, /\bmassage\b/i, /\bnails?\b/i, /\bspray tan\b/i,
  /\bfull brow\b/i, /\bbrow tint\b/i, /\blash lift\b/i, /\blash tint\b/i,
  /\bmanicure\b/i, /\bpedicure\b/i, /\bgel nails?\b/i, /\bacrylic\b/i,
];
const ACCESSORY_RE = [/\bbrush(es)?\b/i, /\baccessori/i, /\bstyling wax\b/i, /\bgift\s*(card|voucher|certificate)/i];
const HAIR_KW = [
  /\bcut\b/i, /\btrim\b/i, /\bblow/i, /\bdry\b/i, /\bcolou?r\b/i,
  /\bhighlight/i, /\bbalayage/i, /\btint\b/i, /\bperm\b/i,
  /\bstraighten/i, /\bkeratin\b/i, /\btreatment\b/i, /\bstyl(e|ing)\b/i,
  /\bextension/i, /\bfoil/i, /\btoner\b/i, /\bgloss\b/i,
  /\bmen/i, /\bwomen/i, /\bkids?\b/i, /\bchild/i, /\bsenior\b/i,
  /\bwash\b/i, /\bshampoo\b/i, /\bfade\b/i, /\bclipper/i, /\bshave\b/i,
  /\bbeard\b/i, /\bhair\b/i, /\bfringe/i, /\blayer/i, /\bwave\b/i,
];

function filterQualityServices(services: string[] | null): string[] {
  if (!services || services.length === 0) return [];
  return services.filter((item) => {
    const lower = item.toLowerCase().trim();
    if (lower.length < 3 || lower.length > 120) return false;
    if (NAV_JUNK.has(lower)) return false;
    if (RETAIL_BRANDS.has(lower)) return false;
    for (const p of NON_HAIR_RE) if (p.test(lower) && !HAIR_KW.some(h => h.test(lower))) return false;
    for (const p of ACCESSORY_RE) if (p.test(lower)) return false;
    if (/\$|from\s+\d|price/i.test(item)) return true;
    for (const p of HAIR_KW) if (p.test(lower)) return true;
    return false;
  });
}

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
  const typeLabel = TYPE_LABEL[business.business_type].toLowerCase();
  const ratingStr = business.google_rating ? `${business.google_rating}★ from ${business.google_review_count ?? 0} Google reviews. ` : '';
  const photoUrl = business.google_photos?.[0]?.name
    ? `https://places.googleapis.com/v1/${business.google_photos[0].name}/media?maxHeightPx=630&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : 'https://www.findme.hair/og-image.jpg';
  return {
    title: `${business.name} — ${TYPE_LABEL[business.business_type]} in ${business.suburb}, ${business.state} | findme.hair`,
    description: business.ai_description
      ? `${business.ai_description.slice(0, 155)}…`
      : `${business.name} is a ${typeLabel} in ${business.suburb}, ${stateName(business.state)}. ${ratingStr}View hours, photos and book online.`,
    alternates: { canonical: `https://www.findme.hair/salon/${business.slug}` },
    openGraph: {
      title: `${business.name} — ${TYPE_LABEL[business.business_type]} in ${business.suburb}`,
      description: `${business.name} is a ${typeLabel} in ${business.suburb}, ${stateName(business.state)}. ${ratingStr}`,
      url: `https://www.findme.hair/salon/${business.slug}`,
      siteName: 'findme.hair',
      locale: 'en_AU',
      type: 'website',
      images: [{ url: photoUrl, width: 1200, height: 630 }],
    },
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
  const photos = business.google_photos ?? [];
  const isFeatured = business.featured_until && new Date(business.featured_until) > new Date();

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': business.business_type === 'barber' ? 'BarberShop' : 'HairSalon',
        name: business.name,
        url: `https://www.findme.hair/salon/${business.slug}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: business.address_line1,
          addressLocality: business.suburb,
          addressRegion: business.state,
          postalCode: business.postcode,
          addressCountry: 'AU',
        },
        ...(business.phone && { telephone: business.phone }),
        ...(business.website_url && { url: business.website_url }),
        ...(business.lat && business.lng && {
          geo: { '@type': 'GeoCoordinates', latitude: business.lat, longitude: business.lng },
        }),
        ...(business.google_rating != null && business.google_review_count != null && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: business.google_rating,
            reviewCount: business.google_review_count,
            bestRating: 5,
          },
        }),
        ...(photos.length > 0 && {
          image: `https://places.googleapis.com/v1/${photos[0].name}/media?maxHeightPx=800&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        }),
        priceRange: '$$',
        currenciesAccepted: 'AUD',
        paymentAccepted: 'Cash, Credit Card',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: stateName(business.state), item: `https://www.findme.hair/${business.state.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: business.suburb },
          { '@type': 'ListItem', position: 4, name: business.name },
        ],
      }} />
      {/* ─── Featured banner ─────────────────────────── */}
      {isFeatured && (
        <div className="bg-gradient-to-r from-[var(--color-gold)] to-[#b8942e]">
          <div className="mx-auto max-w-6xl px-6 py-2.5 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-semibold text-white tracking-wide">Featured Listing</span>
          </div>
        </div>
      )}

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
              {business.is_claimed && <span className="badge badge-gold">Claimed</span>}
              {isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-gold)] px-3 py-1 text-xs font-bold text-white">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured
                </span>
              )}
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
            {(business.ai_description || business.description) && (
              <section>
                <h2
                  className="text-xl text-[var(--color-ink)]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  About {business.name}
                </h2>
                {business.ai_description && (
                  <p className="mt-4 text-[var(--color-ink-light)] leading-relaxed">
                    {business.ai_description}
                  </p>
                )}
                {business.description && (
                  <p className={`${business.ai_description ? 'mt-3' : 'mt-4'} text-[var(--color-ink-light)] leading-relaxed whitespace-pre-wrap`}>
                    {business.description}
                  </p>
                )}
                {business.specialties && business.specialties.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {business.specialties.map((s) => (
                      <Link
                        key={s}
                        href={`/services/${SPECIALTY_SLUG[s] ?? s}`}
                        className="inline-flex items-center rounded-full bg-[var(--color-gold-light)] px-3 py-1 text-xs font-medium text-[var(--color-gold-dark)] hover:bg-[var(--color-gold)] hover:text-white transition-colors"
                      >
                        {SPECIALTY_DISPLAY[s] ?? s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </Link>
                    ))}
                  </div>
                )}
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

            {/* Services section */}
            {(() => {
              const qualityServices = filterQualityServices(business.scraped_services);
              const showServices = qualityServices.length >= 3;
              const showSection = business.booking_url || showServices;
              if (!showSection) return null;
              return (
                <section className="mt-10">
                  <h2
                    className="text-xl text-[var(--color-ink)]"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {business.booking_url ? 'Book your appointment' : 'Services'}
                  </h2>
                  {business.booking_url && (
                    <a
                      href={business.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 btn-gold inline-flex items-center gap-2 text-base px-8 py-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      Book Now
                    </a>
                  )}
                  {showServices && (
                    <ul className="mt-4 space-y-2">
                      {qualityServices.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--color-ink-light)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })()}

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
                <DetailRow label="Booking">
                  {business.walk_ins_welcome === true ? (
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Walk-ins welcome
                    </span>
                  ) : business.walk_ins_welcome === false ? (
                    'Appointment only'
                  ) : (
                    'Call to confirm'
                  )}
                </DetailRow>
              </div>
            </div>

            {/* Map */}
            <div className="card p-0 overflow-hidden">
              <MapView pins={[business]} height={280} />
            </div>

            {/* Claim banner */}
            {!business.is_claimed && <ClaimBanner slug={business.slug} />}
          </aside>
        </div>
      </div>

      {/* ─── Sticky mobile booking CTA ─────────────── */}
      {(business.booking_url || business.phone) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[var(--color-border)] bg-[var(--color-white)] p-3">
          {business.booking_url ? (
            <a
              href={business.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold w-full text-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Book appointment
            </a>
          ) : business.phone ? (
            <a href={`tel:${business.phone}`} className="btn-gold w-full text-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Call {business.phone}
            </a>
          ) : null}
        </div>
      )}
      {/* Bottom spacer for sticky CTA on mobile */}
      {(business.booking_url || business.phone) && (
        <div className="h-16 lg:hidden" />
      )}
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
