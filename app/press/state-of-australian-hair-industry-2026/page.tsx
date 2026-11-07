import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;

// Every figure on this page is reproducible. Queries, raw outputs and the ABS source are saved in
// SEO/03_reports/findme-authority-2026-11-07/report-data/state-of-hair-2026-11-07-data.md
// (findme.hair database snapshot 2026-11-07 03:18 UTC; status = 'active' listings only).

const path = "https://www.findme.hair/press/state-of-australian-hair-industry-2026";
const title = "State of the Australian Hair Industry 2026 — findme.hair Data Report";

const datePublished = "2026-05-22";
const dateModified = "2026-11-07";

// ABS, National, state and territory population, March 2026 (released 17 September 2026).
// Estimated resident population at 31 March 2026, in thousands.
const absRelease = {
  name: "National, state and territory population, March 2026",
  url: "https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/mar-2026",
};
const ausErpThousands = 27921.15; // 27,921,150 people (includes Other Territories)

const stateRows = [
  { state: "NSW", name: "New South Wales", total: 4227, salons: 2745, barbers: 934, unisex: 548, googleMatched: 4226, rated: 4145, medianRating: 4.8, meanRating: 4.73, medianReviews: 55, fiveStar: 1280, withHours: 3983, erp: 8670.1 },
  { state: "VIC", name: "Victoria", total: 3509, salons: 2296, barbers: 809, unisex: 404, googleMatched: 3254, rated: 3231, medianRating: 4.8, meanRating: 4.71, medianReviews: 55, fiveStar: 967, withHours: 2974, erp: 7154.2 },
  { state: "QLD", name: "Queensland", total: 2991, salons: 1964, barbers: 721, unisex: 306, googleMatched: 2991, rated: 2925, medianRating: 4.9, meanRating: 4.75, medianReviews: 52, fiveStar: 1003, withHours: 2805, erp: 5739.5 },
  { state: "WA", name: "Western Australia", total: 1636, salons: 1042, barbers: 386, unisex: 208, googleMatched: 1636, rated: 1584, medianRating: 4.8, meanRating: 4.7, medianReviews: 53, fiveStar: 468, withHours: 1534, erp: 3096.2 },
  { state: "SA", name: "South Australia", total: 913, salons: 578, barbers: 253, unisex: 82, googleMatched: 901, rated: 880, medianRating: 4.8, meanRating: 4.7, medianReviews: 49, fiveStar: 241, withHours: 816, erp: 1916.8 },
  { state: "TAS", name: "Tasmania", total: 293, salons: 208, barbers: 70, unisex: 15, googleMatched: 204, rated: 201, medianRating: 4.8, meanRating: 4.65, medianReviews: 42, fiveStar: 33, withHours: 182, erp: 580.7 },
  { state: "ACT", name: "the ACT", total: 226, salons: 124, barbers: 83, unisex: 19, googleMatched: 226, rated: 220, medianRating: 4.7, meanRating: 4.59, medianReviews: 88.5, fiveStar: 33, withHours: 214, erp: 489.7 },
  { state: "NT", name: "the Northern Territory", total: 121, salons: 67, barbers: 37, unisex: 17, googleMatched: 121, rated: 114, medianRating: 4.8, meanRating: 4.64, medianReviews: 47.5, fiveStar: 28, withHours: 107, erp: 268.9 },
];

const sum = (key: "total" | "salons" | "barbers" | "unisex" | "googleMatched" | "rated" | "fiveStar" | "withHours") =>
  stateRows.reduce((a, r) => a + r[key], 0);

const total = sum("total");
const totalSalons = sum("salons");
const totalBarbers = sum("barbers");
const totalUnisex = sum("unisex");
const totalGoogleMatched = sum("googleMatched");
const totalRated = sum("rated");
const totalFiveStar = sum("fiveStar");
const totalWithHours = sum("withHours");

// National figures that can't be summed from the state rows (medians, percentiles, cross-field counts).
const national = {
  medianRating: 4.8,
  meanRating: 4.72,
  medianReviews: 53,
  p25Reviews: 21,
  p75Reviews: 122,
  rated45Plus: 11175,
  fiveStarUnder20Reviews: 2015,
  topRated2026: 1362,
  withWebsite: 8160,
  websiteIsSocial: 1369,
  largestChainListings: 126,
};

// Of the listings that publish opening hours (n = totalWithHours), how many open on each day.
const openByDay = [
  { day: "Mon", open: 7384 },
  { day: "Tue", open: 11365 },
  { day: "Wed", open: 11948 },
  { day: "Thu", open: 12279 },
  { day: "Fri", open: 12299 },
  { day: "Sat", open: 11244 },
  { day: "Sun", open: 3635 },
];
const openSevenDays = 2805;

// Latest in-person result per listing, 9 April to 4 November 2026.
const inPerson = {
  checked: 1194,
  open: 1006,
  closed: 188,
  byState: { VIC: 881, TAS: 267, SA: 38, NSW: 8 },
  closedByState: { VIC: 123, TAS: 58 },
};

const topSuburbs = [
  { suburb: "Adelaide", state: "SA", count: 56 },
  { suburb: "Perth", state: "WA", count: 54 },
  { suburb: "Penrith", state: "NSW", count: 47 },
  { suburb: "Sydney", state: "NSW", count: 47 },
  { suburb: "Wagga Wagga", state: "NSW", count: 43 },
  { suburb: "Bendigo", state: "VIC", count: 42 },
  { suburb: "Wollongong", state: "NSW", count: 41 },
  { suburb: "South Yarra", state: "VIC", count: 40 },
  { suburb: "Southport", state: "QLD", count: 40 },
  { suburb: "Coffs Harbour", state: "NSW", count: 39 },
  { suburb: "Shepparton", state: "VIC", count: 39 },
  { suburb: "Surry Hills", state: "NSW", count: 39 },
  { suburb: "Ballarat Central", state: "VIC", count: 38 },
  { suburb: "Dubbo", state: "NSW", count: 38 },
  { suburb: "Maroochydore", state: "QLD", count: 38 },
  { suburb: "Melbourne", state: "VIC", count: 38 },
  { suburb: "Richmond", state: "VIC", count: 38 },
];

const pct = (n: number, d: number) => Math.round((n / d) * 100);
const per10k = (n: number, erpThousands: number) => ((n / erpThousands) * 10).toFixed(1);
const fmt = (n: number) => n.toLocaleString("en-AU");
const byState = (s: string) => stateRows.find((r) => r.state === s)!;
const openOn = (day: string) => pct(openByDay.find((d) => d.day === day)!.open, totalWithHours);

const residentsPerListing = Math.round((ausErpThousands * 1000) / total / 100) * 100;
const topBarberState = [...stateRows].sort((a, b) => b.barbers / b.total - a.barbers / a.total)[0];

const description = `Original data from ${fmt(total)} Australian hair salon and barber listings: salons per 10,000 residents, barber share, Google ratings, opening hours and in-person checks.`;

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
    modifiedTime: dateModified,
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

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
              alternativeHeadline:
                "Hair salons and barbers per resident, barber share, Google-rating benchmarks, opening hours and in-person checks across all 8 Australian states and territories",
              url: path,
              datePublished,
              dateModified,
              inLanguage: "en-AU",
              isAccessibleForFree: true,
              license: "https://creativecommons.org/licenses/by/4.0/",
              author: { "@id": "https://www.findme.hair/#organization" },
              publisher: { "@id": "https://www.findme.hair/#organization" },
              about: { "@id": "https://www.findme.hair/#organization" },
              keywords: [
                "Australian hair industry data",
                "hair salons per capita Australia",
                "hairdresser statistics Australia 2026",
                "barber share by state",
                "barber industry Australia",
                "salon ratings benchmark",
              ],
              mainEntityOfPage: path,
            },
            {
              "@type": "Dataset",
              "@id": path + "#dataset",
              name: "findme.hair Australian Hair Industry Snapshot 2026",
              description: `Aggregate counts from ${fmt(total)} active hair salon and barber listings on findme.hair as at ${dateModified}. Google Business Profile ratings, review counts and opening hours as last synced (April to June 2026); in-person check results from April to November 2026; population from the ABS estimated resident population at 31 March 2026.`,
              url: path,
              datePublished,
              dateModified,
              creator: { "@id": "https://www.findme.hair/#organization" },
              license: "https://creativecommons.org/licenses/by/4.0/",
              isAccessibleForFree: true,
              isBasedOn: absRelease.url,
              keywords: ["Australian hair industry", "salon directory data", "hairdresser census"],
              spatialCoverage: { "@type": "Country", name: "Australia" },
              temporalCoverage: "2026-04/2026-11",
              variableMeasured: [
                "Active hair salon and barber listings by state",
                "Listings per 10,000 residents",
                "Business type distribution (hair salon, barber, unisex)",
                "Google rating and review count distribution",
                "Opening days from published hours",
                "Website on record",
                "In-person check results (open or closed)",
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
          <p className="text-editorial-overline">Data report · Updated November 2026</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            State of the Australian Hair Industry 2026
          </h1>
          <p className="mt-4 text-[var(--color-ink-light)] leading-relaxed">
            An aggregate snapshot of the {fmt(total)} hair salons and barbers listed on findme.hair on 7 November 2026, set against the latest official population figures. {pct(totalGoogleMatched, total)}% of listings are matched to their Google Business Profiles, and our team checks salons in person on the road. Beauty salons, nail bars, lash studios and day spas are excluded — this is hair, deliberately and only.
          </p>
          <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
            First published 22 May 2026 · Updated 7 November 2026 · CC BY 4.0 · Cite as: findme.hair (2026). <em>State of the Australian Hair Industry 2026</em>. https://www.findme.hair/press/state-of-australian-hair-industry-2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        {/* Key findings — the quotable lines */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Key findings
          </h2>
          <ul className="text-sm text-[var(--color-ink-light)] list-disc pl-5 space-y-3 leading-relaxed">
            <li>
              findme.hair lists {fmt(total)} hair salons and barbers, about one for every {fmt(residentsPerListing)} Australians ({per10k(total, ausErpThousands)} per 10,000 residents).
            </li>
            <li>
              Of the {fmt(inPerson.checked)} listed salons and barbers our team checked in person between April and November 2026, {fmt(inPerson.closed)} ({pct(inPerson.closed, inPerson.checked)}%) had closed.
            </li>
            <li>
              Almost half of the hair businesses with a perfect 5.0 Google rating ({fmt(national.fiveStarUnder20Reviews)} of {fmt(totalFiveStar)}) have fewer than 20 reviews.
            </li>
            <li>
              Sunday and Monday are the hair industry&rsquo;s days off: of the salons and barbers that publish opening hours, {openOn("Sun")}% open on Sundays and {openOn("Mon")}% on Mondays, against {openOn("Thu")}% on Thursdays and Fridays.
            </li>
            <li>
              In {topBarberState.name}, {pct(topBarberState.barbers, topBarberState.total)}% of listed hair businesses are barbers, the highest share in Australia; nationally it is {pct(totalBarbers, total)}%.
            </li>
          </ul>
        </section>

        {/* Top-line numbers */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Headline figures
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Stat label="Listed hair businesses" value={fmt(total)} />
            <Stat label="Hair salons" value={fmt(totalSalons)} />
            <Stat label="Barbers" value={fmt(totalBarbers)} />
            <Stat label="Unisex" value={fmt(totalUnisex)} />
            <Stat label="Per 10,000 residents" value={per10k(total, ausErpThousands)} />
            <Stat label="Median Google rating" value={national.medianRating.toFixed(1)} />
            <Stat label="Publish opening hours" value={`${pct(totalWithHours, total)}%`} />
            <Stat label="Checked in person" value={fmt(inPerson.checked)} />
          </div>
          <p className="mt-5 text-sm text-[var(--color-ink-light)]">
            Of the {fmt(total)} listings, {fmt(totalGoogleMatched)} ({pct(totalGoogleMatched, total)}%) are matched to their Google Business Profiles. Google ratings, review counts and opening hours are as at our last Google sync (April to June 2026). No chain dominates: the largest we can identify by name or website has {fmt(national.largestChainListings)} listings, {((national.largestChainListings / total) * 100).toFixed(1)}% of the total.
          </p>
        </section>

        {/* State breakdown */}
        <section className="card p-8 overflow-x-auto">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            By state and territory
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] mb-4 leading-relaxed">
            New South Wales has the most listings ({fmt(byState("NSW").total)}), but Western Australia ({per10k(byState("WA").total, byState("WA").erp)}) and Queensland ({per10k(byState("QLD").total, byState("QLD").erp)}) have the most per 10,000 residents. The Northern Territory ({per10k(byState("NT").total, byState("NT").erp)}) and the ACT ({per10k(byState("ACT").total, byState("ACT").erp)}) have the fewest. Population is the ABS estimated resident population at 31 March 2026.
          </p>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left py-2 pr-3">State</th>
                <th className="text-right py-2 pr-3">Listings</th>
                <th className="text-right py-2 pr-3">Residents (&rsquo;000)</th>
                <th className="text-right py-2 pr-3">Per 10,000 residents</th>
                <th className="text-right py-2">Google-matched per 10,000</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-ink-light)]">
              {stateRows.map((r) => (
                <tr key={r.state} className="border-b border-[var(--color-border)]">
                  <td className="py-2 pr-3 font-medium text-[var(--color-ink)]">{r.state}</td>
                  <td className="text-right py-2 pr-3">{fmt(r.total)}</td>
                  <td className="text-right py-2 pr-3">{r.erp.toLocaleString("en-AU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td className="text-right py-2 pr-3">{per10k(r.total, r.erp)}</td>
                  <td className="text-right py-2">{per10k(r.googleMatched, r.erp)}</td>
                </tr>
              ))}
              <tr className="font-medium text-[var(--color-ink)]">
                <td className="py-2 pr-3">Australia</td>
                <td className="text-right py-2 pr-3">{fmt(total)}</td>
                <td className="text-right py-2 pr-3">{ausErpThousands.toLocaleString("en-AU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td className="text-right py-2 pr-3">{per10k(total, ausErpThousands)}</td>
                <td className="text-right py-2">{per10k(totalGoogleMatched, ausErpThousands)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-[var(--color-ink-muted)] leading-relaxed">
            Victoria and Tasmania, where our team checks salons in person, also list salons that are not matched to a Google Business Profile ({fmt(byState("VIC").total - byState("VIC").googleMatched)} in Victoria, {fmt(byState("TAS").total - byState("TAS").googleMatched)} in Tasmania). The last column counts only Google-matched listings, for a like-for-like comparison between states. These are directory counts, not an official census.
          </p>

          <h3 className="mt-8 text-lg text-[var(--color-ink)] mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Salons and barbers
          </h3>
          <p className="text-sm text-[var(--color-ink-light)] mb-4 leading-relaxed">
            Nationally, {pct(totalBarbers, total)}% of listed hair businesses are barbers. The share is highest in the ACT ({pct(byState("ACT").barbers, byState("ACT").total)}%), the Northern Territory ({pct(byState("NT").barbers, byState("NT").total)}%) and South Australia ({pct(byState("SA").barbers, byState("SA").total)}%), and lowest in New South Wales ({pct(byState("NSW").barbers, byState("NSW").total)}%).
          </p>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left py-2 pr-3">State</th>
                <th className="text-right py-2 pr-3">Hair salons</th>
                <th className="text-right py-2 pr-3">Barbers</th>
                <th className="text-right py-2 pr-3">Unisex</th>
                <th className="text-right py-2">Barber share</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-ink-light)]">
              {stateRows.map((r) => (
                <tr key={r.state} className="border-b border-[var(--color-border)]">
                  <td className="py-2 pr-3 font-medium text-[var(--color-ink)]">{r.state}</td>
                  <td className="text-right py-2 pr-3">{fmt(r.salons)}</td>
                  <td className="text-right py-2 pr-3">{fmt(r.barbers)}</td>
                  <td className="text-right py-2 pr-3">{fmt(r.unisex)}</td>
                  <td className="text-right py-2">{pct(r.barbers, r.total)}%</td>
                </tr>
              ))}
              <tr className="font-medium text-[var(--color-ink)]">
                <td className="py-2 pr-3">Australia</td>
                <td className="text-right py-2 pr-3">{fmt(totalSalons)}</td>
                <td className="text-right py-2 pr-3">{fmt(totalBarbers)}</td>
                <td className="text-right py-2 pr-3">{fmt(totalUnisex)}</td>
                <td className="text-right py-2">{pct(totalBarbers, total)}%</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* In-person checks — first-hand data */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Checked in person
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm mb-5">
            <Stat label="Listings checked in person" value={fmt(inPerson.checked)} />
            <Stat label="Open and trading" value={fmt(inPerson.open)} />
            <Stat label="Found closed" value={fmt(inPerson.closed)} />
          </div>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            Our team visits salons on the road and records whether each one is open and trading. Between April and November 2026 it checked {fmt(inPerson.checked)} listed salons and barbers in person: {fmt(inPerson.byState.VIC)} in Victoria, {fmt(inPerson.byState.TAS)} in Tasmania, {fmt(inPerson.byState.SA)} in South Australia and {fmt(inPerson.byState.NSW)} in New South Wales. At the latest visit, {fmt(inPerson.open)} ({pct(inPerson.open, inPerson.checked)}%) were open and trading and {fmt(inPerson.closed)} ({pct(inPerson.closed, inPerson.checked)}%) had closed: {pct(inPerson.closedByState.VIC, inPerson.byState.VIC)}% in Victoria and {pct(inPerson.closedByState.TAS, inPerson.byState.TAS)}% in Tasmania.
          </p>
          <p className="mt-3 text-sm text-[var(--color-ink-light)] leading-relaxed">
            This is not an industry closure rate. It shows how often a listed salon was no longer there when someone actually walked in, which is why we check in person. Salons found closed are never named.
          </p>
        </section>

        {/* Ratings */}
        <section className="card p-8 overflow-x-auto">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Google ratings and reviews
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] mb-4 leading-relaxed">
            {fmt(totalRated)} listings ({pct(totalRated, total)}%) have a Google rating. The median is {national.medianRating.toFixed(1)} stars and the median listing has {national.medianReviews} reviews; the middle half have between {national.p25Reviews} and {national.p75Reviews}. {pct(national.rated45Plus, totalRated)}% are rated 4.5 or higher and {pct(totalFiveStar, totalRated)}% hold a perfect 5.0, but almost half of those perfect scores rest on fewer than 20 reviews. Queensland has the highest median rating ({byState("QLD").medianRating.toFixed(1)}); the ACT has the lowest ({byState("ACT").medianRating.toFixed(1)}) but the most reviews per listing (median {byState("ACT").medianReviews}).
          </p>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left py-2 pr-3">State</th>
                <th className="text-right py-2 pr-3">Rated listings</th>
                <th className="text-right py-2 pr-3">Median rating</th>
                <th className="text-right py-2 pr-3">Average rating</th>
                <th className="text-right py-2 pr-3">Median reviews</th>
                <th className="text-right py-2">Rated 5.0</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-ink-light)]">
              {stateRows.map((r) => (
                <tr key={r.state} className="border-b border-[var(--color-border)]">
                  <td className="py-2 pr-3 font-medium text-[var(--color-ink)]">{r.state}</td>
                  <td className="text-right py-2 pr-3">{fmt(r.rated)}</td>
                  <td className="text-right py-2 pr-3">{r.medianRating.toFixed(1)}</td>
                  <td className="text-right py-2 pr-3">{r.meanRating.toFixed(2)}</td>
                  <td className="text-right py-2 pr-3">{r.medianReviews}</td>
                  <td className="text-right py-2">{fmt(r.fiveStar)}</td>
                </tr>
              ))}
              <tr className="font-medium text-[var(--color-ink)]">
                <td className="py-2 pr-3">Australia</td>
                <td className="text-right py-2 pr-3">{fmt(totalRated)}</td>
                <td className="text-right py-2 pr-3">{national.medianRating.toFixed(1)}</td>
                <td className="text-right py-2 pr-3">{national.meanRating.toFixed(2)}</td>
                <td className="text-right py-2 pr-3">{national.medianReviews}</td>
                <td className="text-right py-2">{fmt(totalFiveStar)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-sm text-[var(--color-ink-light)] leading-relaxed">
            {fmt(national.topRated2026)} listings ({pct(national.topRated2026, total)}%) hold the findme.hair Top Rated 2026 badge, given to the top 10% by weighted Google rating. <Link href="/top-rated" className="underline">How the badge is calculated</Link>.
          </p>
        </section>

        {/* Opening hours */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Opening hours
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] mb-4 leading-relaxed">
            {fmt(totalWithHours)} listings ({pct(totalWithHours, total)}%) have published opening hours on record from Google. Thursday and Friday are the busiest trading days ({openOn("Thu")}% open), with Saturday close behind ({openOn("Sat")}%). Only {openOn("Sun")}% open on Sundays and {openOn("Mon")}% on Mondays, and {pct(openSevenDays, totalWithHours)}% open seven days a week.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 text-sm">
            {openByDay.map((d) => (
              <Stat key={d.day} label={`Open ${d.day}`} value={`${pct(d.open, totalWithHours)}%`} />
            ))}
          </div>
        </section>

        {/* Websites */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Websites
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            {fmt(national.withWebsite)} listings ({pct(national.withWebsite, total)}%) have a website on record; {pct(total - national.withWebsite, total)}% have none. Of those with a website, {fmt(national.websiteIsSocial)} ({pct(national.websiteIsSocial, national.withWebsite)}%, about one in six) point to a social media page, almost all Facebook or Instagram, rather than a site of their own.
          </p>
        </section>

        {/* Top suburbs */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Suburbs with the most hair businesses
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] mb-4 leading-relaxed">
            These are counts of listings by suburb, not density per square kilometre. The city-centre suburbs of Adelaide ({topSuburbs[0].count}) and Perth ({topSuburbs[1].count}) lead, followed by Penrith and the Sydney CBD ({topSuburbs[2].count} each). Regional centres rank high: Wagga Wagga ({topSuburbs[4].count}), Bendigo ({topSuburbs[5].count}), Coffs Harbour and Shepparton ({topSuburbs[9].count} each), and Ballarat Central and Dubbo ({topSuburbs[12].count} each). South Yarra ({topSuburbs[7].count}) has the most of any Melbourne suburb. Every suburb with {topSuburbs[topSuburbs.length - 1].count} or more listings is shown.
          </p>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left py-2 pr-3">Suburb</th>
                <th className="text-left py-2 pr-3">State</th>
                <th className="text-right py-2">Listings</th>
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

        {/* Method */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            How we counted
          </h2>
          <ul className="text-sm text-[var(--color-ink-light)] list-disc pl-5 space-y-2 leading-relaxed">
            <li>Snapshot: the findme.hair database on 7 November 2026. The frame is all public listings (status active, n = {fmt(total)}). Closed, duplicate, excluded and not-yet-confirmed records are not counted. Home salons without their own Google listing are kept private and are not counted.</li>
            <li>Scope: hair salons and barbers. Businesses that mainly offer nails, beauty, lashes, brows, spa or tattoo are excluded.</li>
            <li>Business type is the directory&rsquo;s own classification of each listing as a hair salon, barber or unisex business.</li>
            <li>Google data: {fmt(totalGoogleMatched)} listings are matched to their Google Business Profiles. Google ratings, review counts and opening hours are as at our last Google sync, between April and June 2026 (mostly April). {fmt(total - totalGoogleMatched)} listings, almost all in Victoria and Tasmania, have no Google match.</li>
            <li>Ratings: medians, averages and shares use only listings with a Google rating (n = {fmt(totalRated)}).</li>
            <li>Opening hours: a listing publishes hours if its Google opening hours on record give times for at least one day. A day counts as open if the listing has an opening time that day.</li>
            <li>Websites: the website on record for each listing. A social media page means a facebook.com, instagram.com or tiktok.com address.</li>
            <li>Chains: the largest chain is the one with the most listings matching its name or website address.</li>
            <li>Population: Australian Bureau of Statistics, <a href={absRelease.url} className="underline">{absRelease.name}</a>, released 17 September 2026. Estimated resident population at 31 March 2026; Australia = 27,921,150 (includes Other Territories). Rate per 10,000 = listings ÷ population × 10,000.</li>
            <li>In-person checks: the latest result our team recorded for each listing, open and trading or closed, on visits from 9 April to 4 November 2026. Visits that could not confirm either way, and duplicate records, are not counted.</li>
            <li>Not in this edition: walk-in policy, mobile service, specialties and online booking. These are either inferred from salon websites or recorded for too few listings to count reliably, so we left them out.</li>
            <li>Every figure comes from a saved, repeatable query. The numbers move as salons open, close and are checked again.</li>
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
            Suggested citation: <em>findme.hair (2026). State of the Australian Hair Industry 2026 (updated 7 November 2026). https://www.findme.hair/press/state-of-australian-hair-industry-2026</em>
          </p>
          <p className="mt-3 text-sm text-[var(--color-ink-light)]">
            For deeper cuts of the data (suburb-by-suburb spreadsheets, custom segments), contact via the <Link href="/contact" className="underline">contact page</Link>.
          </p>
        </section>

        {/* Footer cross-links */}
        <section className="card p-8 bg-[var(--color-ink)] text-[var(--color-white)]">
          <h2 className="text-xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            About findme.hair
          </h2>
          <p className="text-sm leading-relaxed">
            findme.hair is Australia&rsquo;s hair salon and barber directory: hair only, with no beauty, nails or spa. Listings are matched to their Google Business Profiles where one exists, and our team checks salons in person on the road. There is no booking commission. <Link href="/press" className="underline">See the full press kit</Link> · <Link href="/about" className="underline">About</Link>
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
