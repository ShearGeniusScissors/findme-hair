import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'How to Prepare for Your Hair Appointment — findme.hair',
  description:
    'Everything you need to do before your next salon visit. From reference photos to what to wear, here is how to prepare for a hair appointment so you leave happy.',
  alternates: { canonical: 'https://www.findme.hair/blog/how-to-prepare-for-a-hair-appointment' },
  openGraph: {
    title: 'How to Prepare for Your Hair Appointment',
    description: 'A simple checklist so you walk into the salon confident and walk out happy.',
    url: 'https://www.findme.hair/blog/how-to-prepare-for-a-hair-appointment',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'article',
  },
};

export default function PrepareForAppointmentArticle() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'How to Prepare for Your Hair Appointment',
        datePublished: '2026-04-17',
        dateModified: '2026-04-17',
        author: { '@type': 'Organization', name: 'findme.hair' },
        publisher: { '@type': 'Organization', name: 'findme.hair', url: 'https://www.findme.hair' },
        mainEntityOfPage: 'https://www.findme.hair/blog/how-to-prepare-for-a-hair-appointment',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.findme.hair/blog' },
          { '@type': 'ListItem', position: 3, name: 'How to Prepare for Your Hair Appointment' },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Should I wash my hair before a hair appointment?',
            acceptedAnswer: { '@type': 'Answer', text: 'Generally yes. Arrive with clean, dry hair unless your stylist tells you otherwise. Clean hair is easier to cut accurately, and dry hair shows your natural texture and fall, which helps your stylist plan the cut.' },
          },
          {
            '@type': 'Question',
            name: 'What should I bring to a hair appointment?',
            acceptedAnswer: { '@type': 'Answer', text: 'Bring 2-3 reference photos from different angles, wear a button-up shirt so you can change without ruining your hair afterwards, and know your budget. If it is a colour appointment, bring photos of both the colour and the style you want.' },
          },
          {
            '@type': 'Question',
            name: 'What should I tell my hairdresser at my appointment?',
            acceptedAnswer: { '@type': 'Answer', text: 'Tell your stylist about your lifestyle, how much time you spend styling each morning, what you did not like about your last haircut, and your full hair history including any previous colour or chemical treatments. Honesty helps them deliver the best result.' },
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
            <span className="text-[var(--color-ink)] font-medium">Prepare for Your Appointment</span>
          </nav>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <header>
          <time className="text-xs text-[var(--color-ink-muted)]">17 April 2026</time>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            How to Prepare for Your Hair Appointment
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
            A little preparation goes a long way. Whether it&rsquo;s your first time at a new salon
            or your twentieth visit with your regular stylist, walking in prepared means you&rsquo;ll
            walk out happier with the result.
          </p>
        </header>

        <div className="mt-10 prose-article">
          <h2>Arrive with clean, dry hair</h2>
          <p>
            Unless your stylist specifically asks you to come with unwashed hair, arrive with it
            clean and dry. Clean hair is easier to cut accurately, and dry hair shows your natural
            texture and fall — which helps your stylist plan the cut. Avoid loading up on products
            like dry shampoo or hairspray beforehand, as they change how your hair sits and can
            mask its true condition.
          </p>

          <h2>Bring reference photos</h2>
          <p>
            Save 2&ndash;3 reference photos from different angles — front, side, and back if
            possible. A single photo only tells part of the story. Pictures of what you don&rsquo;t
            want can be just as useful. Show these to your stylist at the start of the appointment
            so you&rsquo;re both on the same page before the scissors come out.
          </p>

          <h2>Know your budget</h2>
          <p>
            Hair services vary widely in price. A simple trim costs far less than a full colour
            transformation. Knowing your budget upfront lets your stylist recommend options that
            fit — and avoids an awkward surprise at the register. If budget is tight, ask what can
            be done in stages across multiple appointments.
          </p>

          <h2>Be honest about your hair history</h2>
          <p>
            Tell your stylist about any previous colour, bleach, keratin treatments, relaxers, or
            perms — even if it was months ago. Chemical history affects how your hair responds to
            new treatments. Leaving something out can lead to damage or unexpected results that
            neither of you wanted.
          </p>

          <h2>Wear a button-up shirt</h2>
          <p>
            It sounds minor, but what you wear matters. A button-up or zip-front top means you
            won&rsquo;t have to pull anything over your head when you change afterwards. Pulling a
            t-shirt over a fresh blowout or a new colour is a fast way to undo the stylist&rsquo;s
            work before you even leave the salon.
          </p>

          <h2>Arrive five minutes early</h2>
          <p>
            Most salons run on tight schedules. Arriving five minutes early gives you time to
            settle in, fill out any forms if it&rsquo;s your first visit, and have a calm start to
            the appointment. Running late eats into your service time, and your stylist may have to
            rush or reschedule you entirely.
          </p>

          <h2>What to tell your stylist</h2>
          <p>
            Beyond showing your reference photos, share a few things that make a real difference:
          </p>
          <ul>
            <li>Your lifestyle — active, office-based, frequently outdoors</li>
            <li>How much time you spend styling each morning (be honest)</li>
            <li>What you didn&rsquo;t like about your last haircut</li>
            <li>Any areas that bother you — cowlicks, thinning spots, uneven growth</li>
          </ul>
          <p>
            This information helps your stylist tailor the cut to your actual life, not just the
            picture on your phone.
          </p>

          <h2>For colour appointments specifically</h2>
          <p>
            If you&rsquo;re booked for colour, do a quick allergy patch test at least 48 hours
            beforehand if your salon requires one. Avoid washing your hair the morning of — a day
            of natural oil actually protects your scalp during the colouring process. Bring photos
            of both the colour and the style you want, since lighting in photos can be deceiving.
            And ask your stylist upfront whether the result is achievable in one session or if
            it&rsquo;ll take multiple visits.
          </p>

          <h2>For first-time visits</h2>
          <p>
            Visiting a new salon can feel uncertain. A few things to look for when you arrive: Is
            the space clean and organised? Does the stylist do a proper consultation before
            starting? Do they listen or talk over you? Pay attention to their tools and setup —
            salons that invest in quality equipment like{' '}
            <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
              professional Japanese steel scissors
            </a>{' '}
            tend to deliver consistently better results. First impressions work both ways, and a
            well-run salon will make you feel welcome from the moment you walk in.
          </p>

          <h2>The bottom line</h2>
          <p>
            Preparing for your hair appointment doesn&rsquo;t take long, but it makes a noticeable
            difference. Clean hair, reference photos, a clear budget, and honest communication set
            you and your stylist up for the best possible result. Treat it like a collaboration —
            because that&rsquo;s exactly what it is.
          </p>
        </div>

        <footer className="mt-14 border-t border-[var(--color-border-light)] pt-8">
          <h2 className="text-lg text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
            Related articles
          </h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link href="/blog/questions-to-ask-your-hairdresser" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                10 Questions to Ask Your Hairdresser Before Your Next Appointment &rarr;
              </Link>
            </li>
            <li>
              <Link href="/blog/how-to-choose-a-hairdresser" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                How to Choose the Right Hairdresser for You &rarr;
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
