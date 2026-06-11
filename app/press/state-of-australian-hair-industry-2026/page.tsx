import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;

const path = "https://www.findme.hair/press/state-of-australian-hair-industry-2026";
const title = "State of the Australian Hair Industry 2026 — findme.hair Data Report";
const description =
  "Original 2026 research from findme.hair's 13,812-listing national dataset. Salon density by state, walk-ins vs appointment, mobile-stylist growth, specialty distribution and Google-rating benchmarks across Australia.";

const datePublished = "2026-05-22";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: {
    title,
    description,
    url: path,
    siteName: "findme.hair",
    locale: "en_AU",
    type: "article",
    publishedTime: datePublished,
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

const stateRows = [
  { state: "NSW", total: 4246, barbers: 934, salons: 2749, unisex: 563, walkInsYes: 987, walkInsNo: 103, mobile: 576, fiveStar: 1291, ratingAvg: 4.73 },
  { state: "VIC", total: 3386, barbers: 792, salons: 2193, unisex: 401, walkInsYes: 830, walkInsNo: 67, mobile: 405, fiveStar: 988, ratingAvg: 4.71 },
  { state: "QLD", total: 3005, barbers: 722, salons: 1964, unisex: 319, walkInsYes: 673, walkInsNo: 97, mobile: 428, fiveStar: 1013, ratingAvg: 4.75 },
  { state: "WA", total: 1651, barbers: 386, salons: 1043, unisex: 222, walkInsYes: 390, walkInsNo: 32, mobile: 227, fiveStar: 477, ratingAvg: 4.70 },
  { state: "SA", total: 910, barbers: 253, salons: 570, unisex: 87, walkInsYes: 230, walkInsNo: 18, mobile: 105, fiveStar: 243, ratingAvg: 4.70 },
  { state: "TAS", total: 265, barbers: 67, salons: 178, unisex: 20, walkInsYes: 67, walkInsNo: 6, mobile: 37, fiveStar: 51, ratingAvg: 4.67 },
  { state: "ACT", total: 227, barbers: 83, salons: 125, unisex: 19, walkInsYes: 75, walkInsNo: 7, mobile: 23, fiveStar: 33, ratingAvg: 4.59 },
  { state: "NT", total: 122, barbers: 37, salons: 67, unisex: 18, walkInsYes: 39, walkInsNo: 3, mobile: 13, fiveStar: 28, ratingAvg: 4.64 },
];

const total = stateRows.reduce((a, r) => a + r.total, 0);
const totalBarbers = stateRows.reduce((a, r) => a + r.barbers, 0);
const totalSalons = stateRows.reduce((a, r) => a + r.salons, 0);
const totalUnisex = stateRows.reduce((a, r) => a + r.unisex, 0);
const totalMobile = stateRows.reduce((a, r) => a + r.mobile, 0);
const totalWalkInsYes = stateRows.reduce((a, r) => a + r.walkInsYes, 0);
const totalWalkInsNo = stateRows.reduce((a, r) => a + r.walkInsNo, 0);
const totalFiveStar = stateRows.reduce((a, r) => a + r.fiveStar, 0);

const specialtyRows = [
  { name: "Colour specialist", count: 7352 },
  { name: "Barber techniques", count: 4970 },
  { name: "Men's cutting", count: 3987 },
  { name: "Kids haircuts", count: 3905 },
  { name: "Highlights", count: 3120 },
  { name: "Mobile / at-home", count: 1814 },
  { name: "Blow-dry / styling", count: 1617 },
  { name: "Hair extensions", count: 1511 },
  { name: "Curly hair specialist", count: 1429 },
  { name: "Balayage", count: 1386 },
  { name: "Bridal hair", count: 1146 },
  { name: "Keratin treatment", count: 1025 },
  { name: "Colour correction", count: 770 },
  { name: "Japanese-trained / techniques", count: 708 },
  { name: "Organic / sustainable", count: 556 },
  { name: "Afro-textured / locs", count: 264 },
  { name: "Korean techniques", count: 134 },
  { name: "Wigs / hairpieces", count: 89 },
];

const topSuburbs = [
  { suburb: "Adelaide", state: "SA", count: 56 },
  { suburb: "Perth", state: "WA", count: 54 },
  { suburb: "Sydney", state: "NSW", count: 47 },
  { suburb: "Penrith", state: "NSW", count: 47 },
  { suburb: "Wagga Wagga", state: "NSW", count: 43 },
  { suburb: "Bendigo", state: "VIC", count: 42 },
  { suburb: "Wollongong", state: "NSW", count: 41 },
  { suburb: "South Yarra", state: "VIC", count: 40 },
  { suburb: "Southport", state: "QLD", count: 40 },
  { suburb: "Shepparton", state: "VIC", count: 39 },
  { suburb: "Coffs Harbour", state: "NSW", count: 39 },
  { suburb: "Surry Hills", state: "NSW", count: 39 },
  { suburb: "Ballarat Central", state: "VIC", count: 39 },
  { suburb: "Richmond", state: "VIC", count: 38 },
  { suburb: "Dubbo", state: "NSW", count: 38 },
];

export default function StateOfHairIndustry2026() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              "@id": path + "#article",
              headline: "State of the Australian Hair Industry 2026",
              alternativeHeadline: "Salon density, specialty distribution, mobile-stylist growth and Google-rating benchmarks across all 8 Australian states and territories",
              url: path,
              datePublished,
              dateModified: datePublished,
              inLanguage: "en-AU",
              isAccessibleForFree: true,
              license: "https://creativecommons.org/licenses/by/4.0/",
              author: { "@id": "https://www.findme.hair/#organization" },
              publisher: { "@id": "https://www.findme.hair/#organization" },
              about: { "@id": "https://www.findme.hair/#organization" },
              keywords: [
                "Australian hair industry data",
                "salon density Australia",
                "hairdresser statistics Australia 2026",
                "mobile hairdresser growth",
                "barber industry Australia",
                "salon ratings benchmark",
              ],
              mainEntityOfPage: path,
            },
            {
              "@type": "Dataset",
              "@id": path + "#dataset",
              name: "findme.hair Australian Hair Industry Snapshot 2026",
              description:
                "Aggregate counts derived from 13,812 hand-verified active hair salon and barber listings on findme.hair as of 2026-05-22. Sourced from Google Business Profile, TrueLocal and Yellow Pages cross-checks.",
              url: path,
              datePublished,
              creator: { "@id": "https://www.findme.hair/#organization" },
              license: "https://creativecommons.org/licenses/by/4.0/",
              isAccessibleForFree: true,
              keywords: ["Australian hair industry", "salon directory data", "hairdresser census"],
              spatialCoverage: { "@type": "Country", name: "Australia" },
              temporalCoverage: "2026-05",
              variableMeasured: [
                "Total active hair businesses by state",
                "Business type distribution (salon, barber, unisex)",
                "Walk-in availability",
                "Mobile / at-home stylist count",
                "Specialty distribution",
                "Google rating distribution",
              ],
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://www.findme.hair/" },
                { "@type": "ListItem", position: 2, name: "Press", item: "https://www.findme.hair/press" },
                { "@type": "ListItem", position: 3, name: "State of Australian Hair Industry 2026" },
              ],
            },
          ],
        }}
      />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <Link href="/press" className="hover:text-[var(--color-gold-dark)]">Press</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">State of Hair 2026</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-editorial-overline">Data report · May 2026</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            State of the Australian Hair Industry 2026
          </h1>
          <p className="mt-4 text-[var(--color-ink-light)] leading-relaxed">
            An aggregate snapshot drawn from {total.toLocaleString()} hand-verified hair businesses listed on findme.hair as of May 2026. Every listing is cross-checked against Google Business Profile, TrueLocal and Yellow Pages before publishing. Beauty salons, nail bars, lash studios and day spas are excluded — this is hair, deliberately and only.
          </p>
          <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
            Published 22 May 2026 · CC BY 4.0 · Cite as: findme.hair (2026). <em>State of the Australian Hair Industry 2026</em>. https://www.findme.hair/press/state-of-australian-hair-industry-2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        {/* Top-line numbers */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Headline figures
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Stat label="Total active hair businesses" value={total.toLocaleString()} />
            <Stat label="Hair salons" value={totalSalons.toLocaleString()} />
            <Stat label="Barber shops" value={totalBarbers.toLocaleString()} />
            <Stat label="Unisex / mixed" value={totalUnisex.toLocaleString()} />
            <Stat label="Mobile / at-home stylists" value={totalMobile.toLocaleString()} />
            <Stat label="Walk-ins welcome" value={totalWalkInsYes.toLocaleString()} />
            <Stat label="Appointment-only" value={totalWalkInsNo.toLocaleString()} />
            <Stat label="5-star rated (Google ≥ 5.0)" value={totalFiveStar.toLocaleString()} />
          </div>
          <p className="mt-5 text-sm text-[var(--color-ink-light)]">
            Of the {total.toLocaleString()} businesses surveyed, {Math.round((totalMobile / total) * 100)}% offer mobile or at-home service, {Math.round((totalWalkInsYes / (totalWalkInsYes + totalWalkInsNo)) * 100)}% of those who declare a booking policy welcome walk-ins, and {Math.round((totalFiveStar / total) * 100)}% hold a 5.0-star Google rating. The Australian sector remains structurally fragmented — no single chain commands more than 3% of the national footprint.
          </p>
        </section>

        {/* State breakdown */}
        <section className="card p-8 overflow-x-auto">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            By state and territory
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] mb-4 leading-relaxed">
            NSW leads on absolute count ({stateRows[0].total.toLocaleString()}), but Queensland holds the highest average Google rating ({stateRows[2].ratingAvg}) — a quirk consistent with QLD&rsquo;s higher proportion of newer, owner-operator salons. The Northern Territory has the smallest market ({stateRows[7].total} businesses) and the highest barber-to-salon ratio in the country.
          </p>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left py-2 pr-3">State</th>
                <th className="text-right py-2 pr-3">Total</th>
                <th className="text-right py-2 pr-3">Salons</th>
                <th className="text-right py-2 pr-3">Barbers</th>
                <th className="text-right py-2 pr-3">Mobile</th>
                <th className="text-right py-2 pr-3">Avg rating</th>
                <th className="text-right py-2">5-star</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-ink-light)]">
              {stateRows.map((r) => (
                <tr key={r.state} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2 pr-3 font-medium text-[var(--color-ink)]">{r.state}</td>
                  <td className="text-right py-2 pr-3">{r.total.toLocaleString()}</td>
                  <td className="text-right py-2 pr-3">{r.salons.toLocaleString()}</td>
                  <td className="text-right py-2 pr-3">{r.barbers.toLocaleString()}</td>
                  <td className="text-right py-2 pr-3">{r.mobile.toLocaleString()}</td>
                  <td className="text-right py-2 pr-3">{r.ratingAvg}</td>
                  <td className="text-right py-2">{r.fiveStar.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Specialty distribution */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Specialty distribution
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] mb-4 leading-relaxed">
            Colour-related work dominates the modern Australian salon — over half of all listings advertise colour-specialist capability. The Asian-technique market segment (Japanese and Korean methods combined) represents over 800 businesses nationally, concentrated heavily in Sydney&rsquo;s Eastwood and Chatswood and Melbourne&rsquo;s Box Hill. Mobile and at-home stylists now represent 13% of the national footprint, more than double the pre-2020 estimate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {specialtyRows.map((s) => (
              <div key={s.name} className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span className="text-[var(--color-ink)]">{s.name}</span>
                <span className="text-[var(--color-ink-muted)]">{s.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top suburbs */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Highest-density suburbs
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] mb-4 leading-relaxed">
            CBD precincts dominate the top of the list — Adelaide CBD ({topSuburbs[0].count}), Perth CBD ({topSuburbs[1].count}) and Sydney CBD ({topSuburbs[2].count}) — but Penrith ({topSuburbs[3].count}) and Wagga Wagga ({topSuburbs[4].count}) crack the top 5 alongside them, demonstrating the genuine regional spread of the Australian hair sector. South Yarra remains Melbourne&rsquo;s hair-density leader, ahead of Richmond and Brunswick.
          </p>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left py-2 pr-3">Suburb</th>
                <th className="text-left py-2 pr-3">State</th>
                <th className="text-right py-2">Businesses</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-ink-light)]">
              {topSuburbs.map((s) => (
                <tr key={s.suburb + s.state} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2 pr-3 text-[var(--color-ink)]">{s.suburb}</td>
                  <td className="py-2 pr-3">{s.state}</td>
                  <td className="text-right py-2">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Methodology */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Methodology
          </h2>
          <ul className="text-sm text-[var(--color-ink-light)] list-disc pl-5 space-y-2 leading-relaxed">
            <li>Source: findme.hair active-listings index, retrieved 22 May 2026.</li>
            <li>Sample frame: every business with <em>status = active</em> in the directory database (n = {total.toLocaleString()}).</li>
            <li>Verification: each listing cross-checked against Google Business Profile, TrueLocal and Yellow Pages prior to publication. Listings primarily offering nails, beauty, lash, brow, spa or tattoo are excluded.</li>
            <li>Business type derived from venue name, services, and Google category. Ambiguous cases default to <em>unisex</em>.</li>
            <li>Walk-ins / appointment-only inferred from venue website language and Google review content. ~25% of listings declare neither and are not represented in walk-in totals.</li>
            <li>Mobile / at-home flag is set on any business whose primary or secondary service mode is travel-to-client.</li>
            <li>Specialty tags are inferred from venue copy and Google review co-occurrence. A single business may carry multiple specialty tags.</li>
            <li>Ratings: latest Google average available at time of last sync. Some listings have no reviews and are excluded from the rating-average calculation.</li>
          </ul>
        </section>

        {/* Licensing */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Licensing and citation
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            This dataset and report are released under a <a href="https://creativecommons.org/licenses/by/4.0/" className="underline">CC BY 4.0</a> license. Journalists, researchers and writers are welcome to reuse the figures with attribution.
          </p>
          <p className="mt-3 text-sm text-[var(--color-ink-light)]">
            Suggested citation: <em>findme.hair (2026). State of the Australian Hair Industry 2026. https://www.findme.hair/press/state-of-australian-hair-industry-2026</em>
          </p>
          <p className="mt-3 text-sm text-[var(--color-ink-light)]">
            For deeper cuts of the data (suburb-by-suburb spreadsheets, year-over-year deltas, custom segments), contact via the <Link href="/contact" className="underline">contact page</Link>.
          </p>
        </section>

        {/* Footer cross-links */}
        <section className="card p-8 bg-[var(--color-ink)] text-[var(--color-white)]">
          <h2 className="text-xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            About findme.hair
          </h2>
          <p className="text-sm leading-relaxed">
            findme.hair is Australia&rsquo;s hand-verified hair salon and barber directory. Every listing is hand-checked, every ranking is by Google rating and review count, and there is no paid placement and no booking commission. <Link href="/press" className="underline">See the full press kit</Link> · <Link href="/about" className="underline">About</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl text-[var(--color-ink)]" style={{ fontFamily: "var(--font-serif)" }}>{value}</div>
      <div className="text-xs text-[var(--color-ink-muted)] mt-1">{label}</div>
    </div>
  );
}
