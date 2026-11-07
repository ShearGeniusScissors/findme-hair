import type { Metadata } from 'next';
import { buildCardTeaser } from '@/lib/listingCopy';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import JsonLd from '@/components/JsonLd';
import { stateName, titleCase } from '@/lib/geo';
import { supabaseServerInternal } from '@/lib/supabase';
import { TOP_SUBURBS } from '@/lib/suburbConfig';
import type { AuState, Business } from '@/types/database';

const SUBURB_SLUG_SET = new Set(TOP_SUBURBS.map((s) => s.slug));
const PUBLISHED = '2026-04-13';
const MODIFIED = '2026-11-07'; // city copy rewritten from live findme.hair data
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
    description: 'findme.hair lists 230+ active salons and barbers across the ten inner-Melbourne suburbs this guide covers. South Yarra and Richmond have 35+ listings each, the CBD has 30+, Prahran 30+, St Kilda and Brunswick 20+ each, and Windsor and Collingwood 15+ each. Nearly a quarter of them are barber shops. Among the highest-rated hair salons on Google, all at 5.0 stars, are Zayn The Organic Salon in St Kilda (300+ reviews), Valentina Ardila Hair in Richmond (290+) and Freshhh salon in the CBD (200+). For a barber, Beef\'s Barbers Richmond holds 5.0 from more than 1,100 reviews. Ratings and review counts change over time, so read recent reviews and check each salon\'s own price list before you book.',
  },
  {
    name: 'Sydney',
    slug: 'sydney',
    state: 'NSW',
    suburbs: ['sydney', 'surry hills', 'bondi', 'paddington', 'newtown', 'darlinghurst', 'mosman', 'double bay', 'manly', 'balmain'],
    description: 'This Sydney guide spans the CBD, the inner east (Surry Hills, Darlinghurst and Paddington), Double Bay and Bondi in the Eastern Suburbs, Newtown and Balmain in the inner west, Mosman on the lower North Shore and Manly on the Northern Beaches. findme.hair lists 270+ active salons and barbers across those ten suburbs: 45+ in the CBD, 35+ each in Surry Hills and Newtown, 30+ in Darlinghurst and nearly 30 in Manly. Among the highest-rated hair salons on Google, all at 5.0 stars, are New in Town Salon in Newtown (390+ reviews), 3Sixty Hair in Balmain (180+), Kim Sun Young World Square in the CBD (170+), Wakefields Hair Salon in Surry Hills (170+) and Dealis Hair Boutique in Manly (160+). For a barber, 5000 BC - Barbershop in the CBD holds 5.0 from 340+ reviews.',
  },
  {
    name: 'Brisbane',
    slug: 'brisbane',
    state: 'QLD',
    suburbs: ['brisbane', 'fortitude valley', 'south brisbane', 'west end', 'paddington', 'new farm', 'bulimba', 'woolloongabba', 'ascot', 'indooroopilly'],
    description: 'This Brisbane guide covers ten inner and middle-ring suburbs on both sides of the river: West End, South Brisbane and Woolloongabba on the south side, Fortitude Valley, New Farm, Paddington and Ascot on the north side, Bulimba to the east and Indooroopilly to the west. findme.hair lists 150+ active salons and barbers across them, and West End and Fortitude Valley have the most, with 25+ each. Among the highest-rated hair salons on Google, all at 5.0 stars, are Fgdolls hair in West End (1,500+ reviews), MABASA Hair Salon in South Brisbane (370+), STONE. The Studio in Paddington (320+) and Haven Hair in New Farm (150+). Barbers make up nearly a third of the list; The Moustachery in Paddington holds 5.0 from 900+ reviews and Johnny\'s Barber in Woolloongabba 5.0 from 870+. Brisbane summers are hot and humid, so raise frizz control and colour fade at your consultation if they matter to you.',
  },
  {
    name: 'Perth',
    slug: 'perth',
    state: 'WA',
    suburbs: ['perth', 'subiaco', 'leederville', 'fremantle', 'mount lawley', 'claremont', 'nedlands', 'victoria park', 'scarborough', 'cottesloe'],
    description: 'This Perth guide covers the CBD, Leederville and Mount Lawley in the inner north, Subiaco, Nedlands, Claremont and Cottesloe in the western suburbs, Fremantle, Scarborough on the coast and Victoria Park across the Swan River. findme.hair lists 200+ active salons and barbers across those ten suburbs: 45+ in the CBD, 30+ in Subiaco and 20+ in Fremantle. Among the highest-rated on Google, all at 5.0 stars, are Eesome in Leederville (240+ reviews), Lily Lane Creative Hair in Subiaco (180+), Ellie Dunne Collective in Claremont (180+), Fremantle Hair Studio (150+) and Mane Code + Co in Mount Lawley (100+). More than a quarter of the list are barber shops; Empire State Barbershop in Claremont holds 5.0 from 120+ reviews.',
  },
  {
    name: 'Adelaide',
    slug: 'adelaide',
    state: 'SA',
    suburbs: ['adelaide', 'norwood', 'unley', 'glenelg', 'prospect', 'hyde park', 'north adelaide', 'burnside', 'henley beach', 'mitcham'],
    description: 'This Adelaide guide covers the city centre and North Adelaide, Norwood to the east, the beachside suburbs of Glenelg and Henley Beach, and Prospect, Unley, Hyde Park, Burnside and Mitcham. findme.hair lists 130+ active salons and barbers across them. The city centre has by far the most (50+), followed by Norwood (25+) and North Adelaide (15+), with more than a dozen each in Glenelg and Henley Beach. Among the highest-rated on Google, all at 5.0 stars, are Etcher (400+ reviews), Socoh Salon (140+) and Cabal Hair (100+) in the city, and Enough Studio in Hyde Park (120+). More than a quarter of the list are barber shops; Plek. Barbershop in the city holds 5.0 from 250+ reviews.',
  },
  {
    name: 'Hobart',
    slug: 'hobart',
    state: 'TAS',
    suburbs: ['hobart', 'north hobart', 'battery point', 'sandy bay', 'new town', 'moonah', 'glenorchy', 'kingston', 'bellerive', 'rosny'],
    description: 'This Hobart guide covers the city centre, Battery Point and Sandy Bay to the south, North Hobart, New Town, Moonah and Glenorchy to the north, Kingston further south, and Bellerive and Rosny on the Eastern Shore across the Derwent. findme.hair lists 85+ active salons and barbers across those suburbs and 150+ across the wider Hobart region. The city centre has the most, followed by Moonah and Sandy Bay with 10+ each. Among the highest-rated hair salons on Google are Eye Am Hair (4.9 from 400+ reviews), Paradise Lost (4.9 from 250+) and Glow on Collins (4.9 from 110+), all in the city. Hobart\'s barbers post some of the strongest numbers in this guide: The Blades Barber in North Hobart holds 5.0 from 850+ reviews, and The Blades Barber Moonah 5.0 from 580+.',
  },
  {
    name: 'Darwin',
    slug: 'darwin',
    state: 'NT',
    suburbs: ['darwin', 'stuart park', 'parap', 'fannie bay', 'nightcliff', 'casuarina', 'palmerston', 'rapid creek', 'woolner', 'larrakeyah'],
    description: 'findme.hair lists 120+ active hair businesses across the whole Northern Territory, fewer than any other state or territory. Within the suburbs this guide covers, Parap has the most listings, followed by Nightcliff and Casuarina, with a few more in Fannie Bay and Rapid Creek. Among the highest-rated on Google are Navi Stylish Zone in Nightcliff (4.9 from 95+ reviews), Tenda Salon in Parap (4.9 from 80+) and Dapper & Dame at Casuarina (4.7 from 90+). For a barber, AlleyKatz Barber Shop in Nightcliff holds 4.8 from 180+ reviews. Darwin\'s wet season is hot and humid, so raise frizz control and colour fade at your consultation if they matter to you.',
  },
  {
    name: 'Canberra',
    slug: 'canberra',
    state: 'ACT',
    suburbs: ['canberra', 'braddon', 'kingston', 'manuka', 'woden', 'belconnen', 'civic', 'dickson', 'fyshwick', 'griffith'],
    description: 'Canberra stands out for barbers: more than a third of the 220+ active hair businesses findme.hair lists across the ACT are barber shops, the highest share of any state or territory on the site. This guide covers the city centre, Braddon and Dickson in the inner north, Kingston, Manuka and Griffith in the inner south, the Belconnen and Woden town centres, and Fyshwick, with 100+ listings between them. The city centre has the most, followed by Braddon and Belconnen. Among the highest-rated on Google are Falekosi in Braddon (5.0 from 220+ reviews), Kajal\'s salon in Dickson (5.0 from 120+) and Luminous Hair Salon in Belconnen (4.9 from 390+). For a barber, The Barbershop Club by Benjamin Tuita in the city holds 5.0 from 130+ reviews, and Sleight Of Hand Barber Studio in Kingston 5.0 from 110+.',
  },
  // Regional cities
  {
    name: 'Ballarat',
    slug: 'ballarat',
    state: 'VIC',
    suburbs: ['ballarat', 'ballarat central', 'ballarat east', 'ballarat north', 'wendouree', 'lake wendouree', 'alfredton', 'mount pleasant', 'sebastopol', 'buninyong'],
    description: 'Ballarat\'s hair trade is concentrated in Ballarat Central, the city centre around Sturt Street, Bridge Mall and Lydiard Street, which holds nearly 40 of the 70+ active salons and barbers findme.hair lists across the ten suburbs this guide covers. Wendouree is next, followed by Ballarat East, with smaller numbers in Sebastopol, Alfredton, Buninyong, Ballarat North and Mount Pleasant. Among the highest-rated hair salons on Google are Cutting Culture (5.0 from 150+ reviews), Dexterity Studio (4.9 from 80+) and The Groomerz (4.8 from 200+), all in Ballarat Central. For a barber, Golden Feather Barber and Jimmys Barbershop in Ballarat Central each hold 4.9 from 130+ reviews, and Mr. Bailey\'s Barbershop in Wendouree holds 5.0 from 60+.',
  },
  {
    name: 'Geelong',
    slug: 'geelong',
    state: 'VIC',
    suburbs: ['geelong', 'geelong west', 'newtown', 'belmont', 'highton', 'pakington street', 'ocean grove', 'leopold', 'corio', 'grovedale'],
    description: 'This Geelong guide covers central Geelong, Geelong West (home to the Pakington Street strip), Newtown, Belmont, Highton and Grovedale, Corio in the north, and Ocean Grove and Leopold on the Bellarine Peninsula. findme.hair lists 140+ active salons and barbers across them. Central Geelong has the most, with Geelong West and Newtown close behind at 20+ each, nearly 20 in Belmont, and 10+ each in Ocean Grove and Leopold. Among the highest-rated hair salons on Google are Rixon Hairdressing in central Geelong (4.9 from 560+ reviews), Phoenix Hair Society in Geelong West (4.9 from 270+) and BLUSH BAR Newtown (4.9 from 220+). For a barber, Masterpiece Barbershop in Geelong West holds 5.0 from 360+ reviews.',
  },
  {
    name: 'Newcastle',
    slug: 'newcastle',
    state: 'NSW',
    suburbs: ['newcastle', 'newcastle east', 'hamilton', 'charlestown', 'lambton', 'merewether', 'adamstown', 'the junction', 'darby street', 'beaumont street'],
    description: 'This Newcastle guide covers the city centre and Newcastle East, Hamilton (home to the Beaumont Street strip), The Junction, Merewether, Adamstown, Lambton and Charlestown. findme.hair lists 45+ active salons and barbers across those suburbs and 110+ across the wider Newcastle region. The city centre has the most, followed by The Junction and Hamilton. Among the highest-rated on Google are WAK The Salon in the city (4.9 from 540+ reviews), Sol + Soma Salon at The Junction (4.9 from 300+) and Emphasized Hair in Hamilton (4.9 from 90+). For a barber, The Lane Way Barbers in Hamilton holds 4.9 from 170+ reviews.',
  },
  {
    name: 'Wollongong',
    slug: 'wollongong',
    state: 'NSW',
    suburbs: ['wollongong', 'fairy meadow', 'corrimal', 'thirroul', 'figtree', 'shellharbour', 'unanderra', 'dapto', 'bulli', 'austinmer'],
    description: 'Wollongong\'s hair listings are concentrated in the city centre, which holds 40+ of the 75+ active salons and barbers findme.hair lists across the suburbs this guide covers (100+ across the wider Wollongong region). Corrimal in the northern suburbs is next with 15+, then Fairy Meadow, while Figtree, Unanderra, Dapto and Shellharbour to the south and west have far fewer. Among the highest-rated on Google, all at 5.0 stars, are Hair braids by Somah (110+ reviews), Electric Curl Studio (100+) and Salt Hair Society (55+) in the city, and Hair By Emilie Grace in Corrimal (90+). The Fade District in the city holds 5.0 from 360+ reviews, and Cartel Barbers Wollongong 5.0 from 130+.',
  },
  {
    name: 'Gold Coast',
    slug: 'gold-coast',
    state: 'QLD',
    suburbs: ['gold coast', 'surfers paradise', 'broadbeach', 'burleigh heads', 'palm beach', 'coolangatta', 'robina', 'southport', 'mermaid beach', 'currumbin'],
    description: 'findme.hair lists 650+ active salons and barbers across the Gold Coast region, and 200+ in the ten suburbs this guide covers, from Southport and Surfers Paradise down the coast through Broadbeach, Mermaid Beach, Burleigh Heads, Palm Beach and Currumbin to Coolangatta, plus Robina inland. Southport, the city\'s business centre, has the most listings, followed by Robina (30+), Surfers Paradise and Burleigh Heads (25+ each) and Coolangatta (20+). Among the highest-rated hair salons on Google, all at 5.0 stars, are Cosimo Hair Studio in Broadbeach (440+ reviews), Beauty Works Hair & Beauty in Robina (200+), Organic Hair by Tunde in Surfers Paradise (130+) and Elleve Hair Co. in Mermaid Beach (120+). More than a quarter of the list are barber shops; Mate\'s Barbershop in Surfers Paradise holds 5.0 from 530+ reviews.',
  },
  {
    name: 'Sunshine Coast',
    slug: 'sunshine-coast',
    state: 'QLD',
    suburbs: ['sunshine coast', 'maroochydore', 'noosa', 'mooloolaba', 'caloundra', 'buderim', 'nambour', 'coolum', 'noosaville', 'alexandra headland'],
    description: 'The Sunshine Coast runs from Caloundra in the south to Noosa in the north, and findme.hair lists 350+ active salons and barbers across the region, 140+ of them in the suburbs this guide covers. Maroochydore has the most (35+), followed by Caloundra (nearly 30), Buderim and Mooloolaba (20+ each), then Nambour and Noosaville. Among the highest-rated on Google, all at 5.0 stars, are Henshall Hair Extensions in Maroochydore (520+ reviews), Oxley Plus Cut & Colour in Mooloolaba (200+), Elle Studio in Buderim (170+) and Si.Organics Noosa in Noosaville (110+). For a barber, Saints Barber Lounge in Maroochydore holds 5.0 from 250+ reviews.',
  },
  {
    name: 'Townsville',
    slug: 'townsville',
    state: 'QLD',
    suburbs: ['townsville', 'north ward', 'south townsville', 'cranbrook', 'kirwan', 'aitkenvale', 'hyde park', 'pimlico', 'castletown', 'belgian gardens'],
    description: 'Townsville is North Queensland\'s largest city, and findme.hair lists 100+ active salons and barbers across the Townsville region. Within the suburbs this guide covers, Aitkenvale has the most, followed by Kirwan, then North Ward, Hyde Park and Pimlico, with a few more in Belgian Gardens, Cranbrook and South Townsville. Among the highest-rated on Google are Artside Hair Studio in North Ward (5.0 from 270+ reviews), Coulture Hair Studio in Pimlico (4.9 from 55+), Paragon Hair in Belgian Gardens (4.9 from 55+) and Sizzas Hair and Beauty in Kirwan (4.8 from 130+). For a barber, Just My Barberz in North Ward holds 4.9 from 490+ reviews. Townsville\'s summers are hot and humid, so raise frizz control and colour fade at your consultation if they matter to you.',
  },
  {
    name: 'Cairns',
    slug: 'cairns',
    state: 'QLD',
    suburbs: ['cairns', 'cairns north', 'edge hill', 'parramatta park', 'manunda', 'westcourt', 'earlville', 'smithfield', 'palm cove', 'trinity beach'],
    description: 'findme.hair lists 85+ active salons and barbers across the Cairns region. Within the suburbs this guide covers, Edge Hill and Manunda have the most, followed by Westcourt, with a smaller group at Palm Cove on the northern beaches. Among the highest-rated on Google are Elvi The Salon (5.0 from 60+ reviews) and Reds Hair & Co. (5.0 from 50+) in Edge Hill, Effigy Hair in Westcourt (5.0 from 50+), Berry Lane Hair in Manunda (4.9 from 390+) and Beachfront Hair in Palm Cove (4.9 from 160+). Cairns is hot and humid for much of the year, so raise frizz control and colour fade at your consultation if they matter to you.',
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
  const description = `Find the best hairdressers and barbers in ${config.name}, ${stateName(config.state)}. Top-rated salons with Google reviews and opening hours.`;

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
  const path = `https://www.findme.hair/best-hairdresser/${config.slug}`;

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
        image: 'https://www.findme.hair/og-image.jpg',
        datePublished: PUBLISHED,
        dateModified: MODIFIED,
        author: { '@id': 'https://www.findme.hair/#organization' },
        publisher: { '@id': 'https://www.findme.hair/#organization' },
        mainEntityOfPage: path,
        inLanguage: 'en-AU',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Who are the best hairdressers in ${config.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `findme.hair lists the top-rated hairdressers in ${config.name} based on Google reviews. ${businesses.length > 0 ? `Top rated include ${businesses.slice(0, 3).map((b) => b.name).join(', ')}.` : `Browse our ${config.name} listings for the latest recommendations.`}` },
          },
          {
            '@type': 'Question',
            name: `How much does a haircut cost in ${config.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `Haircut prices in ${config.name} vary from salon to salon, and by stylist and service. Check each salon's own price list or phone ahead before you book.` },
          },
          {
            '@type': 'Question',
            name: `Which suburbs does this ${config.name} guide cover?`,
            acceptedAnswer: { '@type': 'Answer', text: `Suburbs covered by this ${config.name} guide include ${config.suburbs.slice(0, 5).map((s) => titleCase(s)).join(', ')}.` },
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

        {/* Top five by Google rating — a quotable summary of each named salon.
            Brand Radar data (2026-05-22) showed AI rarely cites bare directory
            list pages but does quote roundups. Copy here must stay data-only:
            no "field" visits or personal picks are implied (fact-check 2026-11-07). */}
        {businesses.length >= 3 && (
          <section className="mt-14 card p-8">
            <p className="text-editorial-overline mb-3">Top rated on Google</p>
            <h2
              className="text-xl text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              The highest-rated hair businesses in {config.name}
            </h2>
            <p className="mt-3 text-sm text-[var(--color-ink-light)] leading-relaxed">
              The top {Math.min(5, businesses.length)} of the {businesses.length} listings shown above, ranked by Google rating and then by number of reviews.
            </p>
            <div className="mt-6 space-y-5">
              {businesses.slice(0, 5).map((b) => {
                const rating = typeof b.google_rating === 'number' ? b.google_rating.toFixed(1) : null;
                const reviews = typeof b.google_review_count === 'number' ? b.google_review_count : null;
                const type = b.business_type === 'barber' ? 'barber shop' : b.business_type === 'unisex' ? 'unisex salon' : 'hair salon';
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
                      {/* Verified fields only (lib/listingCopy) — no AI prose, no website-keyword specialty tags. */}
                      {buildCardTeaser(b)}
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
              Whether you&rsquo;re after a precision cut, balayage, a keratin treatment or a classic
              barber fade, check each salon&rsquo;s services and recent reviews before you book.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">What to look for</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google reviews</strong> — check recent reviews, not just the overall rating</li>
              <li><strong>Specialisation</strong> — curly hair, colour correction, and extensions all require specialist skills</li>
              <li><strong>Online booking</strong> — handy if you want to see available times before you call</li>
              <li><strong>Location</strong> — factor in parking, public transport, and opening hours</li>
              <li><strong>Consultations</strong> — ask for a consultation before a major change; many salons offer one</li>
            </ul>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">Tools of the trade</h3>
            <p>
              One way to judge a salon&rsquo;s quality is by looking at their tools. Many professional hairdressers use
              Japanese-steel scissors and have them sharpened regularly.{' '}
              <a href="https://www.sheargenius.com.au/?utm_source=findme_hair&utm_medium=referral&utm_campaign=best_hairdresser_city&utm_content=home" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                ShearGenius
              </a>{' '}
              offers both. Sharp, high-quality scissors reduce split ends and give cleaner, more precise results.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">{config.name} by the numbers</h3>
            <p>
              This page shows the {businesses.length} highest-rated salons and barbers we list across {config.name},
              ranked by Google rating and review count.
              {salons.length > 0 && ` ${salons.length} hair salons`}
              {barbers.length > 0 && ` and ${barbers.length} barber shops`} made the list.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">Suburbs in this guide</h3>
            <p>
              Suburbs covered by this {config.name} guide include{' '}
              {config.suburbs.slice(0, 5).map((s) => titleCase(s)).join(', ')}.
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
            guide ranks barber shops and unisex studios in the same suburbs by Google rating.
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
