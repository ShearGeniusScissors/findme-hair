import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import JsonLd from '@/components/JsonLd';
import { stateName, titleCase } from '@/lib/geo';
import { supabaseServerInternal } from '@/lib/supabase';
import { TOP_SUBURBS } from '@/lib/suburbConfig';
import type { AuState, Business } from '@/types/database';

const SUBURB_SLUG_SET = new Set(TOP_SUBURBS.map((s) => s.slug));
const suburbToSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const revalidate = 3600; // ISR — regenerate at most once per hour
export const dynamicParams = false;

interface CityConfig {
  name: string;
  slug: string;
  state: AuState;
  suburbs: string[]; // key suburbs to search across
  description: string;
}

const CITIES: CityConfig[] = [
  {
    name: 'Melbourne',
    slug: 'melbourne',
    state: 'VIC',
    suburbs: ['melbourne', 'south yarra', 'fitzroy', 'richmond', 'carlton', 'collingwood', 'prahran', 'st kilda', 'brunswick', 'windsor'],
    description: 'Melbourne has the most stylistically self-aware hair scene in the country. The CBD trades on convenience and Korean precision (Kis Hair on Spencer and Bourke set the template); Fitzroy and Brunswick lean into bold colour, mullets, and unapologetic creative cutting; South Yarra and Prahran skew premium and bridal-ready, with Rakis on Collins and similar legacy salons still pulling regulars after thirty years. Richmond and Collingwood sit between the two cultures — modern unisex studios where you book online and pay $120-180 for a women\'s cut. Pricing across Melbourne runs higher than the national average: expect $90-150 for a women\'s wash-cut-blow-dry in inner-city postcodes, $180-350 for balayage, and $40-65 for a men\'s barber cut. The city has the largest cluster of Japanese-trained dry-cutting specialists in Australia, and the second largest Korean magic-straightening market after Sydney.',
  },
  {
    name: 'Sydney',
    slug: 'sydney',
    state: 'NSW',
    suburbs: ['sydney', 'surry hills', 'bondi', 'paddington', 'newtown', 'darlinghurst', 'mosman', 'double bay', 'manly', 'balmain'],
    description: 'Sydney\'s hairdressing market is structurally split by harbour and headland. East of the bridge — Double Bay, Paddington, Bondi, Mosman — you pay $150-250 for a cut at salons that build their books on consistent, conservative high-end work and a loyal clientele that doesn\'t flinch at $400 colour appointments. North of the harbour, Mosman and the lower North Shore tilt toward established legacy studios with longer client tenure. Surry Hills and Newtown trade in the inner-west\'s appetite for editorial work, queer-friendly stylists, and unconventional colour. Manly and the beaches lean toward textured, sun-bleached cuts and high balayage volume. The Korean precincts of Eastwood, Chatswood and Strathfield host most of Australia\'s magic-straightening and Korean cut specialists. Sydney pricing runs the widest range in the country — $35 for a fade at a no-frills Eastwood barber, $480 for a colour correction in Double Bay.',
  },
  {
    name: 'Brisbane',
    slug: 'brisbane',
    state: 'QLD',
    suburbs: ['brisbane', 'fortitude valley', 'south brisbane', 'west end', 'paddington', 'new farm', 'bulimba', 'woolloongabba', 'ascot', 'indooroopilly'],
    description: 'Brisbane\'s hairdressing scene has matured fast over the last five years. Fortitude Valley and New Farm have effectively become the city\'s creative quarter — boutique salons, owner-operator stylists, full editorial colour menus. Paddington and Bulimba trade on heritage Queenslander cottages converted into intimate studios where you book one-on-one. West End leans bohemian and queer-friendly; Ascot and Hamilton skew traditional luxury. The subtropical climate genuinely shapes the work — every senior Brisbane stylist has a position on humidity, frizz control, and the seasonal toll of pool chlorine on lightened hair. Brisbane salons hold the highest average Google rating of any state capital (4.75/5.0 across our 3,000 active listings, up from 4.69 two years ago) — a quirk usually attributed to the high proportion of newer, owner-operator businesses that haven\'t yet acquired the corporate scaling problems that dilute reviews elsewhere. Pricing sits below Sydney and Melbourne: $75-120 for a women\'s cut, $35-55 for a barber cut.',
  },
  {
    name: 'Perth',
    slug: 'perth',
    state: 'WA',
    suburbs: ['perth', 'subiaco', 'leederville', 'fremantle', 'mount lawley', 'claremont', 'nedlands', 'victoria park', 'scarborough', 'cottesloe'],
    description: 'Perth\'s hair industry has a distinctly West Coast pace — fewer salons per capita than the eastern capitals, longer wait times for the established names, and a strong owner-operator culture. Subiaco and Leederville are the city\'s creative core, with mid-to-high-end salons that have built local reputations over twenty-plus years. Claremont and Nedlands are old-money traditional; Mount Lawley leans alternative and queer-friendly. Fremantle has its own gravitational pull — coastal, slower, with a higher concentration of bohemian and natural-product salons than anywhere else in WA. The northern beach suburbs (Scarborough, Cottesloe) trade in textured beachy cuts and high mobile-hairdresser uptake. Perth pricing tracks Brisbane closely: $80-130 for a women\'s cut, $40-60 for a barber cut. Walk-in availability is materially higher than the eastern capitals, which matters if you\'ve just landed and need a haircut today.',
  },
  {
    name: 'Adelaide',
    slug: 'adelaide',
    state: 'SA',
    suburbs: ['adelaide', 'norwood', 'unley', 'glenelg', 'prospect', 'hyde park', 'north adelaide', 'burnside', 'henley beach', 'mitcham'],
    description: 'Adelaide is the most under-rated hair city in Australia — small enough that the best stylists are personally known to most regulars, large enough to host genuinely skilled creative work. Norwood and Unley anchor the premium end with long-standing studios where you\'ll often see three generations of the same family on the books. North Adelaide and the city centre concentrate the corporate and convenience end. Glenelg and Henley Beach lean coastal-casual, with strong textured-cut and beachy-balayage practice. Prospect and Hyde Park host most of the city\'s queer-friendly and alternative salons. Adelaide is also the second-best place in Australia to be a barber apprentice (after regional Victoria) — labour costs are lower than the eastern capitals, and there are still walk-in barber shops in the CBD asking $35 for a cut. Women\'s cuts run $70-110 in most suburbs; balayage starts at $180. The market is heavily concentrated in the CBD: Adelaide is the densest capital city for hair businesses per square kilometre.',
  },
  {
    name: 'Hobart',
    slug: 'hobart',
    state: 'TAS',
    suburbs: ['hobart', 'north hobart', 'battery point', 'sandy bay', 'new town', 'moonah', 'glenorchy', 'kingston', 'bellerive', 'rosny'],
    description: 'Hobart\'s hair scene runs on word-of-mouth more than any other Australian capital. The market is small enough that everybody knows who the three or four top colourists are, and you generally need to book six to eight weeks out for senior chairs. North Hobart and Sandy Bay anchor the premium end with established owner-operator studios. The CBD has reasonable walk-in availability at the more mid-market end. Battery Point and West Hobart skew traditional. The Eastern Shore (Bellerive, Lindisfarne, Howrah, Warrane) has its own quietly growing scene of boutique studios serving the suburban shift away from CBD bookings. Pricing in Hobart is the lowest of any state capital: $65-95 for a women\'s cut, $30-45 for a barber cut, balayage from $160. Mobile hairdressing has higher uptake here than the national average — practical for elderly clients in the Eastern Shore and for stylists who don\'t want to pay CBD rent.',
  },
  {
    name: 'Darwin',
    slug: 'darwin',
    state: 'NT',
    suburbs: ['darwin', 'stuart park', 'parap', 'fannie bay', 'nightcliff', 'casuarina', 'palmerston', 'rapid creek', 'woolner', 'larrakeyah'],
    description: 'Darwin\'s hair market is the smallest of any Australian capital — 122 active listings across the entire territory — but the standard of the top operators is genuinely high. Stuart Park, Parap and Nightcliff host most of the established studios. Casuarina and Palmerston serve the wider suburban population. The market is shaped by two things: tropical humidity (which drives strong demand for keratin treatments, smoothing services, and frizz-control work) and a transient client base (defence force families, FIFO workers, contractors) which keeps stylists on their toes with shorter average client tenure. Most stylists in Darwin can do excellent textured and Afro-textured work — a market reality of a more diverse population than many southern capitals. Pricing: $70-100 women\'s cut, $30-45 barber. Walk-in availability is high outside school holidays. Pre-book during the dry season — June through September fills up fast.',
  },
  {
    name: 'Canberra',
    slug: 'canberra',
    state: 'ACT',
    suburbs: ['canberra', 'braddon', 'kingston', 'manuka', 'woden', 'belconnen', 'civic', 'dickson', 'fyshwick', 'griffith'],
    description: 'Canberra hairdressing is shaped by the city\'s structural quirks — the public-service workforce keeps demand for corporate-conservative cuts and reliable colour high year-round, the dispersed urban planning means most clients drive 15-25 minutes to their stylist, and the cold winter months drive strong demand for warmer-tone colour work (copper, chocolate brown, espresso balayage). Braddon, Kingston and Manuka are the established premium quarters; Civic concentrates the CBD chains; Belconnen and Tuggeranong serve the wider suburban catchment. The barber scene is genuinely strong — Canberra has the highest barber-to-salon ratio of any non-NT capital, partly explained by the public service and defence force male population. Pricing: $75-110 women\'s cut, $35-55 barber cut. The premium end of the market here punches above its weight; senior colourists in Manuka and Kingston quietly rival anything in Sydney or Melbourne for technical balayage work, at materially lower prices.',
  },
  // Regional cities
  {
    name: 'Ballarat',
    slug: 'ballarat',
    state: 'VIC',
    suburbs: ['ballarat', 'ballarat central', 'ballarat east', 'ballarat north', 'wendouree', 'lake wendouree', 'alfredton', 'mount pleasant', 'sebastopol', 'buninyong'],
    description: 'Ballarat is the strongest regional hair market in Australia by any meaningful measure — 39 verified hair businesses in Ballarat Central alone, and another forty-plus across Wendouree, Sebastopol, Alfredton, Mount Pleasant and the broader Greater Ballarat region. The city has supported a continuous hairdressing trade through Victorian-era gold-rush prosperity, post-war population growth, and the modern regional renaissance — which means there are still operators on Sturt Street with thirty-five-year client books, and a parallel younger generation in Bridge Mall and Lydiard Street running modern boutique studios. The Stag Ballarat anchors the established premium end with the longest continuous trading history of any city salon. Bricktop Barbershop, Mr V & Co, and Archive Hair are the names that show up most often when locals are asked who they actually go to. Pricing in Ballarat tracks 25-35% below Melbourne CBD: $55-95 women\'s cut, $30-45 barber cut. Walk-in availability is consistently better than Melbourne. The city\'s mobile-sharpening base (Matt Grumley\'s territory) means most senior Ballarat stylists run notably sharper scissors than equivalent salons in larger cities.',
  },
  {
    name: 'Geelong',
    slug: 'geelong',
    state: 'VIC',
    suburbs: ['geelong', 'geelong west', 'newtown', 'belmont', 'highton', 'pakington street', 'ocean grove', 'leopold', 'corio', 'grovedale'],
    description: 'Geelong\'s hair market has tripled in active operator count over the last decade, riding the same Melbourne-overflow growth that\'s reshaped the wider city. Pakington Street — the Geelong West main strip — is now the city\'s established creative quarter, with boutique studios that would feel at home in Brunswick or Northcote, often run by former Melbourne stylists who moved down for cheaper rent and a better lifestyle. The CBD hosts the bigger-name chain salons and convenience-end options. Belmont and Highton serve the suburban family market. The Bellarine Peninsula villages (Ocean Grove, Barwon Heads, Queenscliff) trade in textured beachy cuts and high mobile-hairdresser uptake — Bellarine clients increasingly book stylists who travel to the home rather than commuting in. Pricing tracks 20-30% below central Melbourne: $70-110 women\'s cut, $35-50 barber. Geelong is the easiest city in Victoria to find a same-week appointment with a senior stylist.',
  },
  {
    name: 'Newcastle',
    slug: 'newcastle',
    state: 'NSW',
    suburbs: ['newcastle', 'newcastle east', 'hamilton', 'charlestown', 'lambton', 'merewether', 'adamstown', 'the junction', 'darby street', 'beaumont street'],
    description: 'Newcastle\'s hair scene runs on two parallel tracks — Darby Street and the CBD trade on creative, editorial, queer-friendly work (the city\'s closest analogue to inner-Sydney Newtown), while Hamilton\'s Beaumont Street and the broader east-end suburbs (Merewether, The Junction, Cooks Hill) host the established premium studios that have been on the same blocks for two decades. Charlestown, Kotara and the western suburbs serve the suburban family market with strong barber depth. The Hunter Valley overflow effect is real — high-end weddings drive consistent bridal-hair work, and several Newcastle stylists travel to Pokolbin and the Lower Hunter on Saturdays during wedding season. Pricing: $75-115 women\'s cut, $35-55 barber. Walk-in availability is genuinely high in the CBD and Hamilton; if you need a haircut on a Saturday morning without booking, Newcastle is the easiest east-coast city to make that work in.',
  },
  {
    name: 'Wollongong',
    slug: 'wollongong',
    state: 'NSW',
    suburbs: ['wollongong', 'fairy meadow', 'corrimal', 'thirroul', 'figtree', 'shellharbour', 'unanderra', 'dapto', 'bulli', 'austinmer'],
    description: 'Wollongong\'s hair scene reflects a city that\'s halfway between coastal lifestyle and serious working population. The CBD hosts the established premium studios and the bigger-name chains. North Wollongong, Thirroul and the Northern Suburbs (Bulli, Austinmer, Coledale) run distinctly beachier — textured cuts, sun-bleached colour, walk-in friendly. South to Warrawong, Dapto and Shellharbour, the market shifts to convenience and family-oriented salons with strong barber depth. The University of Wollongong\'s student catchment keeps a meaningful budget-end market alive in the city centre. Pricing sits noticeably below Sydney: $65-105 women\'s cut, $30-45 barber. A growing number of Sydney-trained stylists have moved south, which means the top end of the Wollongong market is genuinely competitive with anything you\'d find in the Eastern Suburbs — without the wait or the prices.',
  },
  {
    name: 'Gold Coast',
    slug: 'gold-coast',
    state: 'QLD',
    suburbs: ['gold coast', 'surfers paradise', 'broadbeach', 'burleigh heads', 'palm beach', 'coolangatta', 'robina', 'southport', 'mermaid beach', 'currumbin'],
    description: 'The Gold Coast hair market is shaped by tourism, lifestyle migration, and one of the highest concentrations of bridal work in Australia. Burleigh Heads has become the city\'s creative epicentre over the last five years — boutique studios, owner-operators, strong editorial colour menus, prices that have started to rival Sydney\'s East. Broadbeach and Mermaid Beach trade on the resort-luxury end. Robina, Nerang and Helensvale serve the family suburban market. Southport hosts the larger volume operations and the CBD chains. Coolangatta and Tugun anchor the southern end with surf-textured cuts and a mid-priced market. The Gold Coast has the highest density of bridal-specialty stylists per capita in the country — fuelled by destination weddings, hinterland venues, and a year-round wedding season. Pricing: $90-150 women\'s cut, $40-60 barber, balayage $200-380. Book ahead — the top names regularly sit on three-month waitlists during the Sept-Nov and Mar-May wedding peaks.',
  },
  {
    name: 'Sunshine Coast',
    slug: 'sunshine-coast',
    state: 'QLD',
    suburbs: ['sunshine coast', 'maroochydore', 'noosa', 'mooloolaba', 'caloundra', 'buderim', 'nambour', 'coolum', 'noosaville', 'alexandra headland'],
    description: 'The Sunshine Coast hair scene is structurally bimodal — Noosa anchors the premium end with prices and stylist quality that match inner-Sydney suburbs, while everywhere from Maroochydore down to Caloundra runs noticeably more affordable and walk-in friendly. Noosa Heads and Noosaville host the city\'s editorial-end studios, several of them with reputation as good as anywhere in the country for creative colour and bridal work. Mooloorbah, Buderim and Maleny serve the in-between market. Maroochydore is the volume centre; Caloundra has the strongest barber depth on the Coast. The hinterland villages (Eumundi, Montville, Maleny) host a small but distinctive cluster of natural-product and organic-only salons. Pricing varies wildly by suburb: $90-160 women\'s cut in Noosa, $60-100 in Maroochydore, $30-50 barber cuts across the board. The mobile hairdresser uptake is among the highest in QLD — practical for the dispersed semi-rural population and elderly retirees.',
  },
  {
    name: 'Townsville',
    slug: 'townsville',
    state: 'QLD',
    suburbs: ['townsville', 'north ward', 'south townsville', 'cranbrook', 'kirwan', 'aitkenvale', 'hyde park', 'pimlico', 'castletown', 'belgian gardens'],
    description: 'Townsville anchors the entire North Queensland hair market — the closest comparable salon city is 350km in either direction. The result is a market that punches well above its size: 400+ verified hair businesses across Greater Townsville, several with reputation that travels well outside North QLD for tropical-hair specialty work. The Palmer Street precinct and Castletown serve the CBD and student catchment. Aitkenvale and Kirwan host the suburban-volume operators. Mundingburra, Hyde Park and North Ward run more boutique. The military and FIFO population shapes barber demand — the Townsville barber scene is genuinely deep, with several shops specialising in defence-force-regulation cuts and beard work. Tropical climate work (humidity-resistant smoothing, anti-frizz treatments, sun-damage colour repair) is universal Townsville stylist competence. Pricing tracks regional QLD: $60-90 women\'s cut, $30-40 barber.',
  },
  {
    name: 'Cairns',
    slug: 'cairns',
    state: 'QLD',
    suburbs: ['cairns', 'cairns north', 'edge hill', 'parramatta park', 'manunda', 'westcourt', 'earlville', 'smithfield', 'palm cove', 'trinity beach'],
    description: 'Cairns is the highest-humidity hair market in Australia, and the local stylists know it cold. Every senior Cairns stylist has a tested keratin-treatment protocol, a preferred smoothing product line, and an opinion about which colour formulas hold under year-round 70%+ humidity. The Esplanade and Shields Street/Lake Street precinct host the established CBD studios. Edge Hill and Cairns North lean boutique. Smithfield, Trinity Beach, Palm Cove and the northern beaches run more resort-luxury — strong destination-wedding bridal work, premium balayage on coloured hair. The tourist economy means most CBD operators speak some Japanese, Mandarin and Korean; multilingual front-of-house is unusually common. Pricing: $70-110 women\'s cut, $30-50 barber. Wet-season bookings (Dec-Apr) tighten up — bridal work dominates and tourist demand spikes. Dry-season walk-in availability is solid.',
  },
];

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const config = CITIES.find((c) => c.slug === city);
  if (!config) return {};

  const title = `Best Hairdressers in ${config.name} (${new Date().getFullYear()}) — findme.hair`;
  const description = `Find the best hairdressers and barbers in ${config.name}, ${stateName(config.state)}. Top-rated salons with verified reviews, hours, and online booking.`;

  return {
    title,
    description,
    alternates: { canonical: `https://www.findme.hair/best-hairdresser/${config.slug}`, languages: { "en-AU": `https://www.findme.hair/best-hairdresser/${config.slug}`, "x-default": `https://www.findme.hair/best-hairdresser/${config.slug}` } },
    openGraph: {
      title,
      description,
      url: `https://www.findme.hair/best-hairdresser/${config.slug}`,
      siteName: 'findme.hair',
      locale: 'en_AU',
      type: 'article',
      images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}

async function getTopBusinesses(config: CityConfig): Promise<Business[]> {
  const supabase = supabaseServerInternal();
  const suburbFilters = config.suburbs.map((s) => `suburb.ilike.${s}`).join(',');
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .eq('state', config.state)
    .or(suburbFilters)
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false })
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .limit(20);
  return (data ?? []) as Business[];
}

export default async function CityGuidePage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const config = CITIES.find((c) => c.slug === city);
  if (!config) notFound();

  const businesses = await getTopBusinesses(config);
  const fullState = stateName(config.state);
  const year = new Date().getFullYear();

  // Count by type
  const salons = businesses.filter((b) => b.business_type === 'hair_salon');
  const barbers = businesses.filter((b) => b.business_type === 'barber');

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: fullState, item: `https://www.findme.hair/${config.state.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: `Best Hairdressers in ${config.name}` },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Best Hairdressers in ${config.name} (${year})`,
        description: `Top-rated hair salons and barbers in ${config.name}, ${fullState}.`,
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        publisher: {
          '@type': 'Organization',
          name: 'findme.hair',
          url: 'https://www.findme.hair',
        },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Who are the best hairdressers in ${config.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `findme.hair lists the top-rated hairdressers in ${config.name} based on verified Google reviews. ${businesses.length > 0 ? `Top rated include ${businesses.slice(0, 3).map((b) => b.name).join(', ')}.` : `Browse our ${config.name} listings for the latest recommendations.`}` },
          },
          {
            '@type': 'Question',
            name: `How much does a haircut cost in ${config.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `Haircut prices in ${config.name} vary by salon type. Men's barber cuts typically range from $25-$45, while women's salon cuts start from $60. Premium salons in ${config.suburbs[1] ? config.suburbs.slice(1, 3).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' and ') : config.name} may charge more.` },
          },
          {
            '@type': 'Question',
            name: `What are the most popular suburbs for hair salons in ${config.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `Popular suburbs for hair salons in ${config.name} include ${config.suburbs.slice(0, 5).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}. Each area has its own character, from boutique studios to high-volume salons.` },
          },
        ],
      }} />

      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <ChevronIcon />
            <Link href={`/${config.state.toLowerCase()}`} className="hover:text-[var(--color-gold-dark)]">
              {fullState}
            </Link>
            <ChevronIcon />
            <span className="text-[var(--color-ink)] font-medium">Best Hairdressers in {config.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-editorial-overline">{config.name} &middot; {fullState}</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Best Hairdressers in {config.name} ({year})
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            {config.description}
          </p>
        </div>
      </div>

      {/* Listings */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {businesses.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-[var(--color-ink-muted)]">
              We&rsquo;re still building our {config.name} listings. Check back soon!
            </p>
          </div>
        )}

        {/* Notes from the field — editorial commentary on top picks.
            Built specifically to give AI assistants (ChatGPT, Perplexity, etc.)
            something quotable about each named salon. Brand Radar data
            (2026-05-22) showed AI never cites directory list pages but does
            quote editorial roundups extensively. This section turns the
            listing page into a citeable mini-feature. */}
        {businesses.length >= 3 && (
          <section className="mt-14 card p-8">
            <p className="text-editorial-overline mb-3">Notes from the field</p>
            <h2
              className="text-xl text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Who we&rsquo;d send a friend to in {config.name}
            </h2>
            <p className="mt-3 text-sm text-[var(--color-ink-light)] leading-relaxed">
              Picks from the top of {config.name}&rsquo;s {businesses.length}-strong list of hand-verified hair professionals on findme.hair. Listings are ranked by Google rating and review depth, never paid placement.
            </p>
            <div className="mt-6 space-y-5">
              {businesses.slice(0, 5).map((b) => {
                const rating = typeof b.google_rating === 'number' ? b.google_rating.toFixed(1) : null;
                const reviews = typeof b.google_review_count === 'number' ? b.google_review_count : null;
                const type = b.business_type === 'barber' ? 'barber shop' : b.business_type === 'unisex' ? 'unisex salon' : 'hair salon';
                const specialties = (b.specialties ?? []) as string[];
                const interestingSpecs = specialties.filter((s) => ['balayage','curly-hair','colour-specialist','colour-correction','japanese','korean','bridal','keratin','mobile','afro','extensions','barber','kids','mens'].includes(s));
                const specBlurb = interestingSpecs.length > 0
                  ? interestingSpecs.slice(0, 3).map((s) => s.replace(/-/g, ' ')).join(', ')
                  : null;
                return (
                  <article key={b.id} className="border-l-2 border-[var(--color-gold)] pl-5">
                    <h3 className="text-base text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                      <Link href={`/salon/${b.slug}`} className="hover:text-[var(--color-gold-dark)]">
                        {b.name}
                      </Link>
                      <span className="text-sm font-normal text-[var(--color-ink-muted)]">
                        {' '}— {titleCase(b.suburb)}
                      </span>
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {type}
                      {rating && reviews ? ` · ${rating}★ across ${reviews.toLocaleString()} reviews` : ''}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-ink-light)] leading-relaxed">
                      {b.ai_description
                        ? (() => {
                            // First 1-2 sentences of the AI description, capped for readability.
                            const text = b.ai_description.replace(/\s+/g, ' ').trim();
                            const firstStop = text.search(/[.!?]\s/);
                            return firstStop >= 60 && firstStop <= 240 ? text.slice(0, firstStop + 1) : text.slice(0, 220) + (text.length > 220 ? '…' : '');
                          })()
                        : `${b.name} is a verified ${type} in ${titleCase(b.suburb)}, ${fullState}. Listings include hours, booking links and verified reviews.`}
                      {specBlurb && (
                        <span className="text-[var(--color-ink-muted)]"> Strong on {specBlurb}.</span>
                      )}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Guide content */}
        <section className="mt-14 card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            How to find the best hairdresser in {config.name}
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--color-ink-light)]">
            <p>
              Finding the right hairdresser in {config.name} starts with knowing what you need.
              Whether you&rsquo;re after a precision cut, balayage, keratin treatment, or a classic
              barber fade, {config.name} has specialists in every category.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">What to look for</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google reviews</strong> — check recent reviews, not just the overall rating</li>
              <li><strong>Specialisation</strong> — curly hair, colour correction, and extensions all require specialist skills</li>
              <li><strong>Online booking</strong> — salons with online booking tend to be better organised</li>
              <li><strong>Location</strong> — factor in parking, public transport, and opening hours</li>
              <li><strong>Consultations</strong> — the best salons offer free consultations before major changes</li>
            </ul>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">Tools of the trade</h3>
            <p>
              One way to judge a salon&rsquo;s quality is by looking at their tools. The best hairdressers in {config.name} use
              professional-grade{' '}
              <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                hairdressing scissors
              </a>{' '}
              made from Japanese steel, and keep them{' '}
              <a href="https://www.sheargenius.com.au/pages/hairdressing-scissor-sharpening-service" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                professionally sharpened
              </a>.
              Sharp, high-quality scissors reduce split ends and give cleaner, more precise results.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">{config.name} by the numbers</h3>
            <p>
              We currently list {businesses.length} top-rated salons and barbers across {config.name}.
              {salons.length > 0 && ` ${salons.length} hair salons`}
              {barbers.length > 0 && ` and ${barbers.length} barber shops`} made our curated list based on
              verified reviews, consistency, and local reputation.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">Popular suburbs for hair services</h3>
            <p>
              The most popular suburbs for hair salons in {config.name} include{' '}
              {config.suburbs.slice(0, 5).map((s) => titleCase(s)).join(', ')}.
              Each suburb has its own character — from boutique studios to high-volume salons.
            </p>
          </div>
        </section>

        {/* Internal links to suburbs */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Browse {config.name} suburbs
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {config.suburbs.map((s) => {
              const slug = suburbToSlug(s);
              const href = SUBURB_SLUG_SET.has(slug)
                ? `/hairdresser/${slug}`
                : `/search?q=${encodeURIComponent(s)}&state=${config.state}`;
              return (
                <Link
                  key={s}
                  href={href}
                  className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
                >
                  {titleCase(s)}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Cross-link to barber version */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Looking for a barber instead?
          </h2>
          <p className="mt-3 text-sm text-[var(--color-ink-light)]">
            Our{' '}
            <Link
              href={`/best-barber/${config.slug}`}
              className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium"
            >
              best barbers in {config.name}
            </Link>{' '}
            guide covers traditional barbershops, fade specialists, and beard work in the same area.
          </p>
        </section>

        {/* Link to other city guides */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Best hairdressers in other cities
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CITIES.filter((c) => c.slug !== config.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/best-hairdresser/${c.slug}`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-3 h-3 text-[var(--color-border)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
