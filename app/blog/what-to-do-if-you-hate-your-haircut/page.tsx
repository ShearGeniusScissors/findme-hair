import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'What to Do If You Hate Your Haircut — findme.hair',
  description:
    'Hate your haircut? Don\u2019t panic. Here\u2019s what to do next \u2014 from giving it a few days to talking to your stylist, finding a new one, and preventing bad haircuts in the future.',
  alternates: { canonical: 'https://www.findme.hair/blog/what-to-do-if-you-hate-your-haircut' },
  openGraph: {
    title: 'What to Do If You Hate Your Haircut',
    description: 'A practical guide to fixing a bad haircut \u2014 from Australia\u2019s hair directory.',
    url: 'https://www.findme.hair/blog/what-to-do-if-you-hate-your-haircut',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'article',
  },
};

export default function HateHaircutArticle() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'What to Do If You Hate Your Haircut',
        datePublished: '2026-04-17',
        dateModified: '2026-04-17',
        author: { '@type': 'Organization', name: 'findme.hair' },
        publisher: { '@type': 'Organization', name: 'findme.hair', url: 'https://www.findme.hair' },
        mainEntityOfPage: 'https://www.findme.hair/blog/what-to-do-if-you-hate-your-haircut',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.findme.hair/blog' },
          { '@type': 'ListItem', position: 3, name: 'What to Do If You Hate Your Haircut' },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Can I go back to the salon if I hate my haircut?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. Most reputable salons offer a free fix or adjustment within 7 to 14 days of your appointment. Call the salon, explain what you are unhappy with, and book a follow-up. A good stylist will want to make it right.' },
          },
          {
            '@type': 'Question',
            name: 'How long should I wait before deciding I hate my haircut?',
            acceptedAnswer: { '@type': 'Answer', text: 'Give it at least 2 to 3 days. A freshly cut style can look and feel unfamiliar at first. Once you have washed and styled it yourself a couple of times, you will have a much clearer idea of whether the cut genuinely does not work for you.' },
          },
          {
            '@type': 'Question',
            name: 'What should I say when I go back to the salon about a bad haircut?',
            acceptedAnswer: { '@type': 'Answer', text: 'Be specific and calm. Instead of saying you hate it, describe exactly what is wrong: the fringe is too short, the layers feel too heavy, or one side looks uneven. Bring reference photos of what you originally wanted so your stylist can see the gap between the expectation and the result.' },
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
            <span className="text-[var(--color-ink)] font-medium">What to Do If You Hate Your Haircut</span>
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
            What to Do If You Hate Your Haircut
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-light)] leading-relaxed">
            You sat down in the chair full of hope. You left wanting to cry. If you&rsquo;ve ever
            walked out of a salon thinking &ldquo;I hate my haircut,&rdquo; you&rsquo;re not alone
            &mdash; and it&rsquo;s almost always fixable. Here&rsquo;s what to do next.
          </p>
        </header>

        <div className="mt-10 prose-article">
          <h2>Don&rsquo;t panic &mdash; it&rsquo;s fixable</h2>
          <p>
            The moment you see a haircut you don&rsquo;t like, your stomach drops. But take a breath.
            Very few haircuts are truly beyond repair. Hair grows, styles can be adjusted, and most
            problems have a practical solution. The worst thing you can do right now is grab a pair of
            kitchen scissors and try to fix it yourself.
          </p>

          <h2>Give it a few days</h2>
          <p>
            This sounds counterintuitive when you&rsquo;re staring at a cut you hate, but hear us out.
            A brand-new haircut often looks and feels unfamiliar simply because it&rsquo;s different.
            Your stylist blow-dried it in a way you might not replicate at home. The shape settles after
            a couple of washes. Give yourself 2&ndash;3 days to live with it, style it your own way, and
            then decide how you really feel. You might be surprised.
          </p>

          <h2>Talk to your stylist</h2>
          <p>
            If a few days pass and you&rsquo;re still unhappy, contact the salon. Most reputable salons
            offer a free adjustment within 7&ndash;14 days of your appointment. This isn&rsquo;t an
            unusual request &mdash; it happens, and good stylists would rather fix the problem than lose
            a client. Call, explain what&rsquo;s bothering you, and book a follow-up appointment.
          </p>
          <p>
            Don&rsquo;t feel guilty about going back. Professional hairdressers genuinely want you to
            leave happy. It&rsquo;s part of the job.
          </p>

          <h2>What to say when you go back</h2>
          <p>
            This is where most people struggle. Walking back into the salon feels awkward, and
            emotions can make the conversation harder than it needs to be. Here&rsquo;s how to
            handle it:
          </p>
          <ul>
            <li>
              <strong>Be specific, not emotional.</strong> Instead of &ldquo;I hate it,&rdquo; try
              &ldquo;the fringe feels too short&rdquo; or &ldquo;the layers are heavier than I
              wanted.&rdquo; Specific feedback gives your stylist something to work with.
            </li>
            <li>
              <strong>Bring reference photos.</strong> Show what you originally wanted alongside a
              photo of what you got. The visual comparison makes the gap obvious and removes any
              guesswork.
            </li>
            <li>
              <strong>Stay calm and constructive.</strong> You&rsquo;re not there to blame anyone.
              You&rsquo;re there to collaborate on a fix. A good stylist will appreciate the honesty.
            </li>
          </ul>

          <h2>When to find a new stylist</h2>
          <p>
            Sometimes the fix isn&rsquo;t about adjusting the haircut &mdash; it&rsquo;s about
            finding the right person. Consider looking for a new stylist if:
          </p>
          <ul>
            <li>Your stylist gets defensive or dismissive when you raise concerns.</li>
            <li>This is the second or third time you&rsquo;ve left unhappy.</li>
            <li>They didn&rsquo;t listen during the consultation or rushed through it.</li>
            <li>The salon refuses to offer any kind of adjustment or redo.</li>
          </ul>
          <p>
            Loyalty is admirable, but your hair matters. If the relationship isn&rsquo;t working,
            it&rsquo;s okay to move on.
          </p>

          <h2>How to prevent bad haircuts next time</h2>
          <p>
            Prevention is always better than damage control. A few habits that dramatically reduce
            the chances of leaving a salon disappointed:
          </p>
          <ul>
            <li>
              <strong>Book a consultation first.</strong> Many salons offer free 10-minute consultations
              before you commit. Use that time to see if you and the stylist are on the same page.
            </li>
            <li>
              <strong>Bring reference photos.</strong> At least two or three images of the style you
              want. Words like &ldquo;a bit shorter&rdquo; are vague. Photos are not.
            </li>
            <li>
              <strong>Communicate what you don&rsquo;t want.</strong> Telling your stylist what you
              hate is just as useful as telling them what you love.
            </li>
            <li>
              <strong>Look at the salon&rsquo;s tools and environment.</strong> One sign of a quality
              salon is their investment in professional equipment. Hairdressers who use precision-ground{' '}
              <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                Japanese steel scissors
              </a>{' '}
              deliver cleaner, more accurate cuts &mdash; and it shows in the finished result.
            </li>
            <li>
              <strong>Read reviews before booking.</strong> Look for stylists with consistent positive
              feedback, not just a high star rating. Pay attention to what clients say about
              communication and listening skills.
            </li>
          </ul>

          <h2>Your rights as a client</h2>
          <p>
            You are paying for a service, and you deserve to be happy with the result. You have every
            right to:
          </p>
          <ul>
            <li>Speak up during the cut if something looks wrong.</li>
            <li>Ask for an adjustment within the salon&rsquo;s redo window.</li>
            <li>Leave a salon that makes you feel rushed, ignored, or pressured.</li>
            <li>Choose a new stylist at any time, for any reason.</li>
          </ul>
          <p>
            A great hairdresser-client relationship is built on trust, communication, and mutual
            respect. If any of those are missing, it&rsquo;s not the right fit &mdash; and that&rsquo;s
            nobody&rsquo;s fault.
          </p>

          <h2>The bottom line</h2>
          <p>
            Hating your haircut feels awful in the moment, but it&rsquo;s rarely permanent. Give it
            a few days, talk to your stylist, and if the relationship isn&rsquo;t working, find
            someone new. The right hairdresser is out there &mdash; sometimes you just have to
            look a little harder.
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
              Find a better hairdresser
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
