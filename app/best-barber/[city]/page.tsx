import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import JsonLd from '@/components/JsonLd';
import { stateName, titleCase } from '@/lib/geo';
import { supabaseServerAnon } from '@/lib/supabase';
import { TOP_SUBURBS } from '@/lib/suburbConfig';
import type { AuState, Business } from '@/types/database';

const SUBURB_SLUG_SET = new Set(TOP_SUBURBS.map((s) => s.slug));
const suburbToSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const revalidate = 3600; // ISR — regenerate at most once per hour

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
    description: 'Melbourne\'s barber scene is one of the most diverse in Australia. From Fitzroy and Collingwood\'s old-school traditional barbers to South Yarra and Prahran\'s premium grooming studios, the city covers every style of cut, fade, and beard work.',
  },
  {
    name: 'Sydney',
    slug: 'sydney',
    state: 'NSW',
    suburbs: ['sydney', 'surry hills', 'newtown', 'paddington', 'darlinghurst', 'bondi', 'manly', 'balmain', 'redfern', 'leichhardt'],
    description: 'Sydney\'s barbers span beachside shops in Bondi and Manly to inner-city specialists in Surry Hills and Newtown. The city is known for sharp fades, classic scissor-over-comb, and traditional hot-towel shaves.',
  },
  {
    name: 'Brisbane',
    slug: 'brisbane',
    state: 'QLD',
    suburbs: ['brisbane', 'fortitude valley', 'south brisbane', 'west end', 'paddington', 'new farm', 'bulimba', 'woolloongabba', 'spring hill', 'milton'],
    description: 'Brisbane\'s barber culture is concentrated in the Valley, West End, and New Farm — areas known for premium men\'s grooming and traditional barbershop atmospheres. The CBD also hosts several long-running barbers serving city professionals.',
  },
  {
    name: 'Perth',
    slug: 'perth',
    state: 'WA',
    suburbs: ['perth', 'subiaco', 'leederville', 'fremantle', 'mount lawley', 'northbridge', 'victoria park', 'claremont', 'east perth', 'west perth'],
    description: 'Perth\'s barber scene mixes laid-back West Coast vibes with classic craftsmanship. Mount Lawley and Leederville are known for boutique barbers, while Subiaco and Fremantle offer family-run shops with decades of history.',
  },
  {
    name: 'Adelaide',
    slug: 'adelaide',
    state: 'SA',
    suburbs: ['adelaide', 'norwood', 'unley', 'glenelg', 'prospect', 'hyde park', 'north adelaide', 'burnside', 'kent town', 'stepney'],
    description: 'Adelaide\'s barbers are tight-knit and known for craftsmanship. Norwood, Unley, and the CBD are home to highly-rated barbershops offering everything from classic short-back-and-sides to modern textured cuts.',
  },
  {
    name: 'Hobart',
    slug: 'hobart',
    state: 'TAS',
    suburbs: ['hobart', 'north hobart', 'battery point', 'sandy bay', 'new town', 'moonah', 'glenorchy', 'kingston', 'bellerive', 'rosny'],
    description: 'Hobart\'s barber scene is small, personal, and skilled. North Hobart and Sandy Bay are popular for quality cuts, with several owner-operator barbers known for personal service and traditional techniques.',
  },
  {
    name: 'Darwin',
    slug: 'darwin',
    state: 'NT',
    suburbs: ['darwin', 'stuart park', 'parap', 'fannie bay', 'nightcliff', 'casuarina', 'palmerston', 'rapid creek', 'woolner', 'larrakeyah'],
    description: 'Darwin\'s tropical climate shapes its barber scene — quick efficient cuts and beard maintenance for the heat are the local specialty. Stuart Park, Parap, and the CBD host the city\'s top-rated barbers.',
  },
  {
    name: 'Canberra',
    slug: 'canberra',
    state: 'ACT',
    suburbs: ['canberra', 'braddon', 'kingston', 'manuka', 'civic', 'dickson', 'belconnen', 'woden', 'fyshwick', 'phillip'],
    description: 'Canberra\'s barber scene is concentrated in Braddon, Kingston, and Manuka. The city offers a strong mix of modern boutique barbers and established traditional shops serving public servants and locals alike.',
  },
  // Regional cities
  {
    name: 'Ballarat',
    slug: 'ballarat',
    state: 'VIC',
    suburbs: ['ballarat', 'ballarat central', 'ballarat east', 'ballarat north', 'wendouree', 'lake wendouree', 'alfredton', 'mount pleasant', 'sebastopol', 'buninyong'],
    description: 'Ballarat\'s barber scene punches above its weight for a regional city. Sturt Street, Bridge Mall, and the surrounding suburbs host a strong mix of traditional shops and modern grooming studios.',
  },
  {
    name: 'Geelong',
    slug: 'geelong',
    state: 'VIC',
    suburbs: ['geelong', 'geelong west', 'newtown', 'belmont', 'highton', 'pakington street', 'ocean grove', 'leopold', 'corio', 'grovedale'],
    description: 'Geelong\'s barber culture has grown alongside the city\'s recent development. Pakington Street and the CBD lead the way for quality men\'s grooming, with several Bellarine Peninsula barbers also worth the drive.',
  },
  {
    name: 'Newcastle',
    slug: 'newcastle',
    state: 'NSW',
    suburbs: ['newcastle', 'newcastle east', 'hamilton', 'charlestown', 'lambton', 'merewether', 'adamstown', 'the junction', 'darby street', 'beaumont street'],
    description: 'Newcastle\'s barber scene mixes surf-town simplicity with urban precision. Darby Street and Beaumont Street strip are home to a strong rotation of independent barbershops with loyal local followings.',
  },
  {
    name: 'Wollongong',
    slug: 'wollongong',
    state: 'NSW',
    suburbs: ['wollongong', 'fairy meadow', 'corrimal', 'thirroul', 'figtree', 'shellharbour', 'unanderra', 'dapto', 'bulli', 'austinmer'],
    description: 'Wollongong\'s coastal lifestyle shapes its barbers — short, low-maintenance cuts dominate. The CBD and northern suburbs like Thirroul and Bulli are popular for quality men\'s grooming.',
  },
  {
    name: 'Gold Coast',
    slug: 'gold-coast',
    state: 'QLD',
    suburbs: ['gold coast', 'surfers paradise', 'broadbeach', 'burleigh heads', 'palm beach', 'coolangatta', 'robina', 'southport', 'mermaid beach', 'currumbin'],
    description: 'The Gold Coast\'s barber scene is split between premium grooming studios in Burleigh and Broadbeach and high-volume neighbourhood shops in Robina and Southport. Sun-conscious cuts dominate.',
  },
  {
    name: 'Sunshine Coast',
    slug: 'sunshine-coast',
    state: 'QLD',
    suburbs: ['sunshine coast', 'maroochydore', 'noosa', 'mooloolaba', 'caloundra', 'buderim', 'nambour', 'coolum', 'noosaville', 'alexandra headland'],
    description: 'The Sunshine Coast\'s barbers reflect the relaxed lifestyle. Noosa and Mooloolaba are home to premium grooming studios, while Maroochydore and Caloundra offer well-loved local barbershops.',
  },
  {
    name: 'Townsville',
    slug: 'townsville',
    state: 'QLD',
    suburbs: ['townsville', 'north ward', 'south townsville', 'cranbrook', 'kirwan', 'aitkenvale', 'hyde park', 'pimlico', 'castletown', 'belgian gardens'],
    description: 'Townsville is North Queensland\'s barber hub. Palmer Street, Aitkenvale, and the CBD host barbers experienced with tropical-climate cuts and beard care.',
  },
  {
    name: 'Cairns',
    slug: 'cairns',
    state: 'QLD',
    suburbs: ['cairns', 'cairns north', 'edge hill', 'parramatta park', 'manunda', 'westcourt', 'earlville', 'smithfield', 'palm cove', 'trinity beach'],
    description: 'Cairns\' tropical setting shapes its barber scene. The Esplanade, Shields Street, and surrounding suburbs are home to barbers experienced with humidity-friendly cuts and beard maintenance.',
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
  const supabase = supabaseServerAnon();
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
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
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
