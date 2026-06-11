import type { Metadata } from 'next';
import { stripMarkdown } from '@/lib/seoMeta';
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

// City list mirrors /best-hairdresser/[city] for cross-link symmetry; suburb lists
// are tilted slightly toward CBD / inner-ring areas where barber shops cluster.
const CITIES: CityConfig[] = [
  {
    name: 'Melbourne',
    slug: 'melbourne',
    state: 'VIC',
    suburbs: ['melbourne', 'fitzroy', 'collingwood', 'richmond', 'carlton', 'brunswick', 'prahran', 'south yarra', 'st kilda', 'windsor'],
    description: 'Melbourne\'s barber scene runs the widest stylistic range of any Australian city. The CBD trades on speed, walk-in availability, and convenience — expect to be in and out in 25 minutes with a $40-55 cut. Fitzroy, Collingwood and Brunswick lean into the old-school traditional barber revival — straight razors, hot-towel shaves, leather aprons, $55-75 for the full experience. South Yarra and Prahran skew premium grooming-studio: appointment-only chairs, $80-120, often with espresso on arrival. Richmond and Cremorne are home to most of Melbourne\'s fade specialists. Brunswick, Northcote and Coburg host strong Mediterranean and Middle-Eastern barber traditions. Footscray, Sunshine and the Western suburbs concentrate Vietnamese and Eastern European barbers with strong skin-fade depth and very competitive pricing. Sunday opening is more common in Melbourne than anywhere else in Australia.',
  },
  {
    name: 'Sydney',
    slug: 'sydney',
    state: 'NSW',
    suburbs: ['sydney', 'surry hills', 'newtown', 'paddington', 'darlinghurst', 'bondi', 'manly', 'balmain', 'redfern', 'leichhardt'],
    description: 'Sydney\'s barber market has more depth and price range than any other Australian city. The CBD hosts the corporate-fast end — sharp cuts in 30 minutes, $45-65, often with Sunday openings. Surry Hills and Newtown lead the city for traditional and editorial work. Paddington and Bondi lean premium grooming-studio — appointment-led, $70-110, beard work and skin treatments on the menu. Manly and the Northern Beaches run beach-casual with strong texture-cut and surfer-fade depth. Parramatta, Bankstown and the Western Suburbs concentrate the city\'s Lebanese, Iraqi and Pakistani barber traditions — often the fastest, sharpest skin fades in the country at half the Eastern Suburbs price. The Eastwood/Chatswood corridor hosts Korean precision-cut specialists. Sydney is the easiest Australian city to find a same-day walk-in barber, with the highest density of shops per capita.',
  },
  {
    name: 'Brisbane',
    slug: 'brisbane',
    state: 'QLD',
    suburbs: ['brisbane', 'fortitude valley', 'south brisbane', 'west end', 'paddington', 'new farm', 'bulimba', 'woolloongabba', 'spring hill', 'milton'],
    description: 'Brisbane\'s barber culture exploded over the last decade. Fortitude Valley and West End are the modern epicentres — boutique shops, owner-operators, full grooming menus, $55-85 for a cut. New Farm and Bulimba lean more premium, with appointment-led studios that match anything in Sydney for quality. The CBD hosts the convenience end and a few long-running heritage barbers serving city professionals. Toowong, Indooroopilly and the western suburbs run more family-volume; Logan and the southern suburbs concentrate Brisbane\'s Pacific Islander, Maori and African barber depth. The subtropical climate shapes the work: heavier on beard maintenance, very strong fade-and-trim hybrid demand for short manageable cuts. Brisbane barbers consistently hold the highest average Google rating of any state capital — 4.75/5.0 across our 700+ active listings. Pricing tracks 15-25% below Sydney: $40-55 fast cut, $55-85 full experience.',
  },
  {
    name: 'Perth',
    slug: 'perth',
    state: 'WA',
    suburbs: ['perth', 'subiaco', 'leederville', 'fremantle', 'mount lawley', 'northbridge', 'victoria park', 'claremont', 'east perth', 'west perth'],
    description: 'Perth\'s barber market is denser than the city\'s size suggests — 386 active barber shops across Greater Perth. Mount Lawley and Leederville anchor the boutique end with modern shops, often with strong tattoo-culture overlap. Subiaco and Fremantle host the heritage shops — some with continuous trading histories of fifty-plus years, where the chairs are still operated by the same families. Northbridge runs more late-night-friendly and student-oriented. The northern suburbs (Joondalup, Wanneroo, Hillarys) trade in volume family barbers and strong fade depth. The southern suburbs (Cockburn, Rockingham, Mandurah) concentrate the FIFO/mining-worker market with practical, fast cuts. Pricing tracks Brisbane: $40-55 fast, $60-90 full experience. Walk-in availability is consistently better than any East-Coast capital — if you\'ve just landed and need a haircut today, Perth is the easiest option.',
  },
  {
    name: 'Adelaide',
    slug: 'adelaide',
    state: 'SA',
    suburbs: ['adelaide', 'norwood', 'unley', 'glenelg', 'prospect', 'hyde park', 'north adelaide', 'burnside', 'kent town', 'stepney'],
    description: 'Adelaide\'s barber market is the best-kept secret on the east-coast circuit. The CBD still has walk-in shops charging $35 for a clean cut — a price point that effectively no longer exists in Sydney or Melbourne. Norwood and Unley host the boutique end with editorial-grade shops that punch well above Adelaide\'s quiet reputation. Glenelg and Henley Beach lean beach-casual. Prospect and Hyde Park concentrate alternative and queer-friendly shops. Italian-Australian and Greek-Australian barber traditions are unusually strong here — several shops in Prospect, Norwood and the city centre have been continuously operated by the same families for forty-plus years. Adelaide also has one of the highest concentrations of Sikh and Punjabi-trained barbers in the country, particularly in the western and northern suburbs. Pricing: $35-55 fast cut, $55-80 premium. Senior barbers in Adelaide quietly rival the Sydney elite for technical fade work, at materially lower prices.',
  },
  {
    name: 'Hobart',
    slug: 'hobart',
    state: 'TAS',
    suburbs: ['hobart', 'north hobart', 'battery point', 'sandy bay', 'new town', 'moonah', 'glenorchy', 'kingston', 'bellerive', 'rosny'],
    description: 'Hobart\'s barber market is small enough that the senior operators are personally known to most regulars. North Hobart and Sandy Bay host the established names — owner-operators with twenty-plus years of continuous trading. The CBD hosts a tight cluster of walk-in shops serving the tourist trade. Battery Point and West Hobart skew traditional and old-money. The Eastern Shore (Bellerive, Lindisfarne, Howrah, Warrane) has a quietly growing scene of newer-generation shops serving the suburban shift away from CBD bookings. Pricing in Hobart is the lowest of any state capital: $30-45 standard cut, $45-65 premium. Walk-in availability is universally good outside the December tourist peak.',
  },
  {
    name: 'Darwin',
    slug: 'darwin',
    state: 'NT',
    suburbs: ['darwin', 'stuart park', 'parap', 'fannie bay', 'nightcliff', 'casuarina', 'palmerston', 'rapid creek', 'woolner', 'larrakeyah'],
    description: 'Darwin\'s barber market is shaped by tropical heat, a defence-force population, and a transient working-age demographic. The CBD hosts the volume operators with strong walk-in availability and military-regulation cuts on the menu. Stuart Park, Parap and Nightcliff anchor the established side. Casuarina and Palmerston serve the suburban catchment. Several Darwin barbers have genuine depth in Afro-textured, Pacific Islander and Asian hair — a market reality of one of the most diverse populations of any Australian capital. The barber scene runs strongly through the dry season (May-Sept) when the city population swells with tourists and visitors. Pricing: $30-45 standard cut, $45-60 premium. Beard maintenance demand is unusually high — Darwin\'s outdoor lifestyle and FIFO worker base supports that.',
  },
  {
    name: 'Canberra',
    slug: 'canberra',
    state: 'ACT',
    suburbs: ['canberra', 'braddon', 'kingston', 'manuka', 'civic', 'dickson', 'belconnen', 'woden', 'fyshwick', 'phillip'],
    description: 'Canberra has the highest barber-to-salon ratio of any non-NT Australian capital — a structural function of the public service and Defence Force male population. Braddon, Kingston and Manuka anchor the boutique-barber end with modern shops and full grooming menus. Civic concentrates the convenience walk-in trade. Belconnen, Tuggeranong and the town centres serve the suburban catchment with strong fade and clipper depth. The Defence Force population drives consistent demand for traditional regulation cuts; the public service market drives demand for conservative-but-sharp daily cuts. Several Canberra barbers have genuine reputation for hot-towel shaves, beard sculpting and straight-razor work. Pricing: $35-55 standard cut, $55-80 premium. Walk-in availability is consistently good outside the lunchtime rush.',
  },
  // Regional cities
  {
    name: 'Ballarat',
    slug: 'ballarat',
    state: 'VIC',
    suburbs: ['ballarat', 'ballarat central', 'ballarat east', 'ballarat north', 'wendouree', 'lake wendouree', 'alfredton', 'mount pleasant', 'sebastopol', 'buninyong'],
    description: 'Ballarat\'s barber scene runs deeper than any other Victorian regional city. Sturt Street and Bridge Mall host the established names — Bricktop Barbershop is the one consistently surfaced in local recommendation threads, with several other shops on the same blocks running continuous trading histories of twenty-plus years. The newer suburbs (Wendouree, Alfredton, Mount Pleasant, Sebastopol) host a parallel younger generation of modern grooming studios serving the growing post-Melbourne-overflow population. The barber scene benefits structurally from Federation University\'s student population and the city\'s consistent population growth. Pricing is the most affordable in Victoria after Mildura: $30-45 standard cut, $45-65 full grooming experience. Walk-in availability remains realistic on Saturday mornings — something that has effectively ceased to exist in central Melbourne.',
  },
  {
    name: 'Geelong',
    slug: 'geelong',
    state: 'VIC',
    suburbs: ['geelong', 'geelong west', 'newtown', 'belmont', 'highton', 'pakington street', 'ocean grove', 'leopold', 'corio', 'grovedale'],
    description: 'Geelong\'s barber market has roughly tripled in active operator count over the last decade, riding the same Melbourne-overflow growth that\'s reshaped the city. Pakington Street is the established boutique end — modern shops, full grooming menus, often run by former Melbourne barbers who moved down for cheaper rent. The CBD hosts the walk-in volume shops; the western and northern suburbs (Norlane, Corio, Bell Park) concentrate the family barber market with strong Italian and Macedonian heritage shops. Belmont and Highton serve the southern suburbs. Pricing tracks 20-30% below central Melbourne: $35-50 standard cut, $50-70 premium. Geelong is one of the easiest cities in Victoria to find a same-week appointment with a senior barber.',
  },
  {
    name: 'Newcastle',
    slug: 'newcastle',
    state: 'NSW',
    suburbs: ['newcastle', 'newcastle east', 'hamilton', 'charlestown', 'lambton', 'merewether', 'adamstown', 'the junction', 'darby street', 'beaumont street'],
    description: 'Newcastle\'s barber market reflects the city\'s split between coastal lifestyle and serious working population. The Darby Street precinct hosts the creative shops — modern, full-grooming menus, tattoo-culture overlap. Hamilton\'s Beaumont Street strip and the East-end (Merewether, The Junction, Cooks Hill) host the established traditional shops, several with continuous trading histories of decades. Charlestown, Kotara and the western suburbs concentrate volume family barbers. The Pacific Islander and Maori community has strong barber depth in Mayfield and Wallsend — particularly for skin fades and Afro-textured work. Pricing: $35-50 standard cut, $50-70 premium. Walk-in availability in central Newcastle is among the best of any east-coast city.',
  },
  {
    name: 'Wollongong',
    slug: 'wollongong',
    state: 'NSW',
    suburbs: ['wollongong', 'fairy meadow', 'corrimal', 'thirroul', 'figtree', 'shellharbour', 'unanderra', 'dapto', 'bulli', 'austinmer'],
    description: 'Wollongong\'s barber market reflects a city halfway between coastal lifestyle and serious working population. The CBD hosts the convenience walk-in operators and a small cluster of premium grooming studios. The Northern Suburbs (Thirroul, Bulli, Austinmer, Coledale) run beachier — surfer-fade depth, low-maintenance cuts. South to Warrawong, Port Kembla and Dapto, the market shifts to volume family barbers with strong Italian, Macedonian and Lebanese heritage shops. The University of Wollongong\'s student catchment keeps a budget walk-in tier alive in the city centre. Pricing sits noticeably below Sydney: $30-45 standard cut, $45-65 premium. A growing number of Sydney-trained barbers have moved south, which means the top end of the Wollongong market is now genuinely competitive with anything you\'d find in the Eastern Suburbs.',
  },
  {
    name: 'Gold Coast',
    slug: 'gold-coast',
    state: 'QLD',
    suburbs: ['gold coast', 'surfers paradise', 'broadbeach', 'burleigh heads', 'palm beach', 'coolangatta', 'robina', 'southport', 'mermaid beach', 'currumbin'],
    description: 'The Gold Coast barber market trades in two distinct cultures. Burleigh Heads and Broadbeach host the premium grooming-studio end — boutique, appointment-led, tattoo-culture aesthetic, $65-90 for the full experience. Surfers Paradise concentrates the tourist-volume shops with strong walk-in availability and English/Japanese/Mandarin signage. Robina, Helensvale and Nerang serve the family suburban market with strong fade and clipper depth. Southport and Coomera lean budget-end. Coolangatta runs more surf-textured, with strong overlap into surf-shop culture. Pricing varies more by suburb than any other Australian city — $30 for a fast cut in Robina, $90 for a hot-towel-shave session in Burleigh. The Gold Coast also has unusually strong demand for beard maintenance and full grooming compared to other QLD cities — driven by the lifestyle-migrant demographic and the year-round outdoor culture.',
  },
  {
    name: 'Sunshine Coast',
    slug: 'sunshine-coast',
    state: 'QLD',
    suburbs: ['sunshine coast', 'maroochydore', 'noosa', 'mooloolaba', 'caloundra', 'buderim', 'nambour', 'coolum', 'noosaville', 'alexandra headland'],
    description: 'The Sunshine Coast barber market is structurally bimodal — Noosa anchors the premium end with prices and quality matching inner-Sydney suburbs, while everywhere from Maroochydore down to Caloundra runs noticeably more affordable. Noosa Heads and Noosaville host the editorial-end shops — appointment-led, tattoo-culture overlap, full grooming menus, $70-100. Mooloolaba, Buderim and Sippy Downs serve the in-between market. Maroochydore is the volume centre. Caloundra has the strongest classic-barber depth on the Coast, with several Greek and Italian heritage shops on continuous trading histories of forty-plus years. The hinterland villages (Eumundi, Maleny) host a small cluster of premium beard and grooming specialists. Pricing varies wildly by suburb: $35 for a fast cut in Maroochydore, $90 for a hot-towel-shave in Noosa.',
  },
  {
    name: 'Townsville',
    slug: 'townsville',
    state: 'QLD',
    suburbs: ['townsville', 'north ward', 'south townsville', 'cranbrook', 'kirwan', 'aitkenvale', 'hyde park', 'pimlico', 'castletown', 'belgian gardens'],
    description: 'Townsville anchors the entire North Queensland barber market — the closest comparable city is 350km in either direction. The Palmer Street precinct and the CBD host the walk-in volume shops and a small cluster of premium grooming studios. Aitkenvale and Kirwan concentrate the family-suburban market. The military and FIFO worker population shapes demand structurally — Townsville barbers are deep on defence-regulation cuts, beard maintenance, and quick-turnaround service. Several shops have genuinely strong reputations for skin fades and texture work; the tropical climate keeps short manageable cuts in consistent demand year-round. Pricing tracks regional QLD: $30-40 standard cut, $45-60 premium. Walk-in availability is universally good.',
  },
  {
    name: 'Cairns',
    slug: 'cairns',
    state: 'QLD',
    suburbs: ['cairns', 'cairns north', 'edge hill', 'parramatta park', 'manunda', 'westcourt', 'earlville', 'smithfield', 'palm cove', 'trinity beach'],
    description: 'Cairns is the highest-humidity barber market in Australia, and the senior operators know it cold. Every Cairns barber has tested products and techniques that hold up under year-round 70%+ humidity. The Esplanade and Shields Street/Lake Street precinct host the established CBD shops, often with multilingual service for the tourist trade (Japanese, Mandarin and Korean are common). Edge Hill and Cairns North lean boutique. Smithfield, Trinity Beach, Palm Cove and the northern beaches run more resort-luxury with strong destination-wedding groom-prep demand. Cairns also has the highest density of Indian and Sri Lankan barber-trained operators in Australia, particularly in the central and Manunda suburbs — strong straight-razor and traditional shave depth. Pricing: $30-50 standard cut, $50-75 premium.',
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

  const path = `https://www.findme.hair/best-barber/${config.slug}`;
  const title = `Best Barbers in ${config.name} (${new Date().getFullYear()}) — findme.hair`;
  const description = `Find the best barber shops in ${config.name}, ${stateName(config.state)}. Top-rated barbers with verified Google reviews, hours, fade specialists and traditional shops.`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        'en-AU': path,
        'x-default': path,
      },
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: 'findme.hair',
      locale: 'en_AU',
      type: 'article',
      images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}

async function getTopBarbers(config: CityConfig): Promise<Business[]> {
  const supabase = supabaseServerInternal();
  const suburbFilters = config.suburbs.map((s) => `suburb.ilike.${s}`).join(',');
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .eq('state', config.state)
    .in('business_type', ['barber', 'unisex']) // include unisex shops that take walk-in mens cuts
    .or(suburbFilters)
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false })
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .limit(20);
  return (data ?? []) as Business[];
}

export default async function BestBarberCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const config = CITIES.find((c) => c.slug === city);
  if (!config) notFound();

  const businesses = await getTopBarbers(config);
  const fullState = stateName(config.state);
  const year = new Date().getFullYear();

  // Split for content section
  const pureBarbers = businesses.filter((b) => b.business_type === 'barber');
  const unisex = businesses.filter((b) => b.business_type === 'unisex');

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: fullState, item: `https://www.findme.hair/${config.state.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: `Best Barbers in ${config.name}` },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Best Barbers in ${config.name} (${year})`,
        description: `Top-rated barber shops in ${config.name}, ${fullState}.`,
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        publisher: {
          '@type': 'Organization',
          name: 'findme.hair',
          url: 'https://www.findme.hair',
        },
      }} />
      {businesses.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Best Barbers in ${config.name}`,
          numberOfItems: businesses.length,
          itemListElement: businesses.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `https://www.findme.hair/salon/${b.slug}`,
            name: b.name,
          })),
        }} />
      )}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Who are the best barbers in ${config.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `findme.hair lists the top-rated barbers in ${config.name} based on verified Google reviews. ${businesses.length > 0 ? `Top rated include ${businesses.slice(0, 3).map((b) => b.name).join(', ')}.` : `Browse our ${config.name} listings for the latest recommendations.`}` },
          },
          {
            '@type': 'Question',
            name: `How much does a barber haircut cost in ${config.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `Barber haircuts in ${config.name} typically range from $25 for a basic short-back-and-sides up to $60 for a premium fade with beard trim. Most barbers also offer hot-towel shaves for $35-50. Walk-in rates are usually lower than appointment-only shops.` },
          },
          {
            '@type': 'Question',
            name: `What's the best suburb for barbers in ${config.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `The most popular suburbs for barbers in ${config.name} include ${config.suburbs.slice(0, 5).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}. Each area has its own character — from boutique grooming studios to traditional family-run shops.` },
          },
          {
            '@type': 'Question',
            name: `Do barbers in ${config.name} offer beard trims and shaves?`,
            acceptedAnswer: { '@type': 'Answer', text: `Yes — most barbers in ${config.name} offer beard trims (typically $15-25) and traditional hot-towel shaves ($35-50). Premium shops in the CBD and inner suburbs also offer beard sculpting, line-ups, and beard colour services.` },
          },
        ],
      }} />

      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <ChevronIcon />
            <Link href={`/${config.state.toLowerCase()}`} className="hover:text-[var(--color-gold-dark)]">
              {fullState}
            </Link>
            <ChevronIcon />
            <span className="text-[var(--color-ink)] font-medium">Best Barbers in {config.name}</span>
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
            Best Barbers in {config.name} ({year})
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
              We&rsquo;re still building our {config.name} barber listings. Check back soon.
            </p>
          </div>
        )}

        {/* Notes from the field — editorial commentary on top picks.
            AI-citation bait: ChatGPT cites editorial roundups + named-barber
            commentary, never directory list views. */}
        {businesses.length >= 3 && (
          <section className="mt-14 card p-8">
            <p className="text-editorial-overline mb-3">Notes from the field</p>
            <h2 className="text-xl text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
              Who we&rsquo;d send a friend to in {config.name}
            </h2>
            <p className="mt-3 text-sm text-[var(--color-ink-light)] leading-relaxed">
              Picks from the top of {config.name}&rsquo;s {businesses.length}-strong list of hand-verified barbers and barber shops on findme.hair. Ranked by Google rating and review depth, never paid placement.
            </p>
            <div className="mt-6 space-y-5">
              {businesses.slice(0, 5).map((b) => {
                const rating = typeof b.google_rating === 'number' ? b.google_rating.toFixed(1) : null;
                const reviews = typeof b.google_review_count === 'number' ? b.google_review_count : null;
                const type = b.business_type === 'barber' ? 'barber shop' : b.business_type === 'unisex' ? 'unisex salon' : 'hair salon';
                const specialties = (b.specialties ?? []) as string[];
                const interesting = specialties.filter((s) => ['barber','mens','fade','beard','kids','keratin','curly-hair','afro'].includes(s));
                const specBlurb = interesting.length > 0 ? interesting.slice(0, 3).map((s) => s.replace(/-/g, ' ')).join(', ') : null;
                const text = b.ai_description
                  ? (() => {
                      const t = stripMarkdown(b.ai_description);
                      const stop = t.search(/[.!?]\s/);
                      return stop >= 60 && stop <= 240 ? t.slice(0, stop + 1) : t.slice(0, 220) + (t.length > 220 ? '…' : '');
                    })()
                  : `${b.name} is a verified ${type} in ${titleCase(b.suburb)}, ${fullState}.`;
                return (
                  <article key={b.id} className="border-l-2 border-[var(--color-gold)] pl-5">
                    <h3 className="text-base text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                      <Link href={`/salon/${b.slug}`} className="hover:text-[var(--color-gold-dark)]">{b.name}</Link>
                      <span className="text-sm font-normal text-[var(--color-ink-muted)]"> — {titleCase(b.suburb)}</span>
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {type}{rating && reviews ? ` · ${rating}★ across ${reviews.toLocaleString()} reviews` : ''}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-ink-light)] leading-relaxed">
                      {text}
                      {specBlurb && <span className="text-[var(--color-ink-muted)]"> Strong on {specBlurb}.</span>}
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
            How to find the best barber in {config.name}
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--color-ink-light)]">
            <p>
              Finding the right barber in {config.name} comes down to three things: the cut you want, the
              vibe you want, and how much you want to pay. Whether you&rsquo;re after a sharp fade, a classic
              scissor-over-comb, beard work, or a traditional hot-towel shave, {config.name} has specialists.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">What to look for</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Recent Google reviews</strong> — check the last 3 months, not just the lifetime rating</li>
              <li><strong>Specialty</strong> — fades, beard work, traditional cuts and curly/textured hair all need different skills</li>
              <li><strong>Walk-in vs booking</strong> — busy CBD shops are usually walk-in; appointment-only shops mean less wait but higher price</li>
              <li><strong>Hot towel + straight razor</strong> — a sign of traditional craftsmanship if those are on the menu</li>
              <li><strong>Tools</strong> — premium barbers use Japanese-steel scissors and clean their clippers between cuts</li>
            </ul>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">Tools of the trade</h3>
            <p>
              The barbers behind {config.name}&rsquo;s top-rated shops invest in their tools. Premium{' '}
              <a href="https://www.sheargenius.com.au/collections/barber-scissors" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                barber scissors
              </a>{' '}
              made from Japanese ATS-314 steel, kept{' '}
              <a href="https://www.sheargenius.com.au/pages/scissor-sharpening" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                professionally sharpened
              </a>{' '}
              every six to twelve months — that&rsquo;s what separates a $25 chop from a $60 cut you remember for weeks.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">{config.name} by the numbers</h3>
            <p>
              We currently list {businesses.length} top-rated barbers and unisex shops across {config.name}.
              {pureBarbers.length > 0 && ` ${pureBarbers.length} dedicated barbershops`}
              {unisex.length > 0 && ` and ${unisex.length} unisex shops`} made our curated list based on verified
              reviews, consistency, and local reputation.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">Popular suburbs for barbers</h3>
            <p>
              The most popular suburbs for barbers in {config.name} include{' '}
              {config.suburbs.slice(0, 5).map((s) => titleCase(s)).join(', ')}.
              Each suburb has its own character — from traditional family-run shops to modern grooming studios.
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
                ? `/barber/${slug}`
                : `/search?q=${encodeURIComponent(s)}&state=${config.state}&type=barber`;
              return (
              <Link
                key={s}
                href={href}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                {titleCase(s)}
              </Link>);
            })}
          </div>
        </section>

        {/* Cross-link to hairdresser version + other cities */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Looking for a hairdresser instead?
          </h2>
          <p className="mt-3 text-sm text-[var(--color-ink-light)]">
            Our{' '}
            <Link
              href={`/best-hairdresser/${config.slug}`}
              className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium"
            >
              best hairdressers in {config.name}
            </Link>{' '}
            guide covers women&rsquo;s and unisex salons in the same area — colour, balayage, extensions, and
            precision cutting.
          </p>
        </section>

        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Best barbers in other cities
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CITIES.filter((c) => c.slug !== config.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/best-barber/${c.slug}`}
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
