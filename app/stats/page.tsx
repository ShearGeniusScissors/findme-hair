import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { supabaseServerAnon } from "@/lib/supabase";

export const revalidate = 3600;

const path = "https://www.findme.hair/stats";
const title = `Australian Hair Industry Stats ${new Date().getFullYear()} — Live Directory Numbers | findme.hair`;
const description = "Live Australian hair industry statistics — total verified salons by state, business type breakdowns, walk-in coverage, mobile and specialty stylists. Updated continuously from the findme.hair directory.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: {
    title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "article",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default async function StatsPage() {
  const supabase = supabaseServerAnon();

  const byState = await supabase.from('businesses').select('state').eq('status', 'active');

  // Run individual count queries
  const [
    totalRes, hsRes, bRes, uRes, walkRes, mobRes, brRes, kidsRes, balRes, extRes, regionsRes, sumRes,
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('business_type', 'hair_salon'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('business_type', 'barber'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('business_type', 'unisex'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('walk_ins_welcome', true),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').contains('specialties', ['mobile']),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').contains('specialties', ['bridal']),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').contains('specialties', ['kids']),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').contains('specialties', ['balayage']),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active').contains('specialties', ['extensions']),
    supabase.from('regions').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('google_review_count').eq('status', 'active'),
  ]);

  const total = totalRes.count ?? 0;
  const hairSalons = hsRes.count ?? 0;
  const barbers = bRes.count ?? 0;
  const unisex = uRes.count ?? 0;
  const walkIns = walkRes.count ?? 0;
  const mobile = mobRes.count ?? 0;
  const bridal = brRes.count ?? 0;
  const kids = kidsRes.count ?? 0;
  const balayage = balRes.count ?? 0;
  const extensions = extRes.count ?? 0;
  const regions = regionsRes.count ?? 0;
  const totalReviews = (sumRes.data ?? []).reduce((acc, r: { google_review_count: number | null }) => acc + (r.google_review_count ?? 0), 0);

  const stateCounts = Object.entries(((byState.data ?? []) as { state: string }[]).reduce<Record<string, number>>((acc, r) => {
    acc[r.state] = (acc[r.state] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);

  const STATE_NAMES: Record<string, string> = {
    NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia',
    SA: 'South Australia', TAS: 'Tasmania', ACT: 'Australian Capital Territory', NT: 'Northern Territory',
  };

  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Australian Hair Industry Statistics',
        description: 'Live counts of verified Australian hair salons and barber shops, by state, type, and specialty.',
        url: path,
        creator: { '@id': 'https://www.findme.hair/#organization' },
        keywords: ['Australian hair industry', 'hair salon statistics', 'barber statistics', 'hairdresser data Australia'],
        spatialCoverage: { '@type': 'Country', name: 'Australia' },
        temporalCoverage: `${year}-01-01/..`,
        license: 'https://creativecommons.org/licenses/by/4.0/',
        isAccessibleForFree: true,
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Stats', item: path },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-4xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Stats</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-editorial-overline">Live data · {year}</p>
          <h1 className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Australian Hair Industry Stats
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            Live counts of verified hair salons and barber shops across Australia — by state, business type, walk-in availability, and specialty. Refreshed every hour from the findme.hair directory. Free to cite under CC BY 4.0; please link back.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Overall</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Stat label="Verified active listings" value={total.toLocaleString()} />
            <Stat label="Australian regions covered" value={regions.toLocaleString()} />
            <Stat label="Total Google reviews aggregated" value={totalReviews.toLocaleString()} />
            <Stat label="Coverage" value="All 8 states &amp; territories" small />
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>By business type</h2>
          <div className="grid gap-4 grid-cols-3">
            <Stat label="Hair salons" value={hairSalons.toLocaleString()} />
            <Stat label="Barber shops" value={barbers.toLocaleString()} />
            <Stat label="Unisex salons" value={unisex.toLocaleString()} />
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>By state</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 font-semibold text-[var(--color-ink)]">State</th>
                <th className="text-right py-2 font-semibold text-[var(--color-ink)]">Verified listings</th>
                <th className="text-right py-2 font-semibold text-[var(--color-ink)] hidden sm:table-cell">% of total</th>
              </tr>
            </thead>
            <tbody>
              {stateCounts.map(([code, count]) => (
                <tr key={code} className="border-b border-[var(--color-border-light)]">
                  <td className="py-2">
                    <Link href={`/${code.toLowerCase()}`} className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
                      {STATE_NAMES[code] || code}
                    </Link>
                  </td>
                  <td className="text-right py-2">{count.toLocaleString()}</td>
                  <td className="text-right py-2 hidden sm:table-cell text-[var(--color-ink-muted)]">{((count / total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>By specialty</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            <Stat label="Walk-ins welcome" value={walkIns.toLocaleString()} />
            <Stat label="Mobile / at-home stylists" value={mobile.toLocaleString()} />
            <Stat label="Bridal hair specialists" value={bridal.toLocaleString()} />
            <Stat label="Kids hairdressers" value={kids.toLocaleString()} />
            <Stat label="Balayage specialists" value={balayage.toLocaleString()} />
            <Stat label="Hair extension specialists" value={extensions.toLocaleString()} />
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Citation</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">All figures on this page are pulled live from the findme.hair directory and refreshed hourly. Free to cite under CC BY 4.0 (attribution + link back). Suggested citation: <em>findme.hair, &ldquo;Australian Hair Industry Stats {year}&rdquo;, https://www.findme.hair/stats</em>. For deeper data slices or custom queries, contact the editorial team via the footer.</p>
        </section>

      </div>
    </main>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="text-center">
      <p className={small ? "text-base font-semibold text-[var(--color-gold)]" : "text-3xl font-semibold text-[var(--color-gold)]"} style={{ fontFamily: 'var(--font-serif)' }} dangerouslySetInnerHTML={{ __html: value }} />
      <p className="mt-1 text-xs text-[var(--color-ink-muted)] leading-tight">{label}</p>
    </div>
  );
}
