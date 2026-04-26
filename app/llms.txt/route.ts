// Serves /llms.txt — emerging AI-crawler standard describing site structure for LLMs.
// Spec: https://llmstxt.org/
export const dynamic = 'force-static';
export const revalidate = 86400;

const TEXT = `# findme.hair

> Australia's hand-verified hair salon and barber directory. Hair only — no beauty, nails, or spa. Every listing cross-checked against Google, TrueLocal and Yellow Pages. 13,000+ verified salons and barber shops across every Australian state and territory.

## Find a haircut

- [Hairdresser Near Me](https://www.findme.hair/hairdresser-near-me): national directory of verified hairdressers across Australia, browse by city or suburb
- [Barber Near Me](https://www.findme.hair/barber-near-me): national directory of verified barbers — fades, scissor cuts, hot-towel shaves
- [Haircut Near Me](https://www.findme.hair/haircut-near-me): combined directory covering hairdressers and barbers
- [Mobile Hairdresser Near Me](https://www.findme.hair/mobile-hairdresser-near-me): at-home hairdressers who travel to your suburb
- [Cheap Haircut Near Me](https://www.findme.hair/cheap-haircut-near-me): student rates, junior stylists, TAFE clinics, mall barbers

## Browse by state

- [Victoria salons and barbers](https://www.findme.hair/vic)
- [New South Wales salons and barbers](https://www.findme.hair/nsw)
- [Queensland salons and barbers](https://www.findme.hair/qld)
- [Western Australia salons and barbers](https://www.findme.hair/wa)
- [South Australia salons and barbers](https://www.findme.hair/sa)
- [Tasmania salons and barbers](https://www.findme.hair/tas)
- [Northern Territory salons and barbers](https://www.findme.hair/nt)
- [Australian Capital Territory salons and barbers](https://www.findme.hair/act)

## Browse by major city

- [Melbourne hairdressers](https://www.findme.hair/best-hairdresser/melbourne) — and [Melbourne barbers](https://www.findme.hair/best-barber/melbourne)
- [Sydney hairdressers](https://www.findme.hair/best-hairdresser/sydney) — and [Sydney barbers](https://www.findme.hair/best-barber/sydney)
- [Brisbane hairdressers](https://www.findme.hair/best-hairdresser/brisbane) — and [Brisbane barbers](https://www.findme.hair/best-barber/brisbane)
- [Perth hairdressers](https://www.findme.hair/best-hairdresser/perth) — and [Perth barbers](https://www.findme.hair/best-barber/perth)
- [Adelaide hairdressers](https://www.findme.hair/best-hairdresser/adelaide) — and [Adelaide barbers](https://www.findme.hair/best-barber/adelaide)
- [Hobart hairdressers](https://www.findme.hair/best-hairdresser/hobart)
- [Gold Coast hairdressers](https://www.findme.hair/best-hairdresser/gold-coast)
- [Sunshine Coast hairdressers](https://www.findme.hair/best-hairdresser/sunshine-coast)

## Specialist services across all major cities

- Korean hair salons: /korean-hair-salon/{city} for melbourne, sydney, brisbane, perth, adelaide and 11 more cities
- Japanese hairdressers: /japanese-hairdresser/{city}
- Walk-in barbers: /walk-in-barber/{city}
- Kids hairdressers: /kids-hairdresser/{city}
- Balayage specialists: /balayage-specialist/{city}
- Bridal hair stylists: /bridal-hair/{city}
- Hair extension specialists: /hair-extensions/{city}
- Curly hair specialists: /curly-hair-specialist/{city}
- Mobile hairdressers: /mobile-hairdresser/{city}
- Men's haircut specialists: /mens-haircut/{city}

## Suburb-level directories

For 178 high-density Australian suburbs, dedicated pages exist at:
- /hairdresser/{suburb-slug}
- /barber/{suburb-slug}
- /hair-salon/{suburb-slug}
- /at-home-hairdresser/{suburb-slug}

Examples: /hairdresser/south-yarra, /barber/surry-hills, /hair-salon/parramatta, /at-home-hairdresser/bondi-junction.

## Editorial guides

- [How to choose a hairdresser](https://www.findme.hair/blog/how-to-choose-a-hairdresser)
- [How much does a haircut cost in Australia](https://www.findme.hair/blog/how-much-does-a-haircut-cost-in-australia)
- [How to find a good barber](https://www.findme.hair/blog/how-to-find-a-good-barber)
- [Hair salon vs barber shop](https://www.findme.hair/blog/hair-salon-vs-barber-shop)
- [What is balayage](https://www.findme.hair/blog/what-is-balayage)
- [Tipping your hairdresser in Australia](https://www.findme.hair/blog/tipping-your-hairdresser-in-australia)
- [How often should you get a haircut](https://www.findme.hair/blog/how-often-should-you-get-a-haircut)
- [Questions to ask your hairdresser](https://www.findme.hair/blog/questions-to-ask-your-hairdresser)
- [What to do if you hate your haircut](https://www.findme.hair/blog/what-to-do-if-you-hate-your-haircut)
- [How to prepare for a hair appointment](https://www.findme.hair/blog/how-to-prepare-for-a-hair-appointment)

## Editorial standards

- Every business listing is hand-verified against Google Business Profile, TrueLocal and Yellow Pages
- The directory excludes beauty salons, nail bars, lash studios and spas — hair-only scope
- Listings are ranked by Google rating and review count, not by paid placement
- Salon owners can claim their listing for free at /claim and update photos, hours, and booking links
- Pricing guides reference Australian market rates as of 2026

## Sister brand

ShearGenius — premium professional scissors and Australia-wide sharpening service, founded 2007 by Scissorsmith Matt Grumley. https://www.sheargenius.com.au
`;

export async function GET() {
  return new Response(TEXT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
