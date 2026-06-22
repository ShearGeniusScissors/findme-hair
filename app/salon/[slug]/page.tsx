import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingButton from '@/components/BookingButton';
import ClaimBanner from '@/components/ClaimBanner';
import JsonLd from '@/components/JsonLd';
import MapView from '@/components/MapView';
import StarRating from '@/components/StarRating';
import OpenStatus from '@/components/OpenStatus';
import { getBusinessBySlug, getNearbySalonsByDistance } from '@/lib/search';
import { stateName, slugify } from '@/lib/geo';
import { stripMarkdown, toParagraphs } from '@/lib/seoMeta';
import { formatTag } from '@/lib/formatTag';
import { isOpenOnDay } from '@/lib/openNow';
import { supabaseServerInternal } from '@/lib/supabase';
import { TOP_SUBURBS } from '@/lib/suburbConfig';
import { PIVOT_CITIES } from '@/lib/cityPivotConfig';
import ShearGeniusBadge from '@/components/ShearGeniusBadge';
import EngagementTracker from '@/components/EngagementTracker';
import PhotoGallery from '@/components/PhotoGallery';
import type { AuState } from '@/types/database';
import type { Metadata } from 'next';

export const revalidate = 3600; // ISR — regenerate at most once per hour

// Pre-render the 500 highest-traffic salons (featured + most-reviewed) at build
// time so Ahrefs/Google never hit a cold ISR start on these. The remaining 13k
// salons stay on-demand ISR but go in the sitemap.
export async function generateStaticParams() {
  const { supabaseServerInternal } = await import('@/lib/supabase');
  const supabase = supabaseServerInternal();
  const { data } = await supabase
    .from('businesses')
    .select('slug')
    .eq('status', 'active')
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .limit(500);
  return (data ?? []).map((b: { slug: string }) => ({ slug: b.slug }));
}

const TYPE_LABEL = {
  hair_salon: 'Hair Salon',
  barber: 'Barber Shop',
  unisex: 'Unisex Salon',
} as const;

// Display labels come from lib/formatTag (kebab/snake → Title Case + brand /
// term overrides). The map below remains for the *link target only* — chip
// click must still resolve against the underlying raw tag value because the
// filter logic on /services/[slug] uses businesses.specialties contains().
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

function PhotoUrl(p: { url?: string; name?: string }, maxHeight = 600): string | null {
  // Self-hosted storage URL preferred — zero Google billing at render time
  // (the May 2026 cost incident). Fallback: the local /api/photo proxy so
  // site-audit crawlers see findme.hair URLs (blocked by robots.txt) instead
  // of crawling Google's places.googleapis.com CDN as if it were our site.
  if (p.url) return p.url;
  if (p.name) return `/api/photo?name=${encodeURIComponent(p.name)}&h=${maxHeight}`;
  return null;
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
  // Per-salon dynamic OG when no Google photo exists. /og-image.jpg is the
  // static brand-tile fallback if the generator errors. Audit row 25f65d1a.
  const heroRef = business.google_photos?.[0];
  const heroPhoto = heroRef ? PhotoUrl(heroRef, 630) : null;
  const photoUrl = heroPhoto
    ? (heroPhoto.startsWith('http') ? heroPhoto : `https://www.findme.hair${heroPhoto}`)
    : `https://www.findme.hair/api/og?slug=${encodeURIComponent(business.slug)}`;
  const path = `https://www.findme.hair/salon/${business.slug}`;
  // Title hard-capped at <60 chars: drop the "Hair Salon in" phrase and brand suffix on long names.
  const baseTitle = `${business.name} — ${business.suburb}, ${business.state} | findme.hair`;
  const title = baseTitle.length <= 60
    ? baseTitle
    : `${business.name.slice(0, 40)} — ${business.suburb} | findme.hair`;
  // Fallback description must always be ≥ ~80 chars (audit flagged ~3 salons
  // with empty ai_description trimmed to a 0-char meta). Markdown stripped so
  // **bold** etc. doesn't render literal asterisks in meta/JSON-LD.
  const aiDesc = stripMarkdown(business.ai_description);
  const fallback = `${business.name} is a ${typeLabel} in ${business.suburb}, ${stateName(business.state)}. ${ratingStr}View hours, photos and book online via findme.hair.`;
  const description = aiDesc.length >= 50
    ? `${aiDesc.slice(0, 155)}${aiDesc.length > 155 ? '…' : ''}`
    : fallback;
  // Audit row 3b164977 — pages with confidence_score < 30 and no enrichment
  // (no Google photos AND no AI description AND no manual description) are
  // paper-thin. Don't let Google index them — they dilute trust signals.
  const isLowConfidence = (business.confidence_score ?? 0) < 30
    && (!business.google_photos || business.google_photos.length === 0)
    && !business.ai_description
    && !business.description;

  return {
    title,
    description,
    robots: isLowConfidence
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : undefined,
    alternates: {
      canonical: path,
      languages: {
        'en-AU': path,
        'x-default': path,
      },
    },
    openGraph: {
      title: `${business.name} — ${TYPE_LABEL[business.business_type]} in ${business.suburb}`,
      description: `${business.name} is a ${typeLabel} in ${business.suburb}, ${stateName(business.state)}. ${ratingStr}`,
      url: path,
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

  // Real-geography "Other salons near {suburb}" — haversine within 25km, never
  // a state-wide fallback (that previously surfaced Melbourne salons on
  // remote-country profiles). If <2 salons within radius we render an empty
  // state with a /claim CTA further down.
  const nearbySalons = await getNearbySalonsByDistance(
    { slug: business.slug, suburb: business.suburb, state: business.state, lat: business.lat, lng: business.lng },
    25,
    6,
  );

  // Region-level siblings — many small suburbs have only 1-3 salons so
  // nearbySalons returns a thin list. Pull up to 12 region-level sibling salons
  // for a denser internal-link block per profile.
  // (Roughly 13.8k profiles × 12 region links = ~165k inbound salon links sitewide.)
  let regionSiblings: Array<{ id: string; slug: string; name: string; suburb: string; google_rating: number | null; google_review_count: number | null }> = [];
  let regionDisplayName = '';
  // Crawlable suburb-hub URL for the breadcrumb. The suburb crumb used to point
  // at /search?suburb=… — a route robots.txt BLOCKS — so every one of ~13.7k
  // profiles leaked its breadcrumb equity (BreadcrumbList schema + the visible
  // link) into a non-indexable dead-end. Repoint at the real
  // /[state]/[region]/[suburb] hub, falling back to the (also crawlable) state
  // page when a slug is missing (~0.2% of rows).
  let suburbHubUrl = `/${business.state.toLowerCase()}`;
  if (business.region_id) {
    const db = supabaseServerInternal();
    const [{ data: regionRow }, { data: siblings }, { data: suburbRow }] = await Promise.all([
      db.from('regions').select('name, slug').eq('id', business.region_id).maybeSingle(),
      db.from('businesses')
        .select('id, slug, name, suburb, google_rating, google_review_count')
        .eq('status', 'active')
        .eq('region_id', business.region_id)
        .neq('slug', business.slug)
        .order('google_review_count', { ascending: false, nullsFirst: false })
        .limit(12),
      db.from('suburbs').select('slug').eq('id', business.suburb_id ?? '').maybeSingle(),
    ]);
    regionDisplayName = (regionRow as { name?: string } | null)?.name ?? '';
    regionSiblings = (siblings ?? []) as typeof regionSiblings;
    const regionSlug = (regionRow as { slug?: string } | null)?.slug;
    const suburbSlug = (suburbRow as { slug?: string } | null)?.slug;
    if (regionSlug && suburbSlug) {
      suburbHubUrl = `/${business.state.toLowerCase()}/${regionSlug}/${suburbSlug}`;
    }
  }

  const photos = business.google_photos ?? [];
  const isFeatured = business.featured_until && new Date(business.featured_until) > new Date();

  // Narrative fact paragraph (playbook Tactic 4 + Part 4 profile formula —
  // Domain/Zillow data→prose pattern). Every clause is a live DB fact; only
  // true clauses render, in the formula order: position → rating (+
  // comparative only when flattering) → distinctive fact → service identity
  // → claim state. One suburb-peer query per render (ISR-cached 1h; suburbs
  // top out around ~100 rows so this stays light).
  // Filter by region_id too so the peer pool matches getSuburbBusinesses
  // (the suburb-page pool) — without it, same-named suburbs in other
  // regions inflate the count and the profile disagrees with the page.
  const { data: suburbPeerRows } = await supabaseServerInternal()
    .from('businesses')
    .select('id, google_rating, google_review_count, google_hours, walk_ins_welcome')
    .eq('status', 'active')
    .eq('suburb', business.suburb)
    .eq('state', business.state)
    .eq('region_id', business.region_id);
  const peers = (suburbPeerRows ?? []) as Array<{
    id: string;
    google_rating: number | null;
    google_review_count: number | null;
    google_hours: { periods?: unknown[] } | null;
    walk_ins_welcome: boolean | null;
  }>;
  const suburbCount = peers.length;
  const factClauses: string[] = [];
  if (suburbCount > 1) {
    factClauses.push(`${business.name} is one of ${suburbCount} hair salons and barbers listed in ${business.suburb}, ${stateName(business.state)}.`);
  }
  if (business.google_rating != null && (business.google_review_count ?? 0) >= 5 && business.google_rating >= 4.0) {
    // Comparative clause only when flattering: weighted (rating × log review
    // volume) rank in the suburb's top 3, with enough rated peers that
    // "top-rated" means something. Never render an unflattering comparison.
    const weighted = (r: number | null, c: number | null) =>
      (r ?? 0) * Math.log10((c ?? 0) + 2);
    const ratedPeers = peers.filter((p) => p.google_rating != null && (p.google_review_count ?? 0) >= 5);
    const myScore = weighted(business.google_rating, business.google_review_count);
    const rank = ratedPeers.filter((p) => weighted(p.google_rating, p.google_review_count) > myScore).length + 1;
    const comparative = ratedPeers.length >= 8 && rank <= 3 ? ' — among the top-rated in the suburb' : '';
    factClauses.push(`It holds a ${business.google_rating.toFixed(1)}-star rating from ${business.google_review_count} reviews on Google${comparative}.`);
  }
  // Distinctive real fact — first true, scarce-enough clause wins.
  let walkInsUsedAsDistinctive = false;
  {
    const reviewCounts = peers.map((p) => p.google_review_count ?? 0);
    const isMostReviewed =
      (business.google_review_count ?? 0) >= 10 &&
      suburbCount > 3 &&
      reviewCounts.filter((c) => c >= (business.google_review_count ?? 0)).length === 1;
    const satCount = peers.filter((p) => isOpenOnDay(p.google_hours, 6)).length;
    const walkInCount = peers.filter((p) => p.walk_ins_welcome === true).length;
    if (isMostReviewed) {
      factClauses.push(`It's the most-reviewed salon in ${business.suburb}.`);
    } else if (
      isOpenOnDay(business.google_hours, 6) &&
      satCount > 0 && suburbCount > 3 && satCount <= Math.ceil(suburbCount / 2)
    ) {
      factClauses.push(`It's one of ${satCount === 1 ? 'the few' : satCount} ${business.suburb} salons open Saturdays.`);
    } else if (
      business.walk_ins_welcome === true &&
      walkInCount > 0 && suburbCount > 3 && walkInCount <= Math.ceil(suburbCount / 2)
    ) {
      factClauses.push(`It's one of ${walkInCount === 1 ? 'the few' : walkInCount} ${business.suburb} salons taking walk-ins.`);
      walkInsUsedAsDistinctive = true;
    }
  }
  // Service identity — real specialty tags only.
  if (business.specialties && business.specialties.length > 0) {
    // "colour specialist ... work" reads awkwardly — drop the role suffix in prose.
    const tags = business.specialties.slice(0, 3).map((s) =>
      formatTag(s).toLowerCase().replace(/\s+specialist$/, ''),
    );
    const tagList = tags.length === 1 ? tags[0] : `${tags.slice(0, -1).join(', ')} and ${tags[tags.length - 1]}`;
    factClauses.push(`The salon is known for ${tagList} work.`);
  }
  if (business.walk_ins_welcome === true && !walkInsUsedAsDistinctive) {
    factClauses.push('Walk-ins are welcome.');
  }
  if (business.is_claimed) {
    factClauses.push('Details on this page are confirmed by the owner.');
  }
  const factParagraph = factClauses.length >= 2 ? factClauses.join(' ') : null;

  // ShearGenius badge: only show in active service territories
  const SG_TERRITORIES = new Set<AuState>(['VIC', 'SA', 'TAS']);
  const showSgBadge = SG_TERRITORIES.has(business.state);
  let sgLastVisit: string | null = null;
  let sgNextVisit: string | null = null;
  if (showSgBadge) {
    const today = new Date().toISOString().slice(0, 10);
    const db = supabaseServerInternal();
    const [lastRes, nextRes] = await Promise.all([
      db.from('field_runs').select('run_date').eq('state', business.state)
        .lte('run_date', today).order('run_date', { ascending: false }).limit(1),
      db.from('field_runs').select('run_date').eq('state', business.state)
        .gt('run_date', today).order('run_date', { ascending: true }).limit(1),
    ]);
    sgLastVisit = (lastRes.data?.[0] as { run_date: string } | undefined)?.run_date ?? null;
    sgNextVisit = (nextRes.data?.[0] as { run_date: string } | undefined)?.run_date ?? null;
  }

  // Convert Google Places API hours periods to Schema.org OpeningHoursSpecification
  const SCHEMA_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  type GooglePeriod = { open?: { day?: number; hour?: number; minute?: number }; close?: { day?: number; hour?: number; minute?: number } };
  const openingHoursSpec = (() => {
    const periods = (business.google_hours?.periods ?? []) as GooglePeriod[];
    if (!Array.isArray(periods) || periods.length === 0) return null;
    const seen = new Set<string>();
    const specs: Array<Record<string, string>> = [];
    for (const p of periods) {
      if (!p?.open || !p?.close || typeof p.open.day !== 'number') continue;
      const dayName = SCHEMA_DAYS[p.open.day];
      if (!dayName) continue;
      const opens = `${String(p.open.hour ?? 0).padStart(2,'0')}:${String(p.open.minute ?? 0).padStart(2,'0')}`;
      const closes = `${String(p.close.hour ?? 0).padStart(2,'0')}:${String(p.close.minute ?? 0).padStart(2,'0')}`;
      const key = `${dayName}|${opens}|${closes}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // dayOfWeek MUST be a schema.org URL per spec — Ahrefs strict validator
      // flags plain string ("Tuesday") even though Google tolerates it.
      specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: `https://schema.org/${dayName}`, opens, closes });
    }
    return specs.length > 0 ? specs : null;
  })();

  return (
    <main className="min-h-screen bg-[var(--color-surface)]" data-track-business={business.id}>
      <EngagementTracker businessId={business.id} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': business.business_type === 'barber' ? 'BarberShop' : 'HairSalon',
        '@id': `https://www.findme.hair/salon/${business.slug}#business`,
        name: business.name,
        url: `https://www.findme.hair/salon/${business.slug}`,
        // Description is recommended by Google Rich Results validator. Fall back to a
        // factual sentence if no AI/manual description exists, so every salon emits one.
        // Markdown stripped — JSON-LD must not contain ** or other markdown markers.
        description: stripMarkdown(business.ai_description)
          || stripMarkdown(business.description)
          || `${business.name} is a ${TYPE_LABEL[business.business_type].toLowerCase()} in ${business.suburb}, ${stateName(business.state)}.`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: business.address_line1,
          addressLocality: business.suburb,
          addressRegion: business.state,
          postalCode: business.postcode,
          addressCountry: 'AU',
        },
        ...(business.phone && { telephone: business.phone }),
        // External website goes in sameAs — was previously colliding with the canonical
        // url field and breaking schema validation on ~9k pages.
        ...(business.website_url && { sameAs: [business.website_url] }),
        ...(business.lat != null && business.lng != null && {
          geo: { '@type': 'GeoCoordinates', latitude: business.lat, longitude: business.lng },
        }),
        ...(business.google_rating != null && (business.google_review_count ?? 0) > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: business.google_rating,
            reviewCount: business.google_review_count,
            bestRating: 5,
            worstRating: 1,
          },
        }),
        ...(openingHoursSpec && { openingHoursSpecification: openingHoursSpec }),
        // Image as ImageObject for stronger Google Rich Results compliance.
        // Photo URL goes through the /api/photo proxy so it sits on findme.hair.
        // Width/height omitted because the upstream image isn't fixed at 1200x630;
        // ImageObject only requires url per schema.org spec.
        image: {
          '@type': 'ImageObject',
          url: (() => {
            const p = photos.length > 0 ? PhotoUrl(photos[0], 800) : null;
            if (!p) return `https://www.findme.hair/api/og?slug=${encodeURIComponent(business.slug)}`;
            return p.startsWith('http') ? p : `https://www.findme.hair${p}`;
          })(),
        },
        priceRange: '$$',
        // paymentAccepted is Text per schema.org spec — array form trips strict
        // validators (Ahrefs included). currenciesAccepted is not a property of
        // BarberShop/HairSalon (only on Store/AutomotiveBusiness/FoodEstablishment).
        paymentAccepted: 'Cash, Credit Card',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: stateName(business.state), item: `https://www.findme.hair/${business.state.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: business.suburb, item: `https://www.findme.hair${suburbHubUrl}` },
          { '@type': 'ListItem', position: 4, name: business.name },
        ],
      }} />
      {/* Featured indicator is rendered inline next to the type badge (lines
          below) — the full-width top banner was a visual duplicate. Audit row
          bd52cdff. */}

      {/* ─── Breadcrumb ───────────────────────────────── */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <Link href={`/${business.state.toLowerCase()}`} className="hover:text-[var(--color-gold-dark)]">
              {stateName(business.state)}
            </Link>
            <Chevron />
            <Link
              href={suburbHubUrl}
              className="hover:text-[var(--color-gold-dark)]"
            >
              {business.suburb}
            </Link>
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium truncate">{business.name}</span>
          </nav>
        </div>
      </div>

      {/* ─── Photo gallery (Tactic 10) ────────────────── */}
      {photos.length > 0 ? (
        <PhotoGallery
          photos={photos.map((p) => PhotoUrl(p, 800)).filter((u): u is string => u != null)}
          name={business.name}
        />
      ) : (
        /* Zero-photo claim-bait empty state — photos are listing inventory;
           the gap itself is the pitch. Black/gold, kept slim so 13k+
           photo-less profiles don't feel broken. */
        <div className="bg-[var(--color-white)]">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-warm)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 flex-shrink-0 text-[var(--color-gold-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                <p className="text-sm text-[var(--color-ink-light)]">
                  Photos are managed by the salon.{' '}
                  <span className="font-medium text-[var(--color-ink)]">Own {business.name}?</span>{' '}
                  Add yours free.
                </p>
              </div>
              <Link
                href={`/claim?slug=${business.slug}`}
                className="btn-outline text-sm whitespace-nowrap"
              >
                Add photos free
              </Link>
            </div>
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
              {business.top_rated_year != null && (
                <Link
                  href="/top-rated"
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-gold)] bg-white px-3 py-1 text-xs font-bold text-[var(--color-gold-dark)] hover:bg-[var(--color-gold-light)]"
                  title={`Top 10% of Australian salons and barbers on findme.hair by Google rating, ${business.top_rated_year} — see how it's calculated`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.11l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5z" />
                  </svg>
                  Top Rated {business.top_rated_year}
                </Link>
              )}
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
              {/* Add a contextual subtitle only when the business name is short enough that
                  the combined H1 stays under ~70 chars. Long business names produce sufficient
                  H1 text on their own. */}
              {business.name.length <= 30 && (
                <span className="block text-base font-normal text-[var(--color-ink-light)] mt-1">
                  {TYPE_LABEL[business.business_type]} in {business.suburb}, {stateName(business.state)}
                </span>
              )}
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
                  showTier
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
                  rel="nofollow noopener noreferrer"
                  className="btn-outline text-sm gap-2"
                  data-track="website"
                  data-track-source="profile"
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
                  rel="nofollow noopener noreferrer"
                  className="btn-outline text-sm gap-2"
                  data-track="maps"
                  data-track-source="profile"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Google Maps
                </a>
              )}
            </div>

            {/* Who-am-I-dealing-with microcopy (playbook Part 2): directories
                carry a unique anxiety — who answers when I tap? Say it plainly. */}
            {(business.booking_url || business.phone) && (
              <p className="mt-2.5 text-xs text-[var(--color-ink-muted)]">
                {business.booking_url
                  ? 'Booking opens the salon’s own booking page. Calls go straight to the salon.'
                  : 'Calls go straight to the salon.'}
              </p>
            )}

            {/* Divider */}
            <div className="my-10 h-px bg-[var(--color-border)]" />

            {/* Narrative fact paragraph — live DB facts, unique per page
                (playbook Tactic 4). Body content only; schema/H1 untouched. */}
            {factParagraph && (
              <p className="mb-8 rounded-xl bg-[var(--color-surface-warm)] px-5 py-4 text-sm leading-relaxed text-[var(--color-ink-light)]">
                {factParagraph}
              </p>
            )}

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
                  <div className="mt-4 space-y-3">
                    {toParagraphs(business.ai_description).map((p, i) => (
                      <p key={i} className="text-[var(--color-ink-light)] leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
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
                        className="inline-flex items-center rounded-full bg-[var(--color-gold-light)] px-3 py-1 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-gold)] hover:text-white transition-colors"
                      >
                        {formatTag(s)}
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
                  {business.is_claimed
                    ? 'Hours not listed yet — the owner can add them from the dashboard.'
                    : 'Hours not listed yet — own this salon? '}
                  {!business.is_claimed && (
                    <Link href={`/claim?slug=${business.slug}`} className="font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                      Add them free
                    </Link>
                  )}
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
                      rel="nofollow noopener noreferrer"
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
                      rel="nofollow noopener noreferrer"
                      className="text-sm font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                    >
                      Read all reviews &rarr;
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* FAQ-shaped block (playbook Part 2) — assembled ONLY from real
                data, plain HTML, deliberately NO FAQPage schema (SEO frozen).
                Gives the scannable Q&A shape AI engines cite without UGC. */}
            {(() => {
              const faqs: Array<{ q: string; a: string }> = [];
              const addr = [business.address_line1, business.suburb, business.state, business.postcode]
                .filter(Boolean)
                .join(', ');
              if (business.address_line1) {
                faqs.push({
                  q: `Where is ${business.name}?`,
                  a: `${business.name} is at ${addr}.`,
                });
              }
              if (business.walk_ins_welcome === true) {
                faqs.push({
                  q: `Does ${business.name} take walk-ins?`,
                  a: `Yes — walk-ins are welcome at ${business.name}.`,
                });
              } else if (business.walk_ins_welcome === false) {
                faqs.push({
                  q: `Does ${business.name} take walk-ins?`,
                  a: `Appointments are recommended at ${business.name}.`,
                });
              }
              if (business.google_hours?.periods?.length) {
                const sat = isOpenOnDay(business.google_hours, 6);
                const sun = isOpenOnDay(business.google_hours, 0);
                faqs.push({
                  q: `Is ${business.name} open on weekends?`,
                  a: sat && sun
                    ? `Yes — ${business.name} is open on both Saturday and Sunday. See the full opening hours above.`
                    : sat
                      ? `${business.name} is open on Saturdays and closed on Sundays.`
                      : sun
                        ? `${business.name} is open on Sundays and closed on Saturdays.`
                        : `No — ${business.name} is closed on weekends.`,
                });
              }
              if (business.booking_url) {
                faqs.push({
                  q: `How do I book at ${business.name}?`,
                  a: `You can book online using the Book Now button on this page.`,
                });
              } else if (business.phone) {
                faqs.push({
                  q: `How do I book at ${business.name}?`,
                  a: `Call ${business.phone} to make an appointment.`,
                });
              }
              if (business.google_rating != null && (business.google_review_count ?? 0) >= 5) {
                faqs.push({
                  q: `How is ${business.name} rated?`,
                  a: `${business.name} has a ${business.google_rating.toFixed(1)}-star average from ${business.google_review_count} Google reviews.`,
                });
              }
              if (faqs.length < 3) return null;
              return (
                <section className="mt-10">
                  <h2
                    className="text-xl text-[var(--color-ink)]"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    Frequently asked questions
                  </h2>
                  <div className="mt-4 card p-0 divide-y divide-[var(--color-border-light)]">
                    {faqs.map((f) => (
                      <div key={f.q} className="px-5 py-4">
                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">{f.q}</h3>
                        <p className="mt-1 text-sm text-[var(--color-ink-light)]">{f.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Browse the area — internal linking to suburb + city pivot pages */}
            {(() => {
              const suburbSlug = slugify(business.suburb);
              const matchedSuburb = TOP_SUBURBS.find((s) => s.slug === suburbSlug && s.state === business.state);
              const matchedCity = PIVOT_CITIES.find((c) => c.state === business.state && (
                business.suburb.toLowerCase() === c.name.toLowerCase() ||
                c.suburbs.includes(business.suburb.toLowerCase())
              ));
              const isBarber = business.business_type === 'barber';
              const links: Array<{ href: string; label: string }> = [];
              if (matchedSuburb) {
                links.push({ href: `/${isBarber ? 'barber' : 'hairdresser'}/${matchedSuburb.slug}`, label: `${isBarber ? 'Barbers' : 'Hairdressers'} in ${matchedSuburb.name}` });
                if (!isBarber) {
                  links.push({ href: `/hair-salon/${matchedSuburb.slug}`, label: `Hair Salons in ${matchedSuburb.name}` });
                  links.push({ href: `/at-home-hairdresser/${matchedSuburb.slug}`, label: `At-Home Hairdressers in ${matchedSuburb.name}` });
                }
              }
              if (matchedCity) {
                links.push({ href: `/best-${isBarber ? 'barber' : 'hairdresser'}/${matchedCity.slug}`, label: `Best ${isBarber ? 'Barbers' : 'Hairdressers'} in ${matchedCity.name}` });
              }
              links.push({ href: `/${business.state.toLowerCase()}`, label: `All ${stateName(business.state)} salons & barbers` });
              if (links.length === 0) return null;
              return (
                <section className="mt-10">
                  <h2 className="text-xl text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                    Browse the area
                  </h2>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
                          {l.label} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })()}

            {/* Nearby salons — haversine within 25km. Empty state when <2 real
                neighbours exist (e.g. remote country towns) — never falls back
                to unrelated metro salons. */}
            <section className="mt-10">
              <h2 className="text-xl text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                Other salons near {business.suburb}
              </h2>
              {nearbySalons.length >= 2 ? (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {nearbySalons.map((n) => (
                    <li key={n.slug}>
                      <Link
                        href={`/salon/${n.slug}`}
                        className="block card p-4 hover:border-[var(--color-gold)] transition-colors"
                      >
                        <div className="text-sm font-medium text-[var(--color-ink)]">{n.name}</div>
                        <div className="mt-1 text-xs text-[var(--color-ink-muted)]">
                          {n.suburb}, {n.state}
                          <span className="ml-2 text-[var(--color-ink)]">
                            {n.distance_km < 1 ? `${(n.distance_km * 1000).toFixed(0)} m away` : `${n.distance_km.toFixed(1)} km away`}
                          </span>
                          {n.google_rating != null && (
                            <span className="ml-2 text-[var(--color-gold-dark)]">
                              ★ {n.google_rating.toFixed(1)}
                              {n.google_review_count ? ` (${n.google_review_count})` : ''}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 card p-6">
                  <p className="text-sm text-[var(--color-ink-light)]">
                    No verified salons nearby yet — be the first to claim a listing in your area.
                  </p>
                  <Link
                    href="/claim"
                    className="mt-3 inline-flex items-center text-sm font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                  >
                    Claim a listing →
                  </Link>
                </div>
              )}
            </section>

            {/* Region-level sibling salons — denser internal-link block.
                Plain anchor list (no cards) so 12 region siblings don't blow up the page. */}
            {regionSiblings.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xl text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  More salons in {regionDisplayName || stateName(business.state)}
                </h2>
                <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">
                  {regionSiblings.map((s) => (
                    <li key={s.id} className="truncate">
                      <Link
                        href={`/salon/${s.slug}`}
                        className="text-[var(--color-ink)] hover:text-[var(--color-gold-dark)]"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-[var(--color-ink-muted)]"> — {s.suburb}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
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
                    <a href={`tel:${business.phone}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]" data-track="call" data-track-source="profile">
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

            {/* Preferred scissor supplier badge */}
            {business.preferred_scissor_supplier_url && (() => {
              const supplierUrl = new URL(business.preferred_scissor_supplier_url);
              if (supplierUrl.hostname === 'sheargenius.com.au') {
                supplierUrl.hostname = 'www.sheargenius.com.au';
              }
              supplierUrl.searchParams.set('utm_source', 'findme.hair');
              supplierUrl.searchParams.set('utm_medium', 'referral');
              supplierUrl.searchParams.set('utm_campaign', 'supplier-link');
              supplierUrl.searchParams.set('utm_content', business.slug);
              return (
                <div className="card p-5">
                  <p className="text-xs text-[var(--color-ink-muted)] mb-2 font-medium uppercase tracking-wide">Preferred Scissors</p>
                  <a
                    href={supplierUrl.toString()}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] transition-colors"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <line x1="20" y1="4" x2="8.12" y2="15.88" />
                      <line x1="14.47" y1="14.48" x2="20" y2="20" />
                      <line x1="8.12" y1="8.12" x2="12" y2="12" />
                    </svg>
                    {supplierUrl.hostname.replace(/^www\./, '')}
                    <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              );
            })()}

            {/* Claim banner */}
            {!business.is_claimed && (
              <ClaimBanner
                slug={business.slug}
                name={business.name}
                topRatedYear={business.top_rated_year}
              />
            )}
          </aside>
        </div>
      </div>

      {/* ─── ShearGenius supplier badge (VIC/SA/TAS only) ── */}
      {showSgBadge && (
        <ShearGeniusBadge lastVisit={sgLastVisit} nextVisit={sgNextVisit} />
      )}

      {/* ─── Sticky mobile action bar — Call / Directions / Book ───
          Playbook Tactic 1: max 3 buttons, never a dead one. Calls convert
          30–50% vs 1–2% for web clicks, so Call is always present when a
          phone exists. Directions deep-links Maps via place_id/lat-lng. */}
      {(() => {
        const directionsHref = business.google_place_id
          ? `https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`
          : business.lat != null && business.lng != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`
            : null;
        const buttons: Array<{ key: string; href: string; label: string; external: boolean; primary: boolean; track: string }> = [];
        if (business.phone) buttons.push({ key: 'call', href: `tel:${business.phone}`, label: 'Call', external: false, primary: !business.booking_url, track: 'call' });
        if (directionsHref) buttons.push({ key: 'dir', href: directionsHref, label: 'Directions', external: true, primary: false, track: 'directions' });
        if (business.booking_url) buttons.push({ key: 'book', href: business.booking_url, label: 'Book', external: true, primary: true, track: 'book' });
        else if (business.website_url && buttons.length < 3) buttons.push({ key: 'web', href: business.website_url, label: 'Website', external: true, primary: buttons.length === 0, track: 'website' });
        if (buttons.length === 0) return null;
        return (
          <>
            <div
              className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[var(--color-border)] bg-[var(--color-white)] p-3"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
              <div className={`grid gap-2 ${buttons.length === 3 ? 'grid-cols-3' : buttons.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {buttons.map((b) => (
                  <a
                    key={b.key}
                    href={b.href}
                    {...(b.external ? { target: '_blank', rel: 'nofollow noopener noreferrer' } : {})}
                    className={`${b.primary ? 'btn-gold' : 'btn-outline'} w-full justify-center text-center text-sm`}
                    data-track={b.track}
                    data-track-source="sticky"
                  >
                    {b.label}
                  </a>
                ))}
              </div>
            </div>
            {/* Bottom spacer for sticky CTA on mobile */}
            <div className="h-20 lg:hidden" />
          </>
        );
      })()}
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
