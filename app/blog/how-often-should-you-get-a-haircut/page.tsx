import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'How Often Should You Get a Haircut? — findme.hair',
  description:
    'How often you should get a haircut depends on your hair length, type, and style. Short hair and fades need trims every 3-4 weeks, medium every 6-8, and long hair every 8-12 weeks.',
  alternates: { canonical: 'https://www.findme.hair/blog/how-often-should-you-get-a-haircut', languages: { 'en-AU': 'https://www.findme.hair/blog/how-often-should-you-get-a-haircut', 'x-default': 'https://www.findme.hair/blog/how-often-should-you-get-a-haircut' } },
  openGraph: {
    title: 'How Often Should You Get a Haircut?',
    description: 'A practical guide to haircut frequency based on your hair length, type, and style goals.',
    url: 'https://www.findme.hair/blog/how-often-should-you-get-a-haircut',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'article',
    images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function HowOftenHaircutArticle() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'How Often Should You Get a Haircut?',
        image: 'https://www.findme.hair/og-image.jpg',
        datePublished: '2026-04-17',
        dateModified: '2026-04-17',
        author: { '@type': 'Organization', name: 'findme.hair' },
        publisher: { '@type': 'Organization', name: 'findme.hair', url: 'https://www.findme.hair' },
        mainEntityOfPage: 'https://www.findme.hair/blog/how-often-should-you-get-a-haircut',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.findme.hair/blog' },
          { '@type': 'ListItem', position: 3, name: 'How Often Should You Get a Haircut?' },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How often should you get a haircut?',
            acceptedAnswer: { '@type': 'Answer', text: 'It depends on your hair length and style. Short hair and fades need trimming every 3-4 weeks, medium-length hair every 6-8 weeks, and long hair every 8-12 weeks. Curly hair generally needs cutting every 8-12 weeks by a curl specialist.' },
          },
          {
            '@type': 'Question',
            name: 'How often should men get a haircut compared to women?',
            acceptedAnswer: { '@type': 'Answer', text: 'Men with short styles or fades typically need a trim every 3-4 weeks. Women with medium to long hair usually visit every 6-12 weeks. The real factor is the style, not gender - a woman with a pixie cut needs trims just as often as a man with a fade.' },
          },
          {
            '@type': 'Question',
            name: 'Should I still get haircuts if I am growing my hair out?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. Even when growing your hair out, you should get a light trim every 10-12 weeks to remove split ends and keep the shape balanced. Skipping trims entirely leads to breakage and uneven growth.' },
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
            <span className="text-[var(--color-ink)] font-medium">How Often Should You Get a Haircut?</span>
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
            How Often Should You Get a Haircut?
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
            There&rsquo;s no single answer that works for everyone. How often you need a haircut depends
            on your hair length, texture, and the style you&rsquo;re maintaining. Here&rsquo;s a
            straightforward guide based on real-world timelines.
          </p>
        </header>

        <div className="mt-10 prose-article">
          <h2>Short hair and fades: every 3&ndash;4 weeks</h2>
          <p>
            If you&rsquo;re wearing a fade, crew cut, or any style that relies on clean lines and tight
            shaping, you&rsquo;ll need to visit your barber or stylist every 3 to 4 weeks. Fades grow
            out quickly &mdash; by week four, the blending starts to look uneven and the neckline
            loses definition.
          </p>
          <p>
            This applies to both men and women with cropped styles. A pixie cut needs the same
            maintenance as a short back and sides.
          </p>

          <h2>Medium-length hair: every 6&ndash;8 weeks</h2>
          <p>
            For shoulder-length or mid-length styles, 6 to 8 weeks is the sweet spot. This gives your
            hair enough time to grow without losing its shape. If you have layers, they&rsquo;ll start
            to blend together and lose movement around the 8-week mark.
          </p>
          <p>
            If you colour your hair, syncing your trims with your colour appointments makes life
            easier and keeps everything looking fresh at the same time.
          </p>

          <h2>Long hair: every 8&ndash;12 weeks</h2>
          <p>
            Long hair doesn&rsquo;t need cutting as frequently, but it still needs regular trims.
            Without them, split ends travel up the hair shaft and cause breakage &mdash; which
            actually makes your hair shorter over time. Aim for a trim every 8 to 12 weeks to keep
            ends healthy and the overall shape balanced.
          </p>

          <h2>Curly and textured hair: every 8&ndash;12 weeks (see a specialist)</h2>
          <p>
            Curly hair has its own rules. Because curls shrink as they dry, cutting curly hair
            straight across creates uneven results. You should see a stylist who specialises in
            curly or textured hair and knows how to cut dry or using curl-specific techniques.
          </p>
          <p>
            Most curly hair types do well with trims every 8 to 12 weeks. Tighter coils can often
            stretch to 12 weeks, while looser waves might need attention closer to 8. A curl
            specialist will give you a timeline that works for your specific pattern.
          </p>

          <h2>Men vs women: does gender matter?</h2>
          <p>
            Not really. The frequency depends on the style, not the person wearing it. A man with a
            skin fade needs trims every 3 weeks. A woman with a bob needs them every 6. A man
            growing out a longer style can go 10&ndash;12 weeks. The only difference is that
            some men&rsquo;s styles (especially fades) are more maintenance-heavy by nature.
          </p>

          <h2>Growing your hair out? Still trim every 10&ndash;12 weeks</h2>
          <p>
            One of the biggest mistakes people make when growing their hair is skipping trims entirely.
            It seems counterintuitive &mdash; why cut hair you&rsquo;re trying to grow? But without
            occasional trims, split ends cause breakage and the shape becomes uneven. A light trim
            every 10 to 12 weeks removes damage without sacrificing length.
          </p>
          <p>
            Tell your stylist you&rsquo;re growing it out. A good hairdresser will take off just
            enough to keep things healthy and shape the cut so it looks intentional at every stage.
          </p>

          <h2>Signs you need a haircut</h2>
          <p>
            Not sure if it&rsquo;s time? Here are the giveaways:
          </p>
          <ul>
            <li>Split ends are visible, especially when you hold hair up to the light</li>
            <li>Your style has lost its shape and looks &ldquo;grown out&rdquo;</li>
            <li>Your hair won&rsquo;t hold a style or sit the way it used to</li>
            <li>Ends feel dry, rough, or tangly even after conditioning</li>
            <li>You&rsquo;re tying it up every day because it won&rsquo;t cooperate</li>
          </ul>
          <p>
            Split ends happen faster when your stylist&rsquo;s scissors are dull or damaged &mdash;
            blunt blades crush the hair fibre instead of making a clean cut. Quality salons invest
            in sharp,{' '}
            <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
              professional hairdressing scissors
            </a>{' '}
            made from Japanese steel, which makes a real difference in how long your cut lasts between
            visits.
          </p>

          <h2>How to make your haircut last longer</h2>
          <p>
            You can stretch the time between appointments with a few simple habits:
          </p>
          <ul>
            <li>Use a heat protectant every time you use hot tools</li>
            <li>Sleep on a silk or satin pillowcase to reduce friction and breakage</li>
            <li>Avoid over-washing &mdash; 2 to 3 times a week is plenty for most hair types</li>
            <li>Use the products your stylist recommends (they picked them for your hair, not to upsell you)</li>
            <li>Get regular trims on schedule instead of waiting until it&rsquo;s a problem</li>
          </ul>

          <h2>The bottom line</h2>
          <p>
            The right trim schedule keeps your hair looking sharp, feeling healthy, and saves you
            money in the long run by preventing damage. Whether you need a cut every 3 weeks or
            every 12, the key is consistency. Find a stylist who understands your hair and book
            your next appointment before you leave the chair.
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
              <Link href="/blog/how-much-does-a-haircut-cost-in-australia" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                How Much Does a Haircut Cost in Australia? &rarr;
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
