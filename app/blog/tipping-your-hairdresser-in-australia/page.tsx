import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Tipping Your Hairdresser in Australia: What You Need to Know — findme.hair',
  description:
    'Is tipping your hairdresser expected in Australia? Learn how much to tip, when it\'s appropriate, and the best alternatives to show appreciation for great service.',
  alternates: { canonical: 'https://www.findme.hair/blog/tipping-your-hairdresser-in-australia' },
  openGraph: {
    title: 'Tipping Your Hairdresser in Australia: What You Need to Know',
    description: 'Is tipping your hairdresser expected in Australia? A practical guide to tipping etiquette at salons and barber shops.',
    url: 'https://www.findme.hair/blog/tipping-your-hairdresser-in-australia',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'article',
  },
};

export default function TippingHairdresserArticle() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Tipping Your Hairdresser in Australia: What You Need to Know',
        image: 'https://www.findme.hair/og-image.jpg',
        datePublished: '2026-04-17',
        dateModified: '2026-04-17',
        author: { '@type': 'Organization', name: 'findme.hair' },
        publisher: { '@type': 'Organization', name: 'findme.hair', url: 'https://www.findme.hair' },
        mainEntityOfPage: 'https://www.findme.hair/blog/tipping-your-hairdresser-in-australia',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.findme.hair/blog' },
          { '@type': 'ListItem', position: 3, name: 'Tipping Your Hairdresser in Australia' },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Do you tip hairdressers in Australia?',
            acceptedAnswer: { '@type': 'Answer', text: 'Tipping is not expected or required in Australia because hairdressers earn a fair wage under the Hair and Beauty Industry Award. However, a small tip is always appreciated as a gesture of thanks for exceptional service.' },
          },
          {
            '@type': 'Question',
            name: 'How much should you tip a hairdresser in Australia?',
            acceptedAnswer: { '@type': 'Answer', text: 'If you choose to tip, 5-10% of the service cost is a generous amount. Many Australians simply round up to the nearest $5 or $10 instead of calculating a percentage.' },
          },
          {
            '@type': 'Question',
            name: 'What are good alternatives to tipping your hairdresser in Australia?',
            acceptedAnswer: { '@type': 'Answer', text: 'You can show appreciation by leaving a Google review, referring friends and family, rebooking before you leave the salon, or simply telling your stylist you love the result. These gestures can mean just as much as a cash tip.' },
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
            <span className="text-[var(--color-ink)] font-medium">Tipping Your Hairdresser in Australia</span>
          </nav>
        </div>
      </div>

      {/* Article */}
      <article className="mx-auto max-w-3xl px-6 py-12">
        <header>
          <time className="text-xs text-[var(--color-ink-muted)]">17 April 2026</time>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Tipping Your Hairdresser in Australia: What You Need to Know
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
            Australia doesn&rsquo;t have a tipping culture like the US or UK, but that doesn&rsquo;t
            mean your hairdresser won&rsquo;t appreciate a little extra. Here&rsquo;s a straightforward
            guide to tipping etiquette at salons and barber shops across Australia.
          </p>
        </header>

        <div className="mt-10 prose-article">
          <h2>Is tipping expected in Australia?</h2>
          <p>
            The short answer is no. Unlike the United States where tips make up a significant portion
            of a stylist&rsquo;s income, Australian hairdressers are paid a fair wage under the
            Hair and Beauty Industry Award. There&rsquo;s no obligation to tip, and you won&rsquo;t
            get a sideways look for paying the exact amount on your bill.
          </p>
          <p>
            That said, tipping is always appreciated. A small tip is a genuine way to say
            &ldquo;thank you&rdquo; when your stylist has done a great job. It&rsquo;s a kind
            gesture, not an expectation.
          </p>

          <h2>How much to tip your hairdresser</h2>
          <p>
            If you decide to tip, there are no hard rules, but here are some common approaches:
          </p>
          <ul>
            <li><strong>5-10% of the service cost</strong> — this is considered generous in Australia</li>
            <li><strong>Round up to the nearest $5 or $10</strong> — e.g. if your cut is $47, leave $50</li>
            <li><strong>A flat $5-$10</strong> — a simple, easy amount for a standard haircut</li>
          </ul>
          <p>
            There&rsquo;s no need to overthink it. Any amount you leave will be appreciated.
          </p>

          <h2>When to tip</h2>
          <p>
            While tipping is never required, there are some situations where it feels especially
            appropriate:
          </p>
          <ul>
            <li>Your stylist went above and beyond — fixed a bad cut from elsewhere, spent extra time, or nailed a tricky colour</li>
            <li>You&rsquo;re celebrating a special occasion — wedding hair, formal styling, or a major transformation</li>
            <li>You&rsquo;ve been seeing the same stylist for years and want to show loyalty</li>
            <li>The service was exceptional and you genuinely want to express gratitude</li>
          </ul>

          <h2>How to tip</h2>
          <p>
            <strong>Cash is preferred.</strong> A cash tip goes directly to your stylist without
            being split or processed. Simply hand it to them at the end of the service or leave it
            at the front desk with a note about who it&rsquo;s for.
          </p>
          <p>
            If you don&rsquo;t have cash, some salons allow you to add a tip when paying by
            EFTPOS or card. Just ask — most stylists will appreciate the thought regardless of
            the method.
          </p>

          <h2>Tipping at barber shops</h2>
          <p>
            The same rules apply at barber shops. Tipping isn&rsquo;t expected, but rounding up or
            leaving a few extra dollars is common — especially for a hot towel shave or a detailed
            fade that takes extra time and skill. If your barber runs a cash-only shop, rounding
            up is the easiest way to show appreciation.
          </p>

          <h2>Tipping for colour and long services</h2>
          <p>
            Colour appointments, balayage, and full-head foils can take 2-4 hours and cost
            significantly more than a standard cut. If you&rsquo;re happy with the result, a tip
            acknowledges the time, skill, and expertise involved. Even $10-$20 on a $250+ service
            is a meaningful gesture for the stylist who spent half a day perfecting your colour.
          </p>

          <h2>Alternatives to tipping</h2>
          <p>
            Money isn&rsquo;t the only way to show your hairdresser you value their work. Some of
            the most meaningful gestures cost nothing at all:
          </p>
          <ul>
            <li><strong>Leave a Google review</strong> — a detailed, positive review helps their business more than you might realise. Mention them by name if you can.</li>
            <li><strong>Refer friends and family</strong> — word-of-mouth referrals are the lifeblood of any salon. Tell people about your stylist.</li>
            <li><strong>Rebook before you leave</strong> — it shows commitment and helps your stylist plan their schedule.</li>
            <li><strong>Tell them you love it</strong> — a simple &ldquo;this is exactly what I wanted&rdquo; genuinely makes a stylist&rsquo;s day.</li>
          </ul>
          <p>
            Great hairdressers invest in their craft — from ongoing training to using quality{' '}
            <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
              professional scissors
            </a>
            . Showing appreciation in any form helps them keep doing what they love.
          </p>

          <h2>The bottom line</h2>
          <p>
            Tipping your hairdresser in Australia is entirely optional but always welcome. If you
            want to tip, 5-10% or rounding up is plenty. If you&rsquo;d rather not, a Google review,
            a referral, or a genuine compliment goes a long way. The most important thing is finding
            a stylist you trust and building a relationship that works for both of you.
          </p>
        </div>

        {/* Related */}
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
