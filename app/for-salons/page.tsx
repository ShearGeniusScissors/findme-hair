import type { Metadata } from 'next';
import Link from 'next/link';
import { sgLink, tagged } from '@/lib/outbound';
import { formatAud, formatLengths, getLiveProduct, type LiveProduct } from '@/lib/sgProducts';

// Scissor picks for salon owners (19 Nov 2026). Matt Grumley's approved picks and
// strengths only (memory/NOW rulings 15 Oct, 2–3 Nov, 19 Nov); prices and lengths
// are read live from the ShearGenius storefront (lib/sgProducts), never typed here.
// Handles resolved from the live collection JSON on 19 Nov 2026.
type Pick = {
  need: string;
  model: string;
  handle: string;
  why: string;
  /** Second product shown on the same card (e.g. the left-handed version). */
  extra?: { label: string; handle: string };
};
const PICKS: Pick[] = [
  {
    need: 'Team kits: an all-rounder for every stylist',
    model: 'Geisha',
    handle: 'geisha-professional-hairdressing-scissors',
    why: "One of Matt's two all-rounder picks: it does the lot.",
    extra: { label: 'Left-handed Geisha', handle: 'geisha-left-handed' },
  },
  {
    need: 'Team kits: the other all-rounder pick',
    model: 'Rose Tattoo',
    handle: 'rose-tattoo-professional-hairdressing-scissors',
    why: "Matt's other all-rounder pick: VG10 steel at 60 HRC, engraved and hand-painted pink.",
  },
  {
    need: 'Barbers',
    model: 'Emperor',
    handle: 'emperor-professional-hairdressing-scissors',
    why: "Matt's pick for barbers: an all-rounder that is better for scissor-over-comb.",
  },
  {
    need: 'Busy salons',
    model: 'Firebird',
    handle: 'firebird-shears',
    why: "Matt's pick for busy salons. A hairdressing scissor and a good all-rounder, not just a barber scissor.",
  },
  {
    need: 'Detail work, curly hair and dry cutting',
    model: 'Diamond',
    handle: 'diamond-professional-hairdressing-scissors',
    why: 'A wide blade with an exaggerated radius, so it slides better: dry slide cutting, coarse dry hair, detail work and curly hair.',
  },
  {
    need: 'The high-end chair',
    model: 'Prodigy',
    handle: 'prodigy-professional-hairdressing-scissors',
    why: "Matt's high-end pick.",
  },
  {
    need: 'Apprentices',
    model: 'Young Genius',
    handle: 'young-genius-hairdressing-scissor',
    why: "Matt's pick for apprentices starting out.",
  },
];

const path = 'https://www.findme.hair/for-salons';
const title = 'For Salon Owners | findme.hair';
const description =
  'Claim your free listing on Australia\'s dedicated hair salon and barber directory. Add photos, connect booking, and get found by local clients.';

export const metadata: Metadata = {
  title,
  description,
  // Without an explicit canonical this page inherited the site-wide default and
  // canonicalised to the homepage, telling Google it was a duplicate of "/" —
  // which de-indexes the salon-acquisition page. Self-canonical restored.
  alternates: { canonical: path, languages: { 'en-AU': path, 'x-default': path } },
  openGraph: {
    title, description, url: path, siteName: 'findme.hair', locale: 'en_AU', type: 'website',
    images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title, description },
};

export default async function ForSalonsPage() {
  const handles = Array.from(new Set(PICKS.flatMap((p) => [p.handle, ...(p.extra ? [p.extra.handle] : [])])));
  const live = new Map<string, LiveProduct | null>(
    await Promise.all(handles.map(async (h) => [h, await getLiveProduct(h)] as const)),
  );
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
              description="Showcase your space and work — according to Google, businesses with photos get 42% more direction requests and 35% more website clicks. Add yours free once claimed."
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
              title="Claimed badge"
              description="Listings are matched to their Google Business Profiles. Owners who claim their listing get a Claimed badge on it."
            />
            <Feature
              title="The business side"
              description="Shear Profit's free calculators work out your break-even, chair utilisation and the true cost of a rostered hour from your own numbers."
              link={{ text: 'Free salon profit tools', href: tagged('https://www.shearprofit.com.au/tools', { page: 'for-salons', block: 'shear-profit-card' }) }}
            />
            <Feature
              title="Scissors for the team"
              description="Shearlo sells professional all-rounder scissors online, with a six-question finder that matches each stylist to scissors that fit."
              link={{ text: 'Shop Shearlo', href: tagged('https://www.shearlo.com/', { page: 'for-salons', block: 'shearlo-card' }) }}
            />
          </div>
        </div>
      </section>

      {/* Choosing scissors for the team — need → model → why → lengths → live price → link */}
      <section className="bg-[var(--color-white)]" id="choosing-scissors">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <p className="text-editorial-overline">Professional resource</p>
            <h2
              className="mt-3 text-3xl text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Choosing scissors for your team
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-light)]">
              Picks by need from Matt Grumley, the ShearGenius scissorsmith, behind the chair since 1990.
              Every ShearGenius cutting scissor except the Slider is an all-rounder: slide cutting,
              chipping, channelling, point cutting and blunt cutting. So the choice comes down to length,
              then price and steel.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PICKS.map((p) => {
              const lp = live.get(p.handle) ?? null;
              const extra = p.extra ? live.get(p.extra.handle) ?? null : null;
              return (
                <div key={p.handle} className="card p-6 flex flex-col">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">{p.need}</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{p.model}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-light)]">{p.why}</p>
                  <dl className="mt-3 space-y-1 text-sm text-[var(--color-ink-light)]">
                    {lp && lp.lengths.length > 0 && (
                      <div><dt className="inline font-medium text-[var(--color-ink)]">Lengths in stock: </dt><dd className="inline">{formatLengths(lp.lengths)}</dd></div>
                    )}
                    {lp && lp.fromPrice != null && (
                      <div><dt className="inline font-medium text-[var(--color-ink)]">Price today: </dt><dd className="inline">from {formatAud(lp.fromPrice)}</dd></div>
                    )}
                    {p.extra && extra && extra.lengths.length > 0 && (
                      <div><dt className="inline font-medium text-[var(--color-ink)]">{p.extra.label}: </dt><dd className="inline">{formatLengths(extra.lengths)}{extra.fromPrice != null && <>, from {formatAud(extra.fromPrice)}</>}</dd></div>
                    )}
                  </dl>
                  <p className="mt-auto pt-4 text-sm text-[var(--color-ink-light)]">
                    See the {p.model} at{' '}
                    <a
                      href={sgLink(`/products/${p.handle}`, { page: 'for-salons', block: `pick-${p.handle}` })}
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                    >
                      ShearGenius
                    </a>
                    {p.extra && (
                      <>
                        {' '}(left-handed:{' '}
                        <a
                          href={sgLink(`/products/${p.extra.handle}`, { page: 'for-salons', block: `pick-${p.extra.handle}` })}
                          target="_blank"
                          rel="noopener"
                          className="font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                        >
                          ShearGenius
                        </a>
                        )
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs text-[var(--color-ink-muted)]">
            Prices and lengths are read from the ShearGenius online store and refreshed every 10 minutes.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            <div className="card p-6">
              <h3 className="font-semibold text-[var(--color-ink)]">Keeping the team&rsquo;s scissors sharp</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-light)]">
                How often to sharpen, what it costs and how to judge a sharpener: our{' '}
                <Link href="/scissor-sharpening" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">scissor sharpening guide</Link>.{' '}
                <a
                  href={sgLink('/pages/hairdressing-scissor-sharpening-service', { page: 'for-salons', block: 'sharpening-service' })}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                >
                  ShearGenius
                </a>{' '}
                sharpens on the road across Victoria and Tasmania, plus Mount Gambier and Millicent.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-[var(--color-ink)]">Care and troubleshooting</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-light)]">
                Care routines and troubleshooting guides for professional scissors:{' '}
                <a
                  href={tagged('https://www.hairdressingscissors.org/', { page: 'for-salons', block: 'care-guides' })}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                >
                  hairdressingscissors.org
                </a>.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-[var(--color-ink)]">Compare before you buy</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-light)]">
                Every ShearGenius model with its steel, hardness and lengths:{' '}
                <a
                  href={tagged('https://www.hairdressingscissors.net/shop', { page: 'for-salons', block: 'net-shop' })}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]"
                >
                  the hairdressingscissors.net shop
                </a>.
              </p>
            </div>
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
              answer="We're hair and barber only. Google mixes in beauty salons, nail bars, and day spas. Almost every listing is matched to a Google Business Profile listed as a hair salon or barber, and beauty, nail and spa businesses are removed when we find them."
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
