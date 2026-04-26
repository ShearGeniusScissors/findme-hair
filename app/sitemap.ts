import type { MetadataRoute } from 'next';
import { supabaseServerAnon } from '@/lib/supabase';
import { TOP_SUBURBS } from '@/lib/suburbConfig';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // regenerate daily

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = supabaseServerAnon();
  const base = 'https://www.findme.hair';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/for-salons`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/directory`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/press`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/trust`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/best-haircut-australia`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/stats`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
  ];

  // State pages
  const states = ['vic', 'nsw', 'qld', 'wa', 'sa', 'tas', 'nt', 'act'];
  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${base}/${s}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // Region pages — fetch all regions (default limit is 1000, paginate to be safe)
  const allRegions: any[] = [];
  let regionOffset = 0;
  while (true) {
    const { data } = await supabase.from('regions').select('slug, state').range(regionOffset, regionOffset + 999);
    if (!data || data.length === 0) break;
    allRegions.push(...data);
    if (data.length < 1000) break;
    regionOffset += 1000;
  }
  const regionPages: MetadataRoute.Sitemap = allRegions
    .filter((r) => r.state && r.slug)
    .map((r) => ({
      url: `${base}/${String(r.state).toLowerCase()}/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Suburb pages — paginate to get all suburbs
  const allSuburbs: any[] = [];
  let suburbOffset = 0;
  const suburbBatch = 1000;
  while (true) {
    const { data } = await supabase
      .from('suburbs')
      .select('slug, state, region_id, regions!inner(slug)')
      .range(suburbOffset, suburbOffset + suburbBatch - 1);
    if (!data || data.length === 0) break;
    allSuburbs.push(...data);
    if (data.length < suburbBatch) break;
    suburbOffset += suburbBatch;
  }

  const suburbPages: MetadataRoute.Sitemap = allSuburbs.map((s: any) => ({
    url: `${base}/${s.state.toLowerCase()}/${s.regions.slug}/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Business profile pages — paginate to get all slugs
  const allBusinessSlugs: string[] = [];
  let offset = 0;
  const batchSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('businesses')
      .select('slug')
      .eq('status', 'active')
      .range(offset, offset + batchSize - 1);
    if (!data || data.length === 0) break;
    allBusinessSlugs.push(...data.map((b) => b.slug));
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  const businessPages: MetadataRoute.Sitemap = allBusinessSlugs.map((slug) => ({
    url: `${base}/salon/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // City guide pages (8 capitals + 8 regional)
  const cities = [
    'melbourne', 'sydney', 'brisbane', 'perth', 'adelaide', 'hobart', 'darwin', 'canberra',
    'ballarat', 'geelong', 'newcastle', 'wollongong', 'gold-coast', 'sunshine-coast', 'townsville', 'cairns',
  ];
  // 12 city-pivot service routes × 16 cities = 192 URLs
  const cityServiceRoutes = [
    'best-hairdresser', 'best-barber', 'mobile-hairdresser',
    'korean-hair-salon', 'japanese-hairdresser', 'walk-in-barber',
    'kids-hairdresser', 'balayage-specialist', 'bridal-hair',
    'hair-extensions', 'mens-haircut', 'curly-hair-specialist',
  ];
  const cityGuidePages: MetadataRoute.Sitemap = cities.flatMap((c) =>
    cityServiceRoutes.map((route) => ({
      url: `${base}/${route}/${c}`,
      lastModified: new Date(),
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
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    ...blogSlugs.map((slug) => ({
      url: `${base}/blog/${slug}`,
      lastModified: new Date(),
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
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  // About page
  const aboutPage: MetadataRoute.Sitemap = [
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  // High-volume "near me" landing pages
  const nearMePages: MetadataRoute.Sitemap = [
    { url: `${base}/barber-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/hairdresser-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/haircut-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/mobile-hairdresser-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/cheap-haircut-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/hair-extensions-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/blow-dry-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/hair-colourist-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/kids-haircut-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/best-hair-salon-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/balayage-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${base}/korean-hair-salon-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${base}/curly-hair-salon-near-me`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ];

  // Suburb-pivot routes — /hairdresser/[suburb] + /barber/[suburb] + /hair-salon/[suburb] + /at-home-hairdresser/[suburb]
  const suburbPivotRoutes = ['hairdresser', 'barber', 'hair-salon', 'at-home-hairdresser'];
  const suburbPivotPages: MetadataRoute.Sitemap = TOP_SUBURBS.flatMap((s) =>
    suburbPivotRoutes.map((route) => ({
      url: `${base}/${route}/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.82,
    }))
  );

  return [...staticPages, ...statePages, ...regionPages, ...suburbPages, ...businessPages, ...cityGuidePages, ...suburbPivotPages, ...nearMePages, ...blogPages, ...servicePages, ...aboutPage];
}
