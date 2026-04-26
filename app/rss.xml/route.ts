// Serves /rss.xml — content syndication feed for findme.hair editorial guides.
export const dynamic = 'force-static';
export const revalidate = 86400;

const BASE = 'https://www.findme.hair';

const POSTS: Array<{ slug: string; title: string; description: string; pubDate: string }> = [
  { slug: 'how-to-choose-a-hairdresser', title: 'How to Choose the Right Hairdresser for You', description: 'A practical guide to finding the right hairdresser based on your hair type, budget, and style goals.', pubDate: '2026-04-13' },
  { slug: 'hair-salon-vs-barber-shop', title: 'Hair Salon vs Barber Shop — Which One Should You Choose?', description: 'The differences between hair salons and barber shops, and how to choose the right one.', pubDate: '2026-04-13' },
  { slug: 'questions-to-ask-your-hairdresser', title: 'Questions to Ask Your Hairdresser Before a Cut or Colour', description: 'The essential questions to ask before your appointment to get the result you want.', pubDate: '2026-04-13' },
  { slug: 'how-much-does-a-haircut-cost-in-australia', title: 'How Much Does a Haircut Cost in Australia?', description: 'A breakdown of haircut, colour, and styling costs across Australian salons and barbers.', pubDate: '2026-04-13' },
  { slug: 'what-is-balayage', title: 'What is Balayage? An Australian Guide', description: 'Everything you need to know about balayage colour technique, costs, and maintenance.', pubDate: '2026-04-13' },
  { slug: 'how-to-find-a-good-barber', title: 'How to Find a Good Barber', description: 'The signs of a quality barber and how to find one near you.', pubDate: '2026-04-13' },
  { slug: 'tipping-your-hairdresser-in-australia', title: 'Tipping Your Hairdresser in Australia', description: 'The Australian etiquette for tipping at salons and barber shops.', pubDate: '2026-04-13' },
  { slug: 'how-often-should-you-get-a-haircut', title: 'How Often Should You Get a Haircut?', description: 'Recommended haircut frequency by hair length and style.', pubDate: '2026-04-13' },
  { slug: 'what-to-do-if-you-hate-your-haircut', title: 'What to Do If You Hate Your Haircut', description: 'How to handle a bad haircut and what to ask for to fix it.', pubDate: '2026-04-13' },
  { slug: 'how-to-prepare-for-a-hair-appointment', title: 'How to Prepare for a Hair Appointment', description: 'Practical tips to get the most from your salon visit.', pubDate: '2026-04-13' },
];

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

export async function GET() {
  const rfc822 = (date: string) => new Date(date).toUTCString();
  const lastBuildDate = new Date().toUTCString();

  const items = POSTS.map((p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${BASE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${BASE}/blog/${p.slug}</guid>
      <description>${escapeXml(p.description)}</description>
      <pubDate>${rfc822(p.pubDate)}</pubDate>
      <author>editorial@findme.hair (findme.hair editorial team)</author>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>findme.hair Editorial Blog</title>
    <link>${BASE}/blog</link>
    <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Editorial guides on Australian hairdressing, barbering, pricing, and salon selection from findme.hair — Australia's hand-verified hair salon and barber directory.</description>
    <language>en-AU</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>findme.hair</generator>
    <copyright>findme.hair, ${new Date().getFullYear()}</copyright>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
