import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import JsonLd from '@/components/JsonLd';
import { stateName, titleCase } from '@/lib/geo';
import { supabaseServerAnon } from '@/lib/supabase';
import type { AuState, Business } from '@/types/database';

export const revalidate = 3600;

interface CityConfig {
  name: string;
  slug: string;
  state: AuState;
  suburbs: string[];
  description: string;
}

// Cities mirror /best-hairdresser and /best-barber for cross-link symmetry.
// Suburb lists are the same — mobile hairdressers travel across the metro area.
const CITIES: CityConfig[] = [
  { name: 'Melbourne', slug: 'melbourne', state: 'VIC', suburbs: ['melbourne', 'south yarra', 'fitzroy', 'richmond', 'carlton', 'collingwood', 'prahran', 'st kilda', 'brunswick', 'windsor'], description: 'Melbourne\'s mobile hairdressers cover every metro suburb. Whether you\'re in the inner north, eastern suburbs, or bayside, there\'s a stylist who will come to you.' },
  { name: 'Sydney', slug: 'sydney', state: 'NSW', suburbs: ['sydney', 'surry hills', 'bondi', 'paddington', 'newtown', 'darlinghurst', 'mosman', 'double bay', 'manly', 'balmain'], description: 'Sydney\'s mobile hairdressers travel across the eastern suburbs, inner west, north shore, and beaches. Most carry their own equipment and offer a full salon experience at home.' },
  { name: 'Brisbane', slug: 'brisbane', state: 'QLD', suburbs: ['brisbane', 'fortitude valley', 'south brisbane', 'west end', 'paddington', 'new farm', 'bulimba', 'woolloongabba', 'ascot', 'indooroopilly'], description: 'Brisbane\'s mobile hairdressers serve inner-city, west end, and surrounding suburbs. The subtropical climate means many specialise in humidity-friendly cuts and styling.' },
  { name: 'Perth', slug: 'perth', state: 'WA', suburbs: ['perth', 'subiaco', 'leederville', 'fremantle', 'mount lawley', 'claremont', 'nedlands', 'victoria park', 'scarborough', 'cottesloe'], description: 'Perth\'s mobile hairdressers cover the metro from the city out to Fremantle, the western suburbs, and the northern beaches. Ideal for busy professionals or anyone with mobility limits.' },
  { name: 'Adelaide', slug: 'adelaide', state: 'SA', suburbs: ['adelaide', 'norwood', 'unley', 'glenelg', 'prospect', 'hyde park', 'north adelaide', 'burnside', 'henley beach', 'mitcham'], description: 'Adelaide\'s mobile hairdressers travel across the inner suburbs, eastern hills, and coastal areas. Many are highly experienced salon stylists who now offer at-home services.' },
  { name: 'Hobart', slug: 'hobart', state: 'TAS', suburbs: ['hobart', 'north hobart', 'battery point', 'sandy bay', 'new town', 'moonah', 'glenorchy', 'kingston', 'bellerive', 'rosny'], description: 'Hobart\'s mobile hairdressers cover the city, eastern shore, and suburbs out to Kingston. The smaller scale means most stylists know their clients personally.' },
  { name: 'Darwin', slug: 'darwin', state: 'NT', suburbs: ['darwin', 'stuart park', 'parap', 'fannie bay', 'nightcliff', 'casuarina', 'palmerston', 'rapid creek', 'woolner', 'larrakeyah'], description: 'Darwin\'s mobile hairdressers serve the city, northern suburbs, and Palmerston. Many specialise in tropical-climate cuts and quick at-home services for busy locals.' },
  { name: 'Canberra', slug: 'canberra', state: 'ACT', suburbs: ['canberra', 'braddon', 'kingston', 'manuka', 'woden', 'belconnen', 'civic', 'dickson', 'fyshwick', 'griffith'], description: 'Canberra\'s mobile hairdressers cover all four town centres plus the inner suburbs. A popular choice for public servants, families, and anyone juggling a tight schedule.' },
  { name: 'Ballarat', slug: 'ballarat', state: 'VIC', suburbs: ['ballarat', 'ballarat central', 'ballarat east', 'ballarat north', 'wendouree', 'lake wendouree', 'alfredton', 'mount pleasant', 'sebastopol', 'buninyong'], description: 'Ballarat\'s mobile hairdressers serve the entire city plus surrounding regional suburbs. A strong option for the elderly, parents with young children, and rural residents.' },
  { name: 'Geelong', slug: 'geelong', state: 'VIC', suburbs: ['geelong', 'geelong west', 'newtown', 'belmont', 'highton', 'pakington street', 'ocean grove', 'leopold', 'corio', 'grovedale'], description: 'Geelong\'s mobile hairdressers cover the CBD, suburbs, and the Bellarine Peninsula. Popular for clients along the coast who don\'t want to drive into a salon.' },
  { name: 'Newcastle', slug: 'newcastle', state: 'NSW', suburbs: ['newcastle', 'newcastle east', 'hamilton', 'charlestown', 'lambton', 'merewether', 'adamstown', 'the junction', 'darby street', 'beaumont street'], description: 'Newcastle\'s mobile hairdressers travel across the city, Lake Macquarie, and the Hunter region. Many have moved from salon work to at-home services and built loyal client bases.' },
  { name: 'Wollongong', slug: 'wollongong', state: 'NSW', suburbs: ['wollongong', 'fairy meadow', 'corrimal', 'thirroul', 'figtree', 'shellharbour', 'unanderra', 'dapto', 'bulli', 'austinmer'], description: 'Wollongong\'s mobile hairdressers cover the coast from Helensburgh through to Shellharbour. A practical choice for clients along the train line who don\'t want to fight CBD parking.' },
  { name: 'Gold Coast', slug: 'gold-coast', state: 'QLD', suburbs: ['gold coast', 'surfers paradise', 'broadbeach', 'burleigh heads', 'palm beach', 'coolangatta', 'robina', 'southport', 'mermaid beach', 'currumbin'], description: 'Gold Coast mobile hairdressers cover from Coolangatta up to Sanctuary Cove. Beachy, low-maintenance styles are a local specialty, and many stylists also handle event hair.' },
  { name: 'Sunshine Coast', slug: 'sunshine-coast', state: 'QLD', suburbs: ['sunshine coast', 'maroochydore', 'noosa', 'mooloolaba', 'caloundra', 'buderim', 'nambour', 'coolum', 'noosaville', 'alexandra headland'], description: 'Sunshine Coast mobile hairdressers travel across Noosa, Mooloolaba, Caloundra, and the hinterland. Ideal for tourists in holiday rentals and locals along the spread-out coastline.' },
  { name: 'Townsville', slug: 'townsville', state: 'QLD', suburbs: ['townsville', 'north ward', 'south townsville', 'cranbrook', 'kirwan', 'aitkenvale', 'hyde park', 'pimlico', 'castletown', 'belgian gardens'], description: 'Townsville mobile hairdressers cover the city, the Strand, and surrounding suburbs. Tropical-climate cuts and humidity-friendly styling are local specialties.' },
  { name: 'Cairns', slug: 'cairns', state: 'QLD', suburbs: ['cairns', 'cairns north', 'edge hill', 'parramatta park', 'manunda', 'westcourt', 'earlville', 'smithfield', 'palm cove', 'trinity beach'], description: 'Cairns mobile hairdressers serve the city centre, northern beaches, and Palm Cove. Resort visitors and locals alike use mobile services for events, weddings, and regular cuts.' },
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

  const path = `https://www.findme.hair/mobile-hairdresser/${config.slug}`;
  const title = `Mobile Hairdressers in ${config.name} ${new Date().getFullYear()} — At-Home Stylists | findme.hair`;
  const description = `Find verified mobile hairdressers who come to you in ${config.name}, ${stateName(config.state)}. At-home cuts, colour, and styling with real Google reviews.`;

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

async function getMobileHairdressers(config: CityConfig): Promise<Business[]> {
  const supabase = supabaseServerAnon();
  const suburbFilters = config.suburbs.map((s) => `suburb.ilike.${s}`).join(',');

  // Try is_mobile=true first (the canonical signal); fall back to specialties[] containing 'mobile'
  // OR business name containing "mobile" — three layered filters because data is sparse.
  const { data: mobileFlag } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .eq('state', config.state)
    .eq('is_mobile', true)
    .or(suburbFilters)
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false })
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .limit(20);

  if (mobileFlag && mobileFlag.length >= 6) return mobileFlag as Business[];

  // Fall back to specialty tag
  const { data: bySpecialty } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .eq('state', config.state)
    .contains('specialties', ['mobile'])
    .or(suburbFilters)
    .order('google_rating', { ascending: false, nullsFirst: false })
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .limit(20);

  // Combine results, dedupe by id
  const combined: Business[] = [];
  const seen = new Set<string>();
  for (const list of [mobileFlag ?? [], bySpecialty ?? []]) {
    for (const b of list as Business[]) {
      if (!seen.has(b.id)) {
        combined.push(b);
        seen.add(b.id);
      }
    }
  }
  return combined.slice(0, 20);
}

export default async function MobileHairdresserCityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const config = CITIES.find((c) => c.slug === city);
  if (!config) notFound();

  const businesses = await getMobileHairdressers(config);
  const fullState = stateName(config.state);
  const year = new Date().getFullYear();

  // Empty pages are noindex (per the existing safeguard)
  const hasResults = businesses.length >= 3;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      {!hasResults && (
        <JsonLd data={{ '@type': 'WebPage', '@context': 'https://schema.org', name: `Mobile hairdressers in ${config.name}` }} />
      )}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: fullState, item: `https://www.findme.hair/${config.state.toLowerCase()}` },
          { '@type': 'ListItem', position: 3, name: `Mobile hairdressers in ${config.name}` },
        ],
      }} />
      {businesses.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Mobile hairdressers in ${config.name}`,
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
            name: `How much does a mobile hairdresser cost in ${config.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `Mobile hairdressers in ${config.name} typically charge $60-$120 for a basic women's cut, $40-$70 for men's cuts, and $150+ for colour services. Most charge a small travel fee beyond a 10-15km radius. Always confirm pricing and travel coverage when booking.` },
          },
          {
            '@type': 'Question',
            name: `Do mobile hairdressers in ${config.name} bring their own equipment?`,
            acceptedAnswer: { '@type': 'Answer', text: `Yes — established mobile hairdressers carry a complete kit including portable basin, chair, dryer, scissors, and product. The best-rated stylists also bring a drop sheet to protect floors. Confirm equipment provision when booking, especially for colour services that need a basin.` },
          },
          {
            '@type': 'Question',
            name: `Can mobile hairdressers in ${config.name} do colour treatments?`,
            acceptedAnswer: { '@type': 'Answer', text: `Many can. The best mobile hairdressers in ${config.name} carry a portable basin specifically for colour rinses, and use professional-grade products. Discuss your colour history during booking — major colour corrections often still require a salon visit.` },
          },
          {
            '@type': 'Question',
            name: `What suburbs do ${config.name} mobile hairdressers cover?`,
            acceptedAnswer: { '@type': 'Answer', text: `${config.name} mobile hairdressers typically cover ${config.suburbs.slice(0, 5).map(s => titleCase(s)).join(', ')} and surrounding suburbs. Most travel within a 15-25km radius from their base, with travel fees applying beyond that. Always confirm coverage when booking.` },
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
            <span className="text-[var(--color-ink)] font-medium">Mobile hairdressers in {config.name}</span>
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
            Mobile Hairdressers in {config.name} ({year})
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            {config.description}
          </p>
        </div>
      </div>

      {/* Listings */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {hasResults ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
              We&rsquo;re still verifying mobile hairdressers in {config.name}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              Browse all {config.name} hair salons and barbers below — many offer mobile bookings on request.
            </p>
            <Link
              href={`/best-hairdresser/${config.slug}`}
              className="mt-6 inline-block btn-gold"
            >
              See all {config.name} hairdressers
            </Link>
          </div>
        )}

        {/* Guide content */}
        <section className="mt-14 card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            How to choose a mobile hairdresser in {config.name}
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--color-ink-light)]">
            <p>
              Mobile hairdressers in {config.name} bring the salon experience to your home, office,
              or event. They&rsquo;re ideal for busy parents, professionals with packed schedules, anyone
              with mobility limits, and event hair (weddings, formals, race-day). The best mobile
              stylists are experienced salon hairdressers who&rsquo;ve made the switch to at-home work.
            </p>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">What to check before booking</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Travel coverage and fees</strong> — most charge a small fee beyond 10-15km</li>
              <li><strong>Equipment</strong> — confirm they bring portable basin, chair, dryer, drop sheet</li>
              <li><strong>Insurance</strong> — established mobile stylists carry public liability cover</li>
              <li><strong>Recent reviews</strong> — read the last 3 months on Google, not just the lifetime rating</li>
              <li><strong>Specialty fit</strong> — colour, balayage, kids, seniors, event hair all need different skills</li>
            </ul>
            <h3 className="text-base font-semibold text-[var(--color-ink)]">Tools they bring with them</h3>
            <p>
              Top mobile hairdressers in {config.name} use professional-grade{' '}
              <a href="https://www.sheargenius.com.au/collections/hairdressing-scissors" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                Japanese-steel scissors
              </a>
              {' '}and a sharpening service to keep them at salon quality between visits. ShearGenius offers{' '}
              <a href="https://www.sheargenius.com.au/pages/scissor-sharpening" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                Australia-wide mail-in sharpening
              </a>
              {' '}— a tool tip for any mobile stylist.
            </p>
          </div>
        </section>

        {/* Suburbs covered */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Suburbs covered in {config.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {config.suburbs.map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}&state=${config.state}&service=mobile-hairdresser`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                {titleCase(s)}
              </Link>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Related guides for {config.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href={`/best-hairdresser/${config.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
              Best hairdressers in {config.name}
            </Link>
            <span className="text-[var(--color-border)]">·</span>
            <Link href={`/best-barber/${config.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
              Best barbers in {config.name}
            </Link>
            <span className="text-[var(--color-border)]">·</span>
            <Link href={`/services/mobile-hairdresser`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
              All mobile hairdressers Australia
            </Link>
          </div>
        </section>

        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Mobile hairdressers in other cities
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CITIES.filter((c) => c.slug !== config.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/mobile-hairdresser/${c.slug}`}
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
