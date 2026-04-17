import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Salon Owners | findme.hair',
  description:
    'Claim your free listing on Australia\'s dedicated hair salon and barber directory. Add photos, connect booking, and get found by local clients.',
};

export default function ForSalonsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <p className="text-editorial-overline">For Salon &amp; Barber Owners</p>
          <h1
            className="mt-4 text-4xl text-[var(--color-ink)] sm:text-5xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Get found by clients<br />
            <span className="text-[var(--color-gold)]">looking for you</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-ink-light)]">
            findme.hair is Australia&rsquo;s dedicated hair salon and barber directory.
            No beauty. No nails. No spa. Just hair &mdash; so clients searching for a haircut find <em>you</em>.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/claim" className="btn-gold text-base !py-3.5 !px-8">
              Claim your listing &mdash; it&rsquo;s free
            </Link>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <p className="text-editorial-overline">What&rsquo;s included</p>
            <h2
              className="mt-3 text-3xl text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Everything you need, nothing you don&rsquo;t
            </h2>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              title="Your own profile page"
              description="A dedicated page for your salon with your address, phone, description, and Google reviews. SEO-optimised so clients find you."
            />
            <Feature
              title="Photo gallery"
              description="Showcase your space and work. Photos are pulled from Google automatically, and you can add your own once claimed."
            />
            <Feature
              title="Booking integration"
              description="Connect your Fresha, Kitomba, Timely, or Shortcuts account. Clients book directly from your listing."
            />
            <Feature
              title="Opening hours"
              description="Display your hours prominently. Clients see whether you're open right now before they even pick up the phone."
            />
            <Feature
              title="Google reviews"
              description="Your star rating and review count from Google are shown on your listing. Social proof that works."
            />
            <Feature
              title="Verified badge"
              description="Listings are cross-checked against Google, TrueLocal, and Yellow Pages. Verified salons earn a trust badge."
            />
            <Feature
              title="Professional tools matter"
              description="Clients notice when their stylist uses quality equipment. Investing in professional Japanese steel scissors — like those from ShearGenius — shows you take your craft seriously."
              link={{ text: 'Shop professional scissors', href: 'https://www.sheargenius.com.au' }}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="text-center">
            <p className="text-editorial-overline">How it works</p>
            <h2
              className="mt-3 text-3xl text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Three steps. Five minutes.
            </h2>
          </div>

          <div className="mt-14 space-y-12">
            <Step
              number="01"
              title="Find your salon"
              description="Search for your salon name or suburb. If we've already scraped your area, your listing is waiting."
            />
            <Step
              number="02"
              title="Claim it"
              description="Click 'Claim this listing' and verify you're the owner. We'll confirm via your listed phone number or email."
            />
            <Step
              number="03"
              title="Make it yours"
              description="Add photos, update your hours, connect your booking system, and write a description. Your listing, your way."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--color-surface)]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center">
            <p className="text-editorial-overline">FAQ</p>
            <h2
              className="mt-3 text-3xl text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Common questions
            </h2>
          </div>

          <div className="mt-12 space-y-6">
            <FaqItem
              question="Is it really free?"
              answer="Yes. Claiming and managing your listing is completely free. We may introduce optional premium features in the future, but your core listing will always be free."
            />
            <FaqItem
              question="How is findme.hair different from Google?"
              answer="We're hair and barber only. Google mixes in beauty salons, nail bars, and day spas. We verify every listing to ensure it's a genuine hair salon or barber shop — nothing else."
            />
            <FaqItem
              question="What if my salon isn't listed yet?"
              answer="We're expanding across Australia week by week. If your suburb isn't covered yet, contact us and we'll prioritise it."
            />
            <FaqItem
              question="Can I edit my listing?"
              answer="Once claimed, you'll have a dashboard where you can update your description, photos, hours, and booking link at any time."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--color-ink)]">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2
            className="text-3xl text-[var(--color-white)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Ready to be found?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-neutral-400">
            Join thousands of Australian hair salons and barber shops on the country&rsquo;s
            dedicated hair directory.
          </p>
          <Link href="/claim" className="btn-gold mt-8">
            Claim your free listing
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ─── Sub-components ────────────────────────────────────── */

function Feature({ title, description, link }: { title: string; description: string; link?: { text: string; href: string } }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-[var(--color-ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-light)]">{description}</p>
      {link && (
        <a href={link.href} target="_blank" rel="noopener" className="mt-2 inline-block text-xs text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
          {link.text} &rarr;
        </a>
      )}
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6">
      <span
        className="flex-shrink-0 text-3xl font-normal text-[var(--color-gold)]"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {number}
      </span>
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-light)]">{description}</p>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-[var(--color-ink)]">{question}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-light)]">{answer}</p>
    </div>
  );
}
