import type { MetadataRoute } from 'next';
import { supabaseServerInternal } from '@/lib/supabase';
import { TOP_SUBURBS } from '@/lib/suburbConfig';
import { PIVOT_CITIES } from '@/lib/cityPivotConfig';
import { cityPivotIndexable, suburbPivotIndexable, type CoverageRow, type SuburbPivotRoute } from '@/lib/pivotCoverage';

// Drop force-dynamic so Next.js can serve the cached sitemap across requests
// within the revalidate window. Audit row 8415761b.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = supabaseServerInternal();
  const base = 'https://www.findme.hair';
  // lastmod must be truthful or Google ignores it for the whole sitemap. Until
  // 2026-11-02 every hub/static URL said "modified today" on each daily regen.
  // Now: salon pages use their row's updated_at; state/region/suburb hubs use
  // the newest updated_at of the listings they show; data-driven static pages
  // use the newest listing change; copy-only pages use CONTENT_UPDATED (bump it
  // when their copy changes).
  const CONTENT_UPDATED = new Date('2026-11-02');

  // ONE paginated pass over active businesses feeds every business-derived part
  // of the sitemap. PostgREST silently caps a plain select at 1,000 rows — keep
  // the .range() pagination (see the 2026-08-05/06 fixes).
  type BusinessRow = CoverageRow & {
    slug: string;
    updated_at: string | null;
    confidence_score: number | null;
    region_id: string | null;
  };
  const allBusinessRows: BusinessRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data } = await supabase
      .from('businesses')
      .select('slug, updated_at, confidence_score, region_id, state, suburb, specialties, is_mobile, name, business_type')
      .eq('status', 'active')
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allBusinessRows.push(...(data as BusinessRow[]));
    if (data.length < 1000) break;
  }
  const newer = (a: Date | undefined, b: string | null) => {
    if (!b) return a;
    const d = new Date(b);
    return !a || d > a ? d : a;
  };
  let latestListingChange: Date | undefined;
  const stateLastMod = new Map<string, Date>();
  const regionLastMod = new Map<string, Date>();
  const suburbLastMod = new Map<string, Date>();
  for (const b of allBusinessRows) {
    latestListingChange = newer(latestListingChange, b.updated_at);
    if (b.state) stateLastMod.set(b.state.toUpperCase(), newer(stateLastMod.get(b.state.toUpperCase()), b.updated_at)!);
    if (b.region_id) regionLastMod.set(b.region_id, newer(regionLastMod.get(b.region_id), b.updated_at)!);
    if (b.state && b.suburb) {
      const key = `${b.state.toUpperCase()}|${b.suburb.toLowerCase().trim()}`;
      suburbLastMod.set(key, newer(suburbLastMod.get(key), b.updated_at)!);
    }
  }
  // Templates changed on CONTENT_UPDATED, so no listing-driven page is older than that.
  const atLeastContent = (d?: Date) => (d && d > CONTENT_UPDATED ? d : CONTENT_UPDATED);
  const dataUpdated = atLeastContent(latestListingChange);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: dataUpdated, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/for-salons`, lastModified: CONTENT_UPDATED, changeFrequency: 'monthly', priority: 0.5 },
    // NOTE: /search is intentionally NOT in the sitemap — it's Disallow'd in robots.ts
    // (thin, infinite query-combo bot-bait). Listing a robots-blocked URL in the
    // sitemap is a "blocked URL in sitemap" coverage error. Removed 2026-06-20.
    { url: `${base}/directory`, lastModified: dataUpdated, changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/press`, lastModified: CONTENT_UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/press/state-of-australian-hair-industry-2026`, lastModified: new Date('2026-05-22'), changeFrequency: 'yearly', priority: 0.85 },
    { url: `${base}/for-salons/badge`, lastModified: new Date('2026-05-22'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/trust`, lastModified: CONTENT_UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/best-haircut-australia`, lastModified: dataUpdated, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/stats`, lastModified: dataUpdated, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/reviews`, lastModified: dataUpdated, changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/scissor-sharpening`, lastModified: CONTENT_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // State pages
  const states = ['vic', 'nsw', 'qld', 'wa', 'sa', 'tas', 'nt', 'act'];
  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${base}/${s}`,
    lastModified: atLeastContent(stateLastMod.get(s.toUpperCase())),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));
  const stateStatsPages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${base}/stats/${s}`,
    lastModified: atLeastContent(stateLastMod.get(s.toUpperCase())),
    changeFrequency: 'daily' as const,
    priority: 0.72,
  }));

  type RegionRow = { id: string; slug: string | null; state: string | null };
  type SuburbRow = {
    slug: string;
    state: string;
    region_id: string | null;
    regions: { slug: string } | { slug: string }[];
  };

  // Region pages — fetch all regions (default limit is 1000, paginate to be safe)
  const allRegions: RegionRow[] = [];
  let regionOffset = 0;
  while (true) {
    const { data } = await supabase.from('regions').select('id, slug, state').range(regionOffset, regionOffset + 999);
    if (!data || data.length === 0) break;
    allRegions.push(...(data as RegionRow[]));
    if (data.length < 1000) break;
    regionOffset += 1000;
  }
  const regionPages: MetadataRoute.Sitemap = allRegions
    .filter((r): r is { id: string; slug: string; state: string } => !!r.state && !!r.slug)
    .map((r) => ({
      url: `${base}/${r.state.toLowerCase()}/${r.slug}`,
      lastModified: atLeastContent(regionLastMod.get(r.id)),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Suburb pages — paginate to get all suburbs
  const allSuburbs: SuburbRow[] = [];
  let suburbOffset = 0;
  const suburbBatch = 1000;
  while (true) {
    const { data } = await supabase
      .from('suburbs')
      .select('slug, state, region_id, regions!inner(slug)')
      .range(suburbOffset, suburbOffset + suburbBatch - 1);
    if (!data || data.length === 0) break;
    allSuburbs.push(...(data as unknown as SuburbRow[]));
    if (data.length < suburbBatch) break;
    suburbOffset += suburbBatch;
  }

  // Build a set of suburbs that actually have active businesses, so we don't
  // pollute the sitemap with suburb pages that render noindex (the per-page
  // template noindexes empty suburb pages). Ahrefs Site Audit flagged 1,384
  // "Noindex page in sitemap" errors traced primarily to this.
  // Uses the single paginated business pass above (the 2026-08-06 1,000-row cap fix).
  const populatedSuburbs = new Set<string>();
  for (const row of allBusinessRows) {
    if (row.suburb && row.state) {
      populatedSuburbs.add(`${row.state.toUpperCase()}|${row.suburb.toLowerCase().trim()}`);
    }
  }

  const suburbPages: MetadataRoute.Sitemap = allSuburbs
    .filter((s) => populatedSuburbs.has(`${s.state.toUpperCase()}|${(s.slug || '').replace(/-/g, ' ').toLowerCase().trim()}`))
    .map((s) => {
      const regionSlug = Array.isArray(s.regions) ? s.regions[0]?.slug : s.regions?.slug;
      return {
        url: `${base}/${s.state.toLowerCase()}/${regionSlug}/${s.slug}`,
        lastModified: atLeastContent(suburbLastMod.get(`${s.state.toUpperCase()}|${(s.slug || '').replace(/-/g, ' ').toLowerCase().trim()}`)),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

  // Business profile pages — each URL's lastmod is the row's own updated_at.
  // Low-confidence pages are noindexed in generateMetadata (audit row 3b164977),
  // so they are left out here too.
  const businessPages: MetadataRoute.Sitemap = allBusinessRows
    .filter((b) => (b.confidence_score ?? 0) >= 30) // low-confidence pages are noindex'd; drop from sitemap too
    .map((b) => ({
      url: `${base}/salon/${b.slug}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : CONTENT_UPDATED,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  // Preserve the original slug list for downstream pagination counts.
  const allBusinessSlugs: string[] = businessPages.map((p) => String(p.url).split('/salon/')[1]);

  // Paginated /directory/salons/[page] — every salon links from these pages,
  // killing the "orphan page" issue Ahrefs flagged on 8,764 salon profiles.
  const totalSalonPages = Math.ceil(allBusinessSlugs.length / 100);
  const salonDirectoryPages: MetadataRoute.Sitemap = Array.from({ length: totalSalonPages }, (_, i) => ({
    url: `${base}/directory/salons/${i + 1}`,
    lastModified: dataUpdated,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  // City guide pages (8 capitals + 8 regional) — PIVOT_CITIES is the same
  // 16-city set every city-pivot route renders.
  // 12 city-pivot service routes × 16 cities = 192 URLs
  const cityServiceRoutes = [
    'best-hairdresser', 'best-barber', 'mobile-hairdresser',
    'korean-hair-salon', 'japanese-hairdresser', 'walk-in-barber',
    'kids-hairdresser', 'balayage-specialist', 'bridal-hair',
    'hair-extensions', 'mens-haircut', 'curly-hair-specialist',
    'best-haircut',
  ];
  // Specialty pivots (Korean, curly, …) are only listed where enough listings
  // actually carry that specialty; thinner ones are noindexed by the page itself.
  const cityGuidePages: MetadataRoute.Sitemap = PIVOT_CITIES.flatMap((c) =>
    cityServiceRoutes
      .filter((route) => cityPivotIndexable(allBusinessRows, route, c.state, c.suburbs))
      .map((route) => ({
        url: `${base}/${route}/${c.slug}`,
        lastModified: dataUpdated,
        changeFrequency: 'monthly' as const,
        priority: route.startsWith('best-') ? 0.85 : 0.78,
      }))
  );

  // Blog pages
  const blogSlugs = [
    'how-to-choose-a-hairdresser',
    'hair-salon-vs-barber-shop',
    'questions-to-ask-your-hairdresser',
    'how-much-does-a-haircut-cost-in-australia',
    'what-is-balayage',
    'how-to-find-a-good-barber',
    'tipping-your-hairdresser-in-australia',
    'how-often-should-you-get-a-haircut',
    'what-to-do-if-you-hate-your-haircut',
    'how-to-prepare-for-a-hair-appointment',
  ];
  const blogPages: MetadataRoute.Sitemap = [
    { url: `${base}/blog`, lastModified: CONTENT_UPDATED, changeFrequency: 'weekly' as const, priority: 0.7 },
    ...blogSlugs.map((slug) => ({
      url: `${base}/blog/${slug}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    })),
  ];

  // Service filter pages (12 original + 3 new specialty-driven)
  const services = [
    'mobile-hairdresser', 'balayage-specialist', 'curly-hair-specialist', 'colour-correction', 'barber', 'bridal-hair',
    'kids-hairdresser', 'mens-haircut', 'ladies-cut', 'hair-extensions', 'japanese-hairdresser', 'korean-hair-salon', 'wedding-hair',
    'colour-specialist', 'keratin-treatment', 'highlights',
  ];
  const servicePages: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${base}/services/${s}`,
    lastModified: dataUpdated,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  // About page
  const aboutPage: MetadataRoute.Sitemap = [
    { url: `${base}/about`, lastModified: CONTENT_UPDATED, changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  // High-volume "near me" landing pages
  const nearMePages: MetadataRoute.Sitemap = [
    { url: `${base}/barber-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/hairdresser-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/haircut-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/mobile-hairdresser-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/cheap-haircut-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/hair-extensions-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/blow-dry-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/hair-colourist-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/kids-haircut-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/best-hair-salon-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/balayage-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/korean-hair-salon-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${base}/curly-hair-salon-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${base}/mens-haircuts-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/womens-haircut-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/hair-stylist-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/hair-salon-open-now`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/hair-color-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/hairdresser-open-sunday`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/hair-spa-near-me`, lastModified: dataUpdated, changeFrequency: 'weekly' as const, priority: 0.8 },
  ];

  // Suburb-pivot routes — /hairdresser/[suburb] + /barber/[suburb] + /at-home-hairdresser/[suburb].
  // /hair-salon/[suburb] now 308s to /hairdresser/[suburb] (near-duplicate, 2026-11-02).
  // A pivot is listed only when the suburb has enough matching listings; the
  // page noindexes itself otherwise (lib/pivotCoverage).
  const suburbPivotRoutes: SuburbPivotRoute[] = ['hairdresser', 'barber', 'at-home-hairdresser'];
  const suburbPivotPages: MetadataRoute.Sitemap = TOP_SUBURBS.flatMap((s) =>
    suburbPivotRoutes
      .filter((route) => suburbPivotIndexable(allBusinessRows, route, s.state, s.name))
      .map((route) => ({
        url: `${base}/${route}/${s.slug}`,
        lastModified: dataUpdated,
        changeFrequency: 'weekly' as const,
        priority: 0.82,
      }))
  );

  return [...staticPages, ...statePages, ...stateStatsPages, ...regionPages, ...suburbPages, ...businessPages, ...salonDirectoryPages, ...cityGuidePages, ...suburbPivotPages, ...nearMePages, ...blogPages, ...servicePages, ...aboutPage];
}
