import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Hair Salon vs Barber Shop: Which One Should You Choose? — findme.hair',
  description:
    'What\'s the real difference between a hair salon and a barber shop? Services, pricing, atmosphere, and training compared side by side.',
  alternates: { canonical: 'https://www.findme.hair/blog/hair-salon-vs-barber-shop' },
  openGraph: {
    title: 'Hair Salon vs Barber Shop: Which One Should You Choose?',
    description: 'Salon vs barber — services, pricing, and atmosphere compared.',
    url: 'https://www.findme.hair/blog/hair-salon-vs-barber-shop',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'article',
  },
};

export default function SalonVsBarberArticle() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Hair Salon vs Barber Shop: Which One Should You Choose?',
        datePublished: '2026-04-13',
        dateModified: '2026-04-13',
        author: { '@type': 'Organization', name: 'findme.hair' },
        publisher: { '@type': 'Organization', name: 'findme.hair', url: 'https://www.findme.hair' },
        mainEntityOfPage: 'https://www.findme.hair/blog/hair-salon-vs-barber-shop',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.findme.hair/blog' },
          { '@type': 'ListItem', position: 3, name: 'Hair Salon vs Barber Shop' },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <Link href="/blog" className="hover:text-[var(--color-gold-dark)]">Blog</Link>
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium">Hair Salon vs Barber Shop</span>
          </nav>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <header>
          <time className="text-xs text-[var(--color-ink-muted)]">13 April 2026</time>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Hair Salon vs Barber Shop: Which One Should You Choose?
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
            The line between salons and barbers has blurred, but real differences remain. Understanding
            them helps you choose the right place for the service you need.
          </p>
        </header>

        <div className="mt-10 prose-article">
          <h2>The core difference</h2>
          <p>
            Traditionally, barber shops focus on men&rsquo;s haircuts, shaves, and grooming. Hair
            salons offer a broader range of services including colouring, chemical treatments,
            extensions, and styling for all hair lengths and types. Many modern businesses blend
            both — these are often listed as &ldquo;unisex&rdquo; salons on findme.hair.
          </p>

          <h2>Services compared</h2>
          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm border border-[var(--color-border)]">
              <thead>
                <tr className="bg-[var(--color-surface)]">
                  <th className="text-left p-3 border-b border-[var(--color-border)]">Service</th>
                  <th className="text-center p-3 border-b border-[var(--color-border)]">Hair Salon</th>
                  <th className="text-center p-3 border-b border-[var(--color-border)]">Barber Shop</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-ink-light)]">
                <tr><td className="p-3 border-b border-[var(--color-border-light)]">Haircuts (all lengths)</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Yes</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Short hair only</td></tr>
                <tr><td className="p-3 border-b border-[var(--color-border-light)]">Colour &amp; highlights</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Yes</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Rarely</td></tr>
                <tr><td className="p-3 border-b border-[var(--color-border-light)]">Fades &amp; lineups</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Sometimes</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Yes</td></tr>
                <tr><td className="p-3 border-b border-[var(--color-border-light)]">Straight razor shave</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Rarely</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Yes</td></tr>
                <tr><td className="p-3 border-b border-[var(--color-border-light)]">Blowdry &amp; styling</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Yes</td><td className="text-center p-3 border-b border-[var(--color-border-light)]">Basic</td></tr>
                <tr><td className="p-3">Extensions &amp; treatments</td><td className="text-center p-3">Yes</td><td className="text-center p-3">No</td></tr>
              </tbody>
            </table>
          </div>

          <h2>Training and qualifications</h2>
          <p>
            In Australia, hairdressers typically complete a Certificate III in Hairdressing (salon
            pathway), while barbers complete a Certificate III in Barbering. Both are nationally
            recognised qualifications. The key difference is in the practical training — barbers
            spend more time on clipper work and shaving, while hairdressers focus on chemical
            services, colour theory, and long-hair techniques.
          </p>

          <h2>Pricing</h2>
          <p>
            Barber shops are generally more affordable for basic cuts, with men&rsquo;s haircuts
            typically ranging from $25-$45. Hair salons charge more — women&rsquo;s cuts usually
            start from $60 — but this reflects longer appointment times, more complex techniques,
            and additional services like blowdrying.
          </p>

          <h2>Atmosphere</h2>
          <p>
            Barber shops tend to have a walk-in, social atmosphere. Hair salons are usually
            appointment-based and offer a more personalised experience. Neither is better — it
            depends on what you prefer.
          </p>

          <h2>Which should you choose?</h2>
          <ul>
            <li><strong>Choose a barber</strong> if you want a men&rsquo;s cut, fade, or shave</li>
            <li><strong>Choose a salon</strong> if you need colour, long-hair styling, or chemical treatments</li>
            <li><strong>Choose unisex</strong> if you want a one-stop shop that does everything</li>
          </ul>
          <p>
            Browse <Link href="/search?type=barber" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">barber shops</Link>,{' '}
            <Link href="/search?type=hair_salon" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">hair salons</Link>, or{' '}
            <Link href="/search?type=unisex" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">unisex salons</Link> on
            findme.hair to find the right fit near you.
          </p>
        </div>

        <footer className="mt-14 border-t border-[var(--color-border-light)] pt-8">
          <h2 className="text-lg text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
            Related articles
          </h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link href="/blog/how-to-choose-a-hairdresser" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                How to Choose the Right Hairdresser for You &rarr;
              </Link>
            </li>
            <li>
              <Link href="/blog/questions-to-ask-your-hairdresser" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                10 Questions to Ask Your Hairdresser &rarr;
              </Link>
            </li>
          </ul>
          <div className="mt-6">
            <Link href="/search" className="btn-gold text-sm !py-2 !px-5">
              Find a salon or barber near you
            </Link>
          </div>
        </footer>
      </article>
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
