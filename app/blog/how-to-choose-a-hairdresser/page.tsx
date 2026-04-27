import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'How to Choose the Right Hairdresser for You — findme.hair',
  description:
    'A practical guide to finding the right hairdresser based on your hair type, budget, and style goals. Tips from Australia\'s hair directory.',
  alternates: { canonical: 'https://www.findme.hair/blog/how-to-choose-a-hairdresser' },
  openGraph: {
    title: 'How to Choose the Right Hairdresser for You',
    description: 'A practical guide to finding the right hairdresser in Australia.',
    url: 'https://www.findme.hair/blog/how-to-choose-a-hairdresser',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'article',
  },
};

export default function HowToChooseArticle() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'How to Choose the Right Hairdresser for You',
        image: 'https://www.findme.hair/og-image.jpg',
        datePublished: '2026-04-13',
        dateModified: '2026-04-13',
        author: { '@type': 'Organization', name: 'findme.hair' },
        publisher: { '@type': 'Organization', name: 'findme.hair', url: 'https://www.findme.hair' },
        mainEntityOfPage: 'https://www.findme.hair/blog/how-to-choose-a-hairdresser',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.findme.hair/blog' },
          { '@type': 'ListItem', position: 3, name: 'How to Choose a Hairdresser' },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I choose the right hairdresser?',
            acceptedAnswer: { '@type': 'Answer', text: 'Start with your hair type, check Google reviews (look for 20+ reviews with consistent feedback), ask about consultations, and consider practical details like location, parking, and online booking availability.' },
          },
          {
            '@type': 'Question',
            name: 'What should I look for on my first salon visit?',
            acceptedAnswer: { '@type': 'Answer', text: 'Look for a stylist who asks about your lifestyle, explains what they are doing, keeps a clean and organised salon, recommends products without being pushy, and is honest about what is achievable with your hair.' },
          },
          {
            '@type': 'Question',
            name: 'How many hairdressers should I try before choosing one?',
            acceptedAnswer: { '@type': 'Answer', text: 'Most people find their ideal stylist after trying 2-3 different hairdressers. Do not be afraid to move on if you are not happy with the results.' },
          },
          {
            '@type': 'Question',
            name: 'Should I book a consultation before a major hair change?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. The best salons offer free consultations before major services like colour changes, chemical straightening, or extensions. This lets you assess whether the stylist understands your vision.' },
          },
        ],
      }} />

      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <Link href="/blog" className="hover:text-[var(--color-gold-dark)]">Blog</Link>
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium">How to Choose a Hairdresser</span>
          </nav>
        </div>
      </div>

      {/* Article */}
      <article className="mx-auto max-w-3xl px-6 py-12">
        <header>
          <time className="text-xs text-[var(--color-ink-muted)]">13 April 2026</time>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            How to Choose the Right Hairdresser for You
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
            Finding a hairdresser you trust is one of the most important self-care decisions you can
            make. The right stylist understands your hair, your lifestyle, and what makes you feel
            confident. Here&rsquo;s how to find them.
          </p>
        </header>

        <div className="mt-10 prose-article">
          <h2>Start with your hair type</h2>
          <p>
            Not every hairdresser specialises in every hair type. If you have curly, coily, or
            textured hair, look for stylists who specifically list those services. The same goes for
            fine hair, thick hair, or chemically treated hair. A specialist will understand the
            nuances that a generalist might miss.
          </p>

          <h2>Check reviews — but read them properly</h2>
          <p>
            A 4.8-star rating means less than you think if the salon only has 5 reviews. Look for
            salons with at least 20+ reviews and pay attention to what people say about consistency.
            One great review doesn&rsquo;t tell you much — a pattern of positive feedback does.
          </p>
          <p>
            On <Link href="/search" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">findme.hair</Link>,
            every listing shows verified Google review data so you can compare at a glance.
          </p>

          <h2>Ask about consultations</h2>
          <p>
            The best salons offer a free consultation before major services like colour changes,
            chemical straightening, or extensions. This is your chance to assess whether the
            stylist listens and whether their vision aligns with yours.
          </p>

          <h2>Consider the practical details</h2>
          <p>
            Location, parking, opening hours, and pricing all matter. A salon that&rsquo;s inconvenient
            to get to will eventually become a salon you stop visiting. Look for salons with
            online booking — it&rsquo;s a sign of a well-run business.
          </p>

          <h2>Don&rsquo;t be afraid to try someone new</h2>
          <p>
            Loyalty to your hairdresser is great, but if you&rsquo;re not happy, it&rsquo;s okay to
            move on. Most people find their ideal stylist after trying 2-3 different ones. Use
            our <Link href="/search" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">directory</Link> to
            explore new options near you.
          </p>

          <h2>What to look for on your first visit</h2>
          <ul>
            <li>Does the stylist ask about your lifestyle and daily routine?</li>
            <li>Do they explain what they&rsquo;re doing and why?</li>
            <li>Is the salon clean, organised, and professional?</li>
            <li>Do they use quality{' '}
              <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                professional hairdressing scissors
              </a>
              ? Japanese steel scissors are the industry standard.</li>
            <li>Do they recommend products without being pushy?</li>
            <li>Are they honest about what&rsquo;s achievable with your hair?</li>
          </ul>

          <h2>The bottom line</h2>
          <p>
            A great hairdresser is someone who makes you feel heard and leaves you feeling confident.
            Take the time to find the right fit — your hair (and your self-esteem) will thank you.
          </p>
        </div>

        {/* Related */}
        <footer className="mt-14 border-t border-[var(--color-border-light)] pt-8">
          <h2 className="text-lg text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
            Related articles
          </h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link href="/blog/hair-salon-vs-barber-shop" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                Hair Salon vs Barber Shop: Which One Should You Choose? &rarr;
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
              Find a hairdresser near you
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
