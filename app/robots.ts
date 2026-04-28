import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // World-class robots.txt — explicit allow-listing for AI crawlers + sitemap reference + llms.txt pointer.
  return {
    rules: [
      // Default: allow all standard crawlers
      {
        userAgent: '*',
        allow: '/',
        // /_next/* contains build chunks that crawlers (esp. Ahrefs) pull
        // as if they were pages, inflating the audit URL count.
        disallow: ['/admin/', '/dashboard/', '/api/', '/claim/', '/_next/'],
      },
      // Explicitly allow major AI crawlers (some require named entries)
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Perplexity-User', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'cohere-ai', allow: '/' },
      { userAgent: 'Bytespider', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/' },
      { userAgent: 'Meta-ExternalAgent', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      { userAgent: 'DuckAssistBot', allow: '/' },
      { userAgent: 'FriendlyCrawler', allow: '/' },
      { userAgent: 'YouBot', allow: '/' },
      { userAgent: 'PhindBot', allow: '/' },
    ],
    sitemap: [
      'https://www.findme.hair/sitemap.xml',
    ],
    host: 'https://www.findme.hair',
  };
}
