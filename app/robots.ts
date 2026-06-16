import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // World-class robots.txt — explicit allow-listing for AI crawlers + sitemap reference.
  //
  // Disallow list applied to EVERY group, including each named AI bot. Per the
  // robots.txt spec a named user-agent group ignores the `*` group entirely, so
  // listing a bot with only `allow: '/'` was telling it utility routes were fair
  // game — GPTBot was crawling /claim 12K times in a single spike (Vercel edge-
  // request anomaly, Jun 2026). Every group now shares the same disallow set so
  // AI crawlers still get all CONTENT (salon/suburb/state pages) but not the
  // non-indexable utility routes that only burn crawl budget + edge requests.
  //
  // Notes:
  // - '/claim' (no trailing slash) blocks the actual route; '/claim/' did not.
  // - '/search' is thin, infinite query-combo bot-bait — never meant for index.
  // - '/_next/' build chunks otherwise get pulled as if they were pages.
  const disallow = ['/admin/', '/dashboard/', '/api/', '/claim', '/search', '/_next/'];
  // Carve the dynamic OG-image endpoint back out of the /api/ block: salon
  // pages set og:image to /api/og?slug=… and robots-respecting engines (AI
  // citations, Google rich results) need to fetch it. Longest-match wins, so
  // '/api/og' (allow) beats '/api/' (disallow) while the rest of /api stays
  // blocked. Suburb pages already use the static /og-image.jpg.
  const allow = ['/', '/api/og'];

  const aiBots = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web',
    'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended',
    'Applebot-Extended', 'cohere-ai', 'Bytespider', 'Amazonbot',
    'Meta-ExternalAgent', 'CCBot', 'DuckAssistBot', 'FriendlyCrawler',
    'YouBot', 'PhindBot',
  ];

  return {
    rules: [
      // Default: allow all standard crawlers on content, block utility routes.
      { userAgent: '*', allow, disallow },
      // Explicitly allow major AI crawlers on content (some require named
      // entries) — but repeat the disallow so they don't crawl utility routes.
      ...aiBots.map((userAgent) => ({ userAgent, allow, disallow })),
    ],
    sitemap: [
      'https://www.findme.hair/sitemap.xml',
    ],
    host: 'https://www.findme.hair',
  };
}
