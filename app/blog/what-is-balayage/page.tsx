import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'What Is Balayage? Everything You Need to Know — findme.hair',
  description:
    'Learn what balayage is, how it differs from highlights, types of balayage, how much it costs in Australia ($150-$350+), and how to find the right colourist.',
  alternates: { canonical: 'https://www.findme.hair/blog/what-is-balayage' },
  openGraph: {
    title: 'What Is Balayage? Everything You Need to Know',
    description: 'Your complete guide to balayage hair colour in Australia — cost, types, maintenance, and how to find a specialist.',
    url: 'https://www.findme.hair/blog/what-is-balayage',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'article',
  },
};

export default function WhatIsBalayageArticle() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'What Is Balayage? Everything You Need to Know',
        image: 'https://www.findme.hair/og-image.jpg',
        datePublished: '2026-04-17',
        dateModified: '2026-04-17',
        author: { '@type': 'Organization', name: 'findme.hair' },
        publisher: { '@type': 'Organization', name: 'findme.hair', url: 'https://www.findme.hair' },
        mainEntityOfPage: 'https://www.findme.hair/blog/what-is-balayage',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.findme.hair/blog' },
          { '@type': 'ListItem', position: 3, name: 'What Is Balayage?' },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is balayage?',
            acceptedAnswer: { '@type': 'Answer', text: 'Balayage is a French freehand hair colouring technique where lightener is painted directly onto the hair surface. Unlike traditional foil highlights, balayage creates a soft, sun-kissed gradient with no harsh lines as it grows out.' },
          },
          {
            '@type': 'Question',
            name: 'How much does balayage cost in Australia?',
            acceptedAnswer: { '@type': 'Answer', text: 'Balayage in Australia typically costs between $150 and $350 or more, depending on hair length, thickness, the number of tones used, and the salon location. Capital city salons and senior colourists tend to charge at the higher end.' },
          },
          {
            '@type': 'Question',
            name: 'How long does balayage last?',
            acceptedAnswer: { '@type': 'Answer', text: 'Balayage can last 3 to 6 months between appointments because the colour grows out naturally without a visible regrowth line. Touch-ups are needed less frequently than traditional highlights, making it a lower-maintenance option.' },
          },
          {
            '@type': 'Question',
            name: 'What is the difference between balayage and highlights?',
            acceptedAnswer: { '@type': 'Answer', text: 'Highlights use foils to create uniform, evenly spaced lightened sections from root to tip. Balayage is painted freehand onto the surface of the hair, creating a softer, more natural-looking gradient that concentrates colour toward the ends.' },
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
            <span className="text-[var(--color-ink)] font-medium">What Is Balayage?</span>
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
            What Is Balayage? Everything You Need to Know
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
            Balayage is one of the most requested colour techniques in Australian salons &mdash; and
            for good reason. It&rsquo;s versatile, low-maintenance, and works on almost every hair
            type. Here&rsquo;s everything you need to know before booking your appointment.
          </p>
        </header>

        <div className="mt-10 prose-article">
          <h2>What balayage actually is</h2>
          <p>
            Balayage (pronounced &ldquo;bah-lee-ahj&rdquo;) is a French word meaning &ldquo;to
            sweep.&rdquo; It&rsquo;s a freehand hair colouring technique where lightener is painted
            directly onto the surface of the hair, rather than being wrapped in foils. The result is
            a soft, sun-kissed gradient that looks natural and grows out beautifully without harsh
            regrowth lines.
          </p>
          <p>
            Because the colourist paints each section by hand, no two balayage results are exactly
            the same. The technique allows for a completely customised look that&rsquo;s tailored to
            your face shape, skin tone, and personal style.
          </p>

          <h2>Balayage vs highlights: the key differences</h2>
          <p>
            People often confuse balayage with traditional highlights, but the techniques and results
            are quite different:
          </p>
          <ul>
            <li><strong>Application:</strong> Highlights use foils to saturate uniform sections from root to tip. Balayage is painted freehand onto the hair surface with no foils.</li>
            <li><strong>Result:</strong> Highlights create even, consistent lightness. Balayage creates a softer, more graduated effect that&rsquo;s concentrated toward the ends.</li>
            <li><strong>Regrowth:</strong> Highlights show a visible regrowth line within 6&ndash;8 weeks. Balayage blends as it grows out, lasting 3&ndash;6 months between touch-ups.</li>
            <li><strong>Maintenance:</strong> Balayage is lower maintenance overall because of that seamless grow-out.</li>
          </ul>

          <h2>Types of balayage</h2>
          <p>
            There isn&rsquo;t just one way to do balayage. Your colourist will recommend a variation
            based on your hair colour, condition, and the look you&rsquo;re after.
          </p>
          <h3>Classic balayage</h3>
          <p>
            The most popular option. Lighter tones are swept through the mid-lengths and ends while
            keeping the roots your natural colour. It works on brunettes, blondes, and redheads
            alike, creating that effortless &ldquo;I just came back from the beach&rdquo; look.
          </p>
          <h3>Reverse balayage</h3>
          <p>
            Instead of going lighter, reverse balayage adds darker, richer tones through the
            mid-lengths and ends. It&rsquo;s ideal for blondes who want more depth and dimension
            without fully committing to a darker shade.
          </p>
          <h3>Partial balayage</h3>
          <p>
            A partial balayage focuses on specific sections &mdash; typically the face-framing
            pieces and the top layer of hair. It&rsquo;s a more subtle, budget-friendly option
            that still adds movement and brightness where it counts most.
          </p>

          <h2>How much does balayage cost in Australia?</h2>
          <p>
            In Australia, balayage typically costs between <strong>$150 and $350+</strong>, depending
            on several factors:
          </p>
          <ul>
            <li><strong>Hair length and thickness:</strong> Longer, thicker hair requires more product and more time.</li>
            <li><strong>Number of tones:</strong> A multi-tonal balayage with blending and toning costs more than a simple single-tone sweep.</li>
            <li><strong>Salon location:</strong> Capital city salons in Sydney, Melbourne, and Brisbane tend to charge more than regional salons.</li>
            <li><strong>Stylist experience:</strong> Senior colourists and balayage specialists command higher prices, but the results are usually worth it.</li>
          </ul>
          <p>
            A partial balayage might start from $150, while a full balayage with toner on long,
            thick hair at a top-tier salon can exceed $400. Always ask for a quote during your
            consultation.
          </p>

          <h2>How long does balayage last?</h2>
          <p>
            One of balayage&rsquo;s biggest selling points is longevity. Because there&rsquo;s no
            sharp demarcation line at the roots, balayage grows out gracefully over <strong>3 to 6
            months</strong>. Many clients only need 2&ndash;3 appointments per year to maintain their
            colour, compared to 6&ndash;8 foil sessions for traditional highlights.
          </p>
          <p>
            How long yours lasts depends on how quickly your hair grows, the contrast between your
            natural colour and the balayage tones, and how well you maintain it at home.
          </p>

          <h2>Maintenance tips</h2>
          <p>
            To keep your balayage looking fresh between appointments:
          </p>
          <ul>
            <li>Use a sulphate-free shampoo to prevent colour from fading.</li>
            <li>Apply a weekly hair mask or deep conditioner &mdash; lightened hair needs extra moisture.</li>
            <li>Limit heat styling, and always use a heat protectant when you do.</li>
            <li>Use a purple shampoo once a week if your balayage has cool or ashy tones to prevent brassiness.</li>
            <li>Protect your hair from UV exposure with a leave-in SPF spray during summer.</li>
          </ul>

          <h2>Choosing a balayage specialist</h2>
          <p>
            Balayage is a technique that relies entirely on the colourist&rsquo;s skill and artistic
            eye. Not every hairdresser is equally experienced with freehand colour work. When
            choosing a specialist, look for:
          </p>
          <ul>
            <li>Before-and-after photos on their social media or website &mdash; consistency matters more than one perfect result.</li>
            <li>Reviews that specifically mention colour work and balayage.</li>
            <li>A willingness to do a consultation before your appointment.</li>
            <li>Training or certification in colour techniques.</li>
          </ul>
          <p>
            The best colourists also invest in their tools. Precision cutting and blending require
            quality equipment &mdash; from colour brushes to{' '}
            <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
              professional hairdressing scissors
            </a>{' '}
            made from Japanese steel. If a stylist cares about their tools, they care about the
            craft.
          </p>

          <h2>Is balayage right for you?</h2>
          <p>
            Balayage works on virtually every hair type and colour, but it&rsquo;s especially well
            suited if:
          </p>
          <ul>
            <li>You want a natural, low-maintenance colour that doesn&rsquo;t need constant upkeep.</li>
            <li>You prefer a soft, blended look rather than uniform streaks.</li>
            <li>You&rsquo;re new to colour and want something subtle to start with.</li>
            <li>You have a busy schedule and can&rsquo;t get to the salon every 6 weeks.</li>
          </ul>
          <p>
            If you&rsquo;re after a more dramatic, all-over blonde or a very precise, even
            result, traditional highlights or a full colour might be a better fit. Your colourist
            can help you decide during a consultation.
          </p>

          <h2>The bottom line</h2>
          <p>
            Balayage remains one of the most popular colour techniques in Australia for a reason
            &mdash; it&rsquo;s customisable, flattering, and easy to maintain. The key is finding a
            skilled colourist who understands the technique and takes the time to tailor it to you.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10">
          <Link href="/services/balayage-specialist" className="btn-gold text-sm !py-2 !px-5">
            Find a balayage specialist
          </Link>
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
