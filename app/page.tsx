import Link from 'next/link';
import type { Metadata } from 'next';
import MatrixSearch from '@/components/MatrixSearch';
import CategoryTiles from '@/components/CategoryTiles';
import JsonLd from '@/components/JsonLd';
import { supabaseServerAnon } from '@/lib/supabase';

export const metadata: Metadata = {
  title: "findme.hair — Australia's Hair Salon & Barber Directory",
  description:
    "Find verified hair salons and barbers near you. 13,000+ listings across Australia. Hair only — no beauty, no nails, no spa.",
  alternates: { canonical: 'https://www.findme.hair/' },
  openGraph: {
    title: "findme.hair — Australia's Hair Salon & Barber Directory",
    description: 'Find verified hair salons and barbers near you. 13,000+ listings across Australia.',
    url: 'https://www.findme.hair/',
    siteName: 'findme.hair',
    locale: 'en_AU',
    type: 'website',
    images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "findme.hair — Australia's Hair Salon & Barber Directory",
    description: 'Find verified hair salons and barbers near you. 13,000+ listings across Australia.',
    images: ['https://www.findme.hair/og-image.jpg'],
  },
};

export default async function HomePage() {
  const supabase = supabaseServerAnon();

  // Fetch total active count
  const { count: totalCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const total = totalCount ?? 0;

  return (
    <main>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'findme.hair',
        url: 'https://www.findme.hair',
        description: "Australia's hair salon and barber directory",
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.findme.hair/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }} />
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-16 text-center sm:pt-24 sm:pb-20">
          <p className="text-editorial-overline mb-5">
            Australia&rsquo;s Hair &amp; Barber Directory
          </p>
          <h1
            className="text-4xl leading-tight sm:text-5xl md:text-6xl md:leading-tight text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Find your next<br />
            <span className="text-[var(--color-gold)]">great haircut</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-ink-light)] sm:text-lg">
            Every listing hand-verified. Hair salons and barber shops only &mdash;
            no beauty, no nails, no spa. Just hair.
          </p>

          <div className="mt-12 text-left">
            <MatrixSearch totalCount={total} />
          </div>
          <p className="mt-6 text-sm text-[var(--color-ink-muted)]">
            Or jump straight to{' '}
            <Link href="/hairdresser-near-me" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Hairdresser Near Me</Link>
            {' · '}
            <Link href="/barber-near-me" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Barber Near Me</Link>
            {' · '}
            <Link href="/haircut-near-me" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Haircut Near Me</Link>
          </p>
        </div>
      </section>

      {/* ─── Browse by service ─────────────────────────────── */}
      <CategoryTiles />

      {/* ─── Proof bar ────────────────────────────────────── */}
      <section className="bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 text-center">
            <ProofStat value={total.toLocaleString()} label="Verified listings" />
            <ProofStat value="8" label="States & territories" />
            <ProofStat value="Hair only" label="No beauty, nails, or spa" />
            <ProofStat value="Free" label="Claim your listing" />
          </div>
        </div>
      </section>

      {/* ─── Why findme.hair ──────────────────────────────── */}
      <section className="bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <p className="text-editorial-overline">Why findme.hair</p>
            <h2
              className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              A directory that actually cares
            </h2>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            <ValueProp
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              }
              title="Every listing verified"
              body="We cross-check every salon against Google, TrueLocal, and Yellow Pages. No ghost listings, no duplicates."
            />
            <ValueProp
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48 0l.136.046m-9.471 2.96l-2.077 1.2M21.75 18.75V7.5m0 0a2.25 2.25 0 00-2.25-2.25H4.5a2.25 2.25 0 00-2.25 2.25v11.25" />
                </svg>
              }
              title="Hair &amp; barber only"
              body="We exclude beauty, nails, lashes, and spas. One building, one listing. The cleanest hair directory in Australia."
            />
            <ValueProp
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              }
              title="Owners keep it fresh"
              body="Salon owners claim their listing for free and update photos, hours, and booking links directly."
            />
          </div>
        </div>
      </section>

      {/* ─── Popular searches ──────────────────────────────── */}
      <section className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <p className="text-editorial-overline">Popular searches</p>
            <h2
              className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Find hair salons &amp; barbers
            </h2>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Best hairdressers by city */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)] uppercase tracking-wider mb-4">Best hairdressers</h3>
              <ul className="space-y-2">
                {[
                  { name: 'Melbourne', slug: 'melbourne' },
                  { name: 'Sydney', slug: 'sydney' },
                  { name: 'Brisbane', slug: 'brisbane' },
                  { name: 'Perth', slug: 'perth' },
                  { name: 'Adelaide', slug: 'adelaide' },
                  { name: 'Gold Coast', slug: 'gold-coast' },
                  { name: 'Newcastle', slug: 'newcastle' },
                  { name: 'Geelong', slug: 'geelong' },
                ].map((c) => (
                  <li key={c.slug}>
                    <Link href={`/best-hairdresser/${c.slug}`} className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                      In {c.name} &rarr;
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Best barbers by city — NEW */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)] uppercase tracking-wider mb-4">Best barbers</h3>
              <ul className="space-y-2">
                {[
                  { name: 'Melbourne', slug: 'melbourne' },
                  { name: 'Sydney', slug: 'sydney' },
                  { name: 'Brisbane', slug: 'brisbane' },
                  { name: 'Perth', slug: 'perth' },
                  { name: 'Adelaide', slug: 'adelaide' },
                  { name: 'Gold Coast', slug: 'gold-coast' },
                  { name: 'Newcastle', slug: 'newcastle' },
                  { name: 'Canberra', slug: 'canberra' },
                ].map((c) => (
                  <li key={c.slug}>
                    <Link href={`/best-barber/${c.slug}`} className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                      In {c.name} &rarr;
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* By service */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)] uppercase tracking-wider mb-4">By service</h3>
              <ul className="space-y-2">
                {[
                  { name: 'Mobile Hairdressers', href: '/services/mobile-hairdresser' },
                  { name: 'Balayage Specialists', href: '/services/balayage-specialist' },
                  { name: 'Curly Hair Specialists', href: '/services/curly-hair-specialist' },
                  { name: 'Barber Shops', href: '/services/barber' },
                  { name: 'Bridal Hair', href: '/services/bridal-hair' },
                  { name: 'Hair Extensions', href: '/services/hair-extensions' },
                  { name: 'Japanese Hairdressers', href: '/services/japanese-hairdresser' },
                  { name: 'Korean Hair Salons', href: '/services/korean-hair-salon' },
                ].map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                      {s.name} &rarr;
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* By state */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)] uppercase tracking-wider mb-4">By state</h3>
              <ul className="space-y-2">
                {[
                  { name: 'Victoria', href: '/vic' },
                  { name: 'New South Wales', href: '/nsw' },
                  { name: 'Queensland', href: '/qld' },
                  { name: 'Western Australia', href: '/wa' },
                  { name: 'South Australia', href: '/sa' },
                  { name: 'Tasmania', href: '/tas' },
                  { name: 'Northern Territory', href: '/nt' },
                  { name: 'ACT', href: '/act' },
                ].map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                      {s.name} &rarr;
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA for salon owners ─────────────────────────── */}
      <section className="bg-[var(--color-ink)]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--color-gold)]">
            For salon owners
          </p>
          <h2
            className="mt-4 text-3xl text-[var(--color-white)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Your salon deserves to be found
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-neutral-400">
            Claim your free listing on Australia&rsquo;s dedicated hair directory. Add photos, connect your booking system, and let clients find you.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/claim" className="btn-gold">
              Claim your listing
            </Link>
            <Link
              href="/for-salons"
              className="text-sm font-medium text-neutral-400 hover:text-[var(--color-white)] transition-colors"
            >
              Learn more &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ─── Data ──────────────────────────────────────────────── */

/* ─── Sub-components ────────────────────────────────────── */

function ProofStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{label}</p>
    </div>
  );
}

function ValueProp({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-gold-light)] text-[var(--color-gold-dark)]">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-light)]">{body}</p>
    </div>
  );
}
