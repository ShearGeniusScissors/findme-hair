import type { MetadataRoute } from 'next';
import { supabaseServerAnon } from '@/lib/supabase';

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
  ];

  // State pages
  const states = ['vic', 'nsw', 'qld', 'wa', 'sa', 'tas', 'nt', 'act'];
  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${base}/${s}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // Region pages — fetch all regions
  const { data: regions } = await supabase.from('regions').select('slug, state');
  const regionPages: MetadataRoute.Sitemap = (regions ?? []).map((r) => ({
    url: `${base}/search?region=${r.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Suburb pages — fetch all suburbs with their region
  const { data: suburbs } = await supabase
    .from('suburbs')
    .select('slug, state, region_id, regions!inner(slug)')
    .limit(10000);

  const suburbPages: MetadataRoute.Sitemap = (suburbs ?? []).map((s: any) => ({
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

  return [...staticPages, ...statePages, ...regionPages, ...suburbPages, ...businessPages];
}
