import type { MetadataRoute } from 'next';
import { sitemapEntries } from '@/lib/sitemapEntries';

// Full sitemap: every indexable URL, for Bing and other engines. robots.txt points
// Google at /sitemap-core.xml instead (see lib/sitemapEntries.ts).
// Drop force-dynamic so Next.js can serve the cached sitemap across requests
// within the revalidate window. Audit row 8415761b.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries();
}
