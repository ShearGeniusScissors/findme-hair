import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import JsonLd from '@/components/JsonLd';
import { stateName, titleCase } from '@/lib/geo';
import { supabaseServerAnon } from '@/lib/supabase';
import type { AuState, Business } from '@/types/database';

export const revalidate = 3600; // ISR — regenerate at most once per hour

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
    description: 'Melbourne is home to some of Australia\'s most creative and trend-setting hairdressers. From Fitzroy\'s edgy colour specialists to South Yarra\'s luxury salons, the city offers world-class hair services across every suburb.',
  },
  {
    name: 'Sydney',
    slug: 'sydney',
    state: 'NSW',
    suburbs: ['sydney', 'surry hills', 'bondi', 'paddington', 'newtown', 'darlinghurst', 'mosman', 'double bay', 'manly', 'balmain'],
    description: 'Sydney\'s hairdressing scene spans beachside salons in Bondi to high-end studios in Double Bay and Paddington. The city is known for natural sun-kissed colour, balayage, and precision cutting.',
  },
  {
    name: 'Brisbane',
    slug: 'brisbane',
    state: 'QLD',
    suburbs: ['brisbane', 'fortitude valley', 'south brisbane', 'west end', 'paddington', 'new farm', 'bulimba', 'woolloongabba', 'ascot', 'indooroopilly'],
    description: 'Brisbane\'s hairdressing scene has grown rapidly, with Fortitude Valley and New Farm leading the way for modern styling. The subtropical climate means salons specialise in humidity-friendly styles and treatments.',
  },
  {
    name: 'Perth',
    slug: 'perth',
    state: 'WA',
    suburbs: ['perth', 'subiaco', 'leederville', 'fremantle', 'mount lawley', 'claremont', 'nedlands', 'victoria park', 'scarborough', 'cottesloe'],
    description: 'Perth offers a relaxed West Coast approach to hairdressing, with salons in Subiaco and Leederville known for their laid-back luxury. Fremantle and Claremont are also popular destinations for quality hair services.',
  },
  {
    name: 'Adelaide',
    slug: 'adelaide',
    state: 'SA',
    suburbs: ['adelaide', 'norwood', 'unley', 'glenelg', 'prospect', 'hyde park', 'north adelaide', 'burnside', 'henley beach', 'mitcham'],
    description: 'Adelaide\'s hairdressing community is tight-knit and highly skilled. Norwood and Unley are known for their concentration of premium salons, while the city centre offers convenience and variety.',
  },
  {
    name: 'Hobart',
    slug: 'hobart',
    state: 'TAS',
    suburbs: ['hobart', 'north hobart', 'battery point', 'sandy bay', 'new town', 'moonah', 'glenorchy', 'kingston', 'bellerive', 'rosny'],
    description: 'Hobart\'s hairdressing scene is intimate and personal, with many salons run by experienced owner-operators. North Hobart and Sandy Bay are popular areas for quality cuts and colour.',
  },
  {
    name: 'Darwin',
    slug: 'darwin',
    state: 'NT',
    suburbs: ['darwin', 'stuart park', 'parap', 'fannie bay', 'nightcliff', 'casuarina', 'palmerston', 'rapid creek', 'woolner', 'larrakeyah'],
    description: 'Darwin\'s tropical climate shapes its hairdressing culture — salons here specialise in treatments that work with the humidity. Stuart Park and Parap are home to some of the city\'s best-rated stylists.',
  },
  {
    name: 'Canberra',
    slug: 'canberra',
    state: 'ACT',
    suburbs: ['canberra', 'braddon', 'kingston', 'manuka', 'woden', 'belconnen', 'civic', 'dickson', 'fyshwick', 'griffith'],
    description: 'Canberra\'s hairdressing scene is concentrated in key hubs like Braddon, Kingston, and Manuka. The city offers a mix of modern, boutique salons and established family-run barber shops.',
  },
  // Regional cities
  {
    name: 'Ballarat',
    slug: 'ballarat',
    state: 'VIC',
    suburbs: ['ballarat', 'ballarat central', 'ballarat east', 'ballarat north', 'wendouree', 'lake wendouree', 'alfredton', 'mount pleasant', 'sebastopol', 'buninyong'],
    description: 'Ballarat is one of Victoria\'s largest regional cities with a thriving hairdressing scene. From heritage-listed Sturt Street to the buzzing CBD, Ballarat offers quality salons and barbers with a friendly, small-city vibe.',
  },
  {
    name: 'Geelong',
    slug: 'geelong',
    state: 'VIC',
    suburbs: ['geelong', 'geelong west', 'newtown', 'belmont', 'highton', 'pakington street', 'ocean grove', 'leopold', 'corio', 'grovedale'],
    description: 'Geelong\'s hairdressing scene has boomed alongside the city\'s growth. Pakington Street and the CBD are home to stylish salons, while the Bellarine Peninsula offers beachy, relaxed styling options.',
  },
  {
    name: 'Newcastle',
    slug: 'newcastle',
    state: 'NSW',
    suburbs: ['newcastle', 'newcastle east', 'hamilton', 'charlestown', 'lambton', 'merewether', 'adamstown', 'the junction', 'darby street', 'beaumont street'],
    description: 'Newcastle combines surf culture with urban style, and its hairdressers reflect that mix. From Darby Street\'s trendy salons to Hamilton\'s Beaumont Street strip, Newcastle has a strong independent salon culture.',
  },
  {
    name: 'Wollongong',
    slug: 'wollongong',
    state: 'NSW',
    suburbs: ['wollongong', 'fairy meadow', 'corrimal', 'thirroul', 'figtree', 'shellharbour', 'unanderra', 'dapto', 'bulli', 'austinmer'],
    description: 'Wollongong\'s coastal lifestyle shapes its hairdressing scene. Salons here specialise in low-maintenance, beach-ready styles. The CBD and northern suburbs like Thirroul and Bulli are popular for quality hair services.',
  },
  {
    name: 'Gold Coast',
    slug: 'gold-coast',
    state: 'QLD',
    suburbs: ['gold coast', 'surfers paradise', 'broadbeach', 'burleigh heads', 'palm beach', 'coolangatta', 'robina', 'southport', 'mermaid beach', 'currumbin'],
    description: 'The Gold Coast is home to some of Queensland\'s most stylish salons. Burleigh Heads and Broadbeach lead the way with beachy balayage and sun-kissed colour, while Robina and Southport offer family-friendly options.',
  },
  {
    name: 'Sunshine Coast',
    slug: 'sunshine-coast',
    state: 'QLD',
    suburbs: ['sunshine coast', 'maroochydore', 'noosa', 'mooloolaba', 'caloundra', 'buderim', 'nambour', 'coolum', 'noosaville', 'alexandra headland'],
    description: 'The Sunshine Coast\'s relaxed lifestyle extends to its hairdressing culture. Noosa and Mooloolaba are known for premium salons, while Maroochydore and Caloundra offer a wide range of affordable options.',
  },
  {
    name: 'Townsville',
    slug: 'townsville',
    state: 'QLD',
    suburbs: ['townsville', 'north ward', 'south townsville', 'cranbrook', 'kirwan', 'aitkenvale', 'hyde park', 'pimlico', 'castletown', 'belgian gardens'],
    description: 'Townsville is North Queensland\'s hairdressing hub, with salons that understand tropical hair care. The Palmer Street precinct and Aitkenvale shopping area are popular destinations for quality cuts and colour.',
  },
  {
    name: 'Cairns',
    slug: 'cairns',
    state: 'QLD',
    suburbs: ['cairns', 'cairns north', 'edge hill', 'parramatta park', 'manunda', 'westcourt', 'earlville', 'smithfield', 'palm cove', 'trinity beach'],
    description: 'Cairns\' tropical setting means salons here specialise in humidity-proof styles and treatments. The Esplanade and Shields Street areas are home to the city\'s top-rated hairdressers and barbers.',
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
    alternates: { canonical: `https://www.findme.hair/best-hairdresser/${config.slug}` },
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
  const supabase = supabaseServerAnon();
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
            {config.suburbs.map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}&state=${config.state}`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                {titleCase(s)}
              </Link>
            ))}
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
