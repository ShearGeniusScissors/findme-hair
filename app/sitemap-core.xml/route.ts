// Serves /sitemap-core.xml — the sitemap robots.txt gives Google: every guide,
// hub, service and blog page plus the salon pages checked in person or marked
// Top Rated. The full list stays at /sitemap.xml (see lib/sitemapEntries.ts).
import { sitemapEntries } from '@/lib/sitemapEntries';

export const revalidate = 86400;

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

export async function GET() {
  const entries = await sitemapEntries({ core: true });
  const urls = entries.map((e) => {
    const lastmod = e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>` : '';
    const changefreq = e.changeFrequency ? `<changefreq>${e.changeFrequency}</changefreq>` : '';
    const priority = e.priority !== undefined ? `<priority>${e.priority}</priority>` : '';
    return `<url><loc>${escapeXml(e.url)}</loc>${lastmod}${changefreq}${priority}</url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
