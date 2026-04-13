import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { supabaseServerAnon } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'About findme.hair — Australia\'s Hair Salon & Barber Directory',
  description:
    'findme.hair is Australia\'s dedicated hair salon and barber directory. 13,000+ hand-verified listings across all 8 states and territories. Hair only — nothing else.',
  alternates: { canonical: 'https://www.findme.hair/about' },
  openGraph: {
    title: 'About findme.hair',
    description: 'Australia\'s dedicated hair salon and barber directory. 13,000+ verified listings.',
    url: 'https://www.findme.hair/about',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'website',
  },
};

export default async function AboutPage() {
  const supabase = supabaseServerAnon();

  const { count: totalCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: salonCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('business_type', 'hair_salon');

  const { count: barberCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('business_type', 'barber');

  const total = totalCount ?? 0;
  const salons = salonCount ?? 0;
  const barbers = barberCount ?? 0;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'findme.hair',
        url: 'https://www.findme.hair',
        description: 'Australia\'s dedicated hair salon and barber directory',
        foundingDate: '2026',
        areaServed: {
          '@type': 'Country',
          name: 'Australia',
        },
        knowsAbout: [
          'Hair salons',
          'Barber shops',
          'Hairdressing',
          'Hair colouring',
          'Balayage',
          'Men\'s haircuts',
          'Bridal hair',
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'About' },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is findme.hair?',
            acceptedAnswer: { '@type': 'Answer', text: `findme.hair is Australia's dedicated hair salon and barber directory with ${total.toLocaleString()} hand-verified listings across all 8 states and territories. We list hair salons, barber shops, and unisex salons only — no beauty, nails, or spas.` },
          },
          {
            '@type': 'Question',
            name: 'How are listings verified?',
            acceptedAnswer: { '@type': 'Answer', text: 'Every listing on findme.hair is hand-verified against Google Maps, TrueLocal, and Yellow Pages. We check that the business exists, is currently trading, and is genuinely a hair salon or barber shop. Ghost listings, duplicates, and non-hair businesses are removed.' },
          },
          {
            '@type': 'Question',
            name: 'Is findme.hair free to use?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. Searching and browsing findme.hair is completely free for consumers. Salon owners can also claim their listing for free to update their information, add photos, and connect their booking system.' },
          },
          {
            '@type': 'Question',
            name: 'How do I claim my salon listing?',
            acceptedAnswer: { '@type': 'Answer', text: 'Visit findme.hair/claim to start the process. You will need to verify that you own or manage the business. Once claimed, you can update your listing with photos, hours, services, and booking links.' },
          },
        ],
      }} />

      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium">About</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1
          className="text-3xl text-[var(--color-ink)] sm:text-4xl leading-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          About findme.hair
        </h1>
        <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
          Australia&rsquo;s dedicated hair salon and barber directory. Hair only &mdash; nothing else.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--color-ink-light)]">
          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              What is findme.hair?
            </h2>
            <p>
              findme.hair is Australia&rsquo;s only directory dedicated exclusively to hair salons
              and barber shops. We list {total.toLocaleString()} verified businesses across all 8
              states and territories — {salons.toLocaleString()} hair salons,{' '}
              {barbers.toLocaleString()} barber shops, and{' '}
              {(total - salons - barbers).toLocaleString()} unisex salons.
            </p>
            <p className="mt-3">
              Unlike general directories that mix hairdressers with beauty therapists, nail
              technicians, and day spas, we focus on one thing: hair. This makes us the cleanest,
              most accurate hair directory in the country.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              How it works
            </h2>
            <div className="grid gap-6 sm:grid-cols-3 mt-4">
              <div className="card p-5 text-center">
                <p className="text-2xl font-semibold text-[var(--color-gold)]" style={{ fontFamily: 'var(--font-serif)' }}>1</p>
                <p className="mt-2 font-medium text-[var(--color-ink)]">Search</p>
                <p className="mt-1 text-xs">Enter your suburb, postcode, or salon name to find hair salons and barbers near you.</p>
              </div>
              <div className="card p-5 text-center">
                <p className="text-2xl font-semibold text-[var(--color-gold)]" style={{ fontFamily: 'var(--font-serif)' }}>2</p>
                <p className="mt-2 font-medium text-[var(--color-ink)]">Compare</p>
                <p className="mt-1 text-xs">View verified Google reviews, photos, services, and opening hours for each listing.</p>
              </div>
              <div className="card p-5 text-center">
                <p className="text-2xl font-semibold text-[var(--color-gold)]" style={{ fontFamily: 'var(--font-serif)' }}>3</p>
                <p className="mt-2 font-medium text-[var(--color-ink)]">Book</p>
                <p className="mt-1 text-xs">Click through to the salon&rsquo;s booking system or call them directly.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              Our verification process
            </h2>
            <p>
              Every listing on findme.hair goes through a manual verification process:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong>Cross-referenced</strong> against Google Maps, TrueLocal, and Yellow Pages to confirm the business exists and is currently trading</li>
              <li><strong>Categorised</strong> as hair salon, barber shop, or unisex based on the services they actually offer</li>
              <li><strong>De-duplicated</strong> — one business, one listing, no ghost entries</li>
              <li><strong>Non-hair businesses removed</strong> — beauty salons, nail bars, day spas, and lash studios are excluded</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              findme.hair by the numbers
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {total.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Verified listings</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>8</p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">States &amp; territories</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {salons.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Hair salons</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {barbers.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Barber shops</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              For salon owners
            </h2>
            <p>
              If you own or manage a hair salon or barber shop in Australia, you can{' '}
              <Link href="/claim" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">claim your listing</Link>{' '}
              for free. Once claimed, you can:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Update your business name, address, phone, and hours</li>
              <li>Add photos of your salon and work</li>
              <li>Connect your online booking system</li>
              <li>Highlight your services and specialisations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              Contact
            </h2>
            <p>
              Have a question, correction, or feedback? We&rsquo;d love to hear from you.
            </p>
            <p className="mt-3">
              <Link href="/contact" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                Get in touch &rarr;
              </Link>
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <Link href="/search" className="btn-gold">
            Find a salon near you
          </Link>
        </div>
      </div>
    </main>
  );
}

function Chevron() {
  return (
    <svg className="w-3 h-3 text-[var(--color-border)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
