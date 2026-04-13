import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: '10 Questions to Ask Your Hairdresser Before Your Next Appointment — findme.hair',
  description:
    'Getting a great haircut starts with great communication. These 10 questions will help you and your stylist get on the same page.',
  alternates: { canonical: 'https://www.findme.hair/blog/questions-to-ask-your-hairdresser' },
  openGraph: {
    title: '10 Questions to Ask Your Hairdresser',
    description: 'Questions that lead to better haircuts — from Australia\'s hair directory.',
    url: 'https://www.findme.hair/blog/questions-to-ask-your-hairdresser',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'article',
  },
};

export default function QuestionsArticle() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: '10 Questions to Ask Your Hairdresser Before Your Next Appointment',
        datePublished: '2026-04-13',
        dateModified: '2026-04-13',
        author: { '@type': 'Organization', name: 'findme.hair' },
        publisher: { '@type': 'Organization', name: 'findme.hair', url: 'https://www.findme.hair' },
        mainEntityOfPage: 'https://www.findme.hair/blog/questions-to-ask-your-hairdresser',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.findme.hair/blog' },
          { '@type': 'ListItem', position: 3, name: '10 Questions to Ask Your Hairdresser' },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What questions should I ask my hairdresser before a haircut?',
            acceptedAnswer: { '@type': 'Answer', text: 'Ask about recommendations for your hair type, how much maintenance the style needs, how often you will need to come back, the total cost, and whether the desired result is achievable in one session.' },
          },
          {
            '@type': 'Question',
            name: 'Should I bring reference photos to my hairdresser?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. Words like "a little off the top" mean different things to different people. Reference photos eliminate miscommunication and help your stylist understand exactly what you want.' },
          },
          {
            '@type': 'Question',
            name: 'What happens if I am not happy with my haircut?',
            acceptedAnswer: { '@type': 'Answer', text: 'Good salons have a redo policy, typically offering a free adjustment within 7-14 days. Ask about this upfront before your appointment. A confident stylist will not be offended by the question.' },
          },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <Chevron />
            <Link href="/blog" className="hover:text-[var(--color-gold-dark)]">Blog</Link>
            <Chevron />
            <span className="text-[var(--color-ink)] font-medium">10 Questions to Ask</span>
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
            10 Questions to Ask Your Hairdresser Before Your Next Appointment
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
            The difference between a good haircut and a great one often comes down to communication.
            Asking the right questions before your stylist picks up the scissors sets both of you up
            for success.
          </p>
        </header>

        <div className="mt-10 prose-article">
          <h2>1. &ldquo;What would you recommend for my hair type?&rdquo;</h2>
          <p>
            A good stylist will have opinions about what works best for your texture, thickness, and
            face shape. This question tells you whether they&rsquo;re paying attention to you as an
            individual — not just applying the same cut to everyone.
          </p>

          <h2>2. &ldquo;How much maintenance will this style need?&rdquo;</h2>
          <p>
            Be honest about how much time you spend on your hair each morning. A high-maintenance
            style looks amazing on day one but becomes frustrating if it doesn&rsquo;t fit your
            routine. Your stylist should match the cut to your lifestyle.
          </p>

          <h2>3. &ldquo;How often will I need to come back?&rdquo;</h2>
          <p>
            Different styles grow out differently. A precision bob might need trimming every 6 weeks,
            while a textured long layer can go 10-12 weeks. Knowing the maintenance schedule helps
            you budget both time and money.
          </p>

          <h2>4. &ldquo;Can you show me on your phone/iPad what you&rsquo;re thinking?&rdquo;</h2>
          <p>
            Words mean different things to different people. &ldquo;A little off the top&rdquo;
            could mean 1cm or 5cm depending on who&rsquo;s talking. Reference photos eliminate
            miscommunication.
          </p>

          <h2>5. &ldquo;What products would you use at home for this?&rdquo;</h2>
          <p>
            Ask this before they start, not at the end when you feel pressured to buy. A trustworthy
            stylist will recommend products based on your needs, not the most expensive bottle on
            the shelf.
          </p>

          <h2>6. &ldquo;Is this achievable in one session?&rdquo;</h2>
          <p>
            This is especially important for colour. Going from dark brown to platinum blonde
            safely takes multiple sessions. A stylist who promises dramatic change in one sitting
            may be cutting corners — literally and chemically.
          </p>

          <h2>7. &ldquo;What&rsquo;s the total cost including everything?&rdquo;</h2>
          <p>
            Ask upfront about the total price including blowdry, toner, treatments, and any
            add-ons. Unexpected charges at the register are the fastest way to lose a client&rsquo;s
            trust.
          </p>

          <h2>8. &ldquo;Do you have experience with [specific technique]?&rdquo;</h2>
          <p>
            If you want balayage, ask if they specialise in it. If you have curly hair, ask how
            many curly clients they see per week. Specificity gets you honest answers.
          </p>

          <h2>9. &ldquo;What happens if I&rsquo;m not happy with the result?&rdquo;</h2>
          <p>
            Good salons have a redo policy — typically a free adjustment within 7-14 days. Asking
            this upfront isn&rsquo;t rude; it&rsquo;s a sign you take the result seriously. A
            confident stylist won&rsquo;t be offended.
          </p>

          <h2>10. &ldquo;Can I book my next appointment now?&rdquo;</h2>
          <p>
            The best stylists book out weeks in advance. If you&rsquo;ve found someone you like,
            secure your next slot before you leave. Many salons on findme.hair offer online
            booking — look for the booking badge on listings.
          </p>

          <h2>The bottom line</h2>
          <p>
            Great communication leads to great haircuts. Don&rsquo;t be shy about asking questions —
            professional stylists welcome them. It shows you care about the result, and it helps
            them do their best work.
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
              <Link href="/blog/hair-salon-vs-barber-shop" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                Hair Salon vs Barber Shop: Which One Should You Choose? &rarr;
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
