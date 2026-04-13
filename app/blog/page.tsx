import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Blog — Hair Tips & Salon Advice | findme.hair',
  description:
    'Expert advice on choosing hairdressers, understanding salon services, and getting the most from your next appointment. From Australia\'s hair directory.',
  alternates: { canonical: 'https://www.findme.hair/blog' },
  openGraph: {
    title: 'Blog — findme.hair',
    description: 'Expert advice on hairdressers, salons, and barbers across Australia.',
    url: 'https://www.findme.hair/blog',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'website',
  },
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}

const POSTS: BlogPost[] = [
  {
    slug: 'how-to-choose-a-hairdresser',
    title: 'How to Choose the Right Hairdresser for You',
    excerpt:
      'Finding a hairdresser you trust is one of the most important self-care decisions. Here\'s a practical guide to finding the right match based on your hair type, budget, and style goals.',
    date: '2026-04-13',
  },
  {
    slug: 'hair-salon-vs-barber-shop',
    title: 'Hair Salon vs Barber Shop: Which One Should You Choose?',
    excerpt:
      'What\'s the real difference between a hair salon and a barber shop? We break down the services, pricing, atmosphere, and training so you can pick the right fit.',
    date: '2026-04-13',
  },
  {
    slug: 'questions-to-ask-your-hairdresser',
    title: '10 Questions to Ask Your Hairdresser Before Your Next Appointment',
    excerpt:
      'Getting a great haircut starts with great communication. These 10 questions will help you and your stylist get on the same page — before the scissors come out.',
    date: '2026-04-13',
  },
];

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'findme.hair Blog',
        url: 'https://www.findme.hair/blog',
        description: 'Expert advice on choosing hairdressers and understanding salon services in Australia.',
        publisher: { '@type': 'Organization', name: 'findme.hair', url: 'https://www.findme.hair' },
      }} />

      {/* Header */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-editorial-overline">findme.hair</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Blog
          </h1>
          <p className="mt-3 text-[var(--color-ink-light)]">
            Expert advice on hairdressers, salon services, and getting the most from your next appointment.
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-6">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="card p-8 hover:shadow-md transition-shadow group"
            >
              <time className="text-xs text-[var(--color-ink-muted)]">{post.date}</time>
              <h2
                className="mt-2 text-xl text-[var(--color-ink)] group-hover:text-[var(--color-gold-dark)] transition-colors"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-ink-light)] leading-relaxed">
                {post.excerpt}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-[var(--color-gold-dark)]">
                Read more &rarr;
              </span>
            </Link>
          ))}
        </div>

        {/* Internal links */}
        <section className="mt-14 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Find a hairdresser near you
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Darwin', 'Canberra'].map((city) => (
              <Link
                key={city}
                href={`/best-hairdresser/${city.toLowerCase()}`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                Best in {city}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
