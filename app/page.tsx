import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import { supabaseServerAnon } from '@/lib/supabase';
import type { AuState } from '@/types/database';

export default async function HomePage() {
  const supabase = supabaseServerAnon();

  // Fetch total active count
  const { count: totalCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Fetch per-state counts
  const { data: stateRows } = await supabase
    .from('businesses')
    .select('state')
    .eq('status', 'active');

  const stateCountMap: Record<string, number> = {};
  for (const r of (stateRows ?? []) as { state: string }[]) {
    stateCountMap[r.state] = (stateCountMap[r.state] || 0) + 1;
  }

  const total = totalCount ?? 0;

  return (
    <main>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative bg-[var(--color-white)]">
        <div className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:pt-20 sm:pb-16">
          <p className="text-editorial-overline mb-6">
            Australia&rsquo;s Hair &amp; Barber Directory
          </p>
          <h1
            className="text-4xl leading-tight sm:text-5xl md:text-6xl md:leading-tight text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Find your next<br />
            <span className="text-[var(--color-gold)]">great haircut</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--color-ink-light)] sm:text-lg">
            Every listing hand-verified. Hair salons and barber shops only &mdash;
            no beauty, no nails, no spa. Just hair.
          </p>

          <div className="mx-auto mt-10 max-w-xl">
            <SearchBar size="lg" />
          </div>

          {/* Popular cities */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {POPULAR_CITIES.map((city) => (
              <Link
                key={city.name}
                href={city.href}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2 text-sm text-[var(--color-ink-light)] transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)]"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Subtle bottom edge */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
      </section>

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

      {/* ─── Browse by State ──────────────────────────────── */}
      <section className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-10">
          <div className="text-center">
            <p className="text-editorial-overline">Explore</p>
            <h2
              className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Browse by state
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {STATES.map((s) => {
              const count = stateCountMap[s.code] ?? 0;
              return (
                <Link
                  key={s.code}
                  href={`/${s.code.toLowerCase()}`}
                  className="group card flex items-center gap-4 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-warm)] text-sm font-bold text-[var(--color-ink-light)] group-hover:bg-[var(--color-gold-light)] group-hover:text-[var(--color-gold-dark)] transition-colors">
                    {s.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-ink)] text-sm group-hover:text-[var(--color-gold-dark)] transition-colors">
                      {s.name}
                    </p>
                    {count > 0 && (
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                        {count.toLocaleString()} listings
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 flex-shrink-0 text-[var(--color-border)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--color-gold)] transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              );
            })}
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

const POPULAR_CITIES = [
  { name: 'Sydney', href: '/search?q=Sydney' },
  { name: 'Melbourne', href: '/search?q=Melbourne' },
  { name: 'Brisbane', href: '/search?q=Brisbane' },
  { name: 'Perth', href: '/search?q=Perth' },
  { name: 'Adelaide', href: '/search?q=Adelaide' },
  { name: 'Hobart', href: '/search?q=Hobart' },
  { name: 'Gold Coast', href: '/search?q=Gold+Coast' },
  { name: 'Ballarat', href: '/search?q=Ballarat' },
];

const STATES: { code: AuState; name: string }[] = [
  { code: 'VIC', name: 'Victoria' },
  { code: 'NSW', name: 'New South Wales' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'NT', name: 'Northern Territory' },
  { code: 'ACT', name: 'ACT \u2014 Canberra' },
];

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
