import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { AU_STATES, stateName } from '@/lib/geo';
import { supabaseServerInternal } from '@/lib/supabase';
import type { AuState } from '@/types/database';

export const revalidate = 3600;

export function generateStaticParams() {
  return AU_STATES.map(({ code }) => ({ state: code.toLowerCase() }));
}

function validState(value: string): AuState | null {
  const code = value.toUpperCase() as AuState;
  return AU_STATES.some((state) => state.code === code) ? code : null;
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const code = validState(state);
  if (!code) return {};
  const name = stateName(code);
  const url = `https://www.findme.hair/stats/${code.toLowerCase()}`;
  const title = `${name} Hair Salon Statistics ${new Date().getFullYear()} | findme.hair`;
  const description = `Live directory statistics for ${name}: active hair and barber listings, Google reviews, business types, walk-ins and specialty coverage.`;
  return {
    title,
    description,
    alternates: { canonical: url, languages: { 'en-AU': url, 'x-default': url } },
    openGraph: {
      title,
      description,
      url,
      siteName: 'findme.hair',
      locale: 'en_AU',
      type: 'article',
      images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function StateStatsPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const code = validState(state);
  if (!code) notFound();

  const name = stateName(code);
  const slug = code.toLowerCase();
  const url = `https://www.findme.hair/stats/${slug}`;
  const year = new Date().getFullYear();
  const db = supabaseServerInternal();
  const active = () => db.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('state', code);

  const [directoryStats, hairSalonsRes, barbersRes, unisexRes, walkInsRes, mobileRes, bridalRes, kidsRes, balayageRes, extensionsRes, regionsRes] = await Promise.all([
    db.rpc('fmh_directory_stats'),
    active().eq('business_type', 'hair_salon'),
    active().eq('business_type', 'barber'),
    active().eq('business_type', 'unisex'),
    active().eq('walk_ins_welcome', true),
    active().contains('specialties', ['mobile']),
    active().contains('specialties', ['bridal']),
    active().contains('specialties', ['kids']),
    active().contains('specialties', ['balayage']),
    active().contains('specialties', ['extensions']),
    db.from('regions').select('id, name, slug', { count: 'exact' }).eq('state', code).order('name'),
  ]);

  const stateRow = ((directoryStats.data ?? []) as { state: string; salons: number; reviews: number }[])
    .find((row) => row.state === code);
  if (!stateRow) notFound();

  const total = Number(stateRow.salons ?? 0);
  const reviews = Number(stateRow.reviews ?? 0);
  const regions = (regionsRes.data ?? []) as { id: string; name: string; slug: string }[];
  const businessTypes = [
    ['Hair salons', hairSalonsRes.count ?? 0],
    ['Barber shops', barbersRes.count ?? 0],
    ['Unisex salons', unisexRes.count ?? 0],
  ] as const;
  const specialties = [
    ['Walk-ins welcome', walkInsRes.count ?? 0],
    ['Mobile / at-home stylists', mobileRes.count ?? 0],
    ['Bridal hair specialists', bridalRes.count ?? 0],
    ['Kids hairdressers', kidsRes.count ?? 0],
    ['Balayage specialists', balayageRes.count ?? 0],
    ['Hair extension specialists', extensionsRes.count ?? 0],
  ] as const;

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: `${name} Hair Industry Statistics`,
        description: `Mechanically computed directory counts for active hair salons and barbers in ${name}.`,
        url,
        creator: { '@id': 'https://www.findme.hair/#organization' },
        spatialCoverage: { '@type': 'AdministrativeArea', name },
        temporalCoverage: `${year}-01-01/..`,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        isAccessibleForFree: true,
        variableMeasured: [
          { '@type': 'PropertyValue', name: 'Active directory listings', value: total },
          { '@type': 'PropertyValue', name: 'Google reviews aggregated', value: reviews },
          { '@type': 'PropertyValue', name: 'Regions covered', value: regions.length },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Australian Hair Industry Stats', item: 'https://www.findme.hair/stats' },
          { '@type': 'ListItem', position: 3, name, item: url },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-4xl px-6 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link><span>›</span>
            <Link href="/stats" className="hover:text-[var(--color-gold-dark)]">Stats</Link><span>›</span>
            <span className="text-[var(--color-ink)] font-medium">{name}</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-editorial-overline">Live directory data · {year}</p>
          <h1 className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
            {name} Hair Industry Statistics
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            Active hair and barber listings in {name}, computed from the findme.hair directory. Counts recompute continuously and are free to cite under CC BY 4.0 with attribution and a link back.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>At a glance</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            <Stat label="Verified active listings" value={total} />
            <Stat label="Google reviews aggregated" value={reviews} />
            <Stat label="Regions covered" value={regions.length} />
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>By business type</h2>
          <div className="grid gap-4 grid-cols-3">
            {businessTypes.map(([label, value]) => <Stat key={label} label={label} value={value} />)}
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Services and access</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {specialties.map(([label, value]) => <Stat key={label} label={label} value={value} />)}
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Regions represented</h2>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            {regions.map((region) => (
              <li key={region.id}>
                <Link href={`/${slug}/${region.slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                  {region.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm">
            <Link href={`/${slug}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
              Browse the {name} salon and barber directory →
            </Link>
          </p>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Citation</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            Suggested citation: <em>findme.hair, &ldquo;{name} Hair Industry Statistics {year}&rdquo;, {url}</em>. Figures are mechanically computed from active findme.hair directory records and updated continuously.
          </p>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-semibold text-[var(--color-gold)]" style={{ fontFamily: 'var(--font-serif)' }}>{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-muted)] leading-tight">{label}</p>
    </div>
  );
}
