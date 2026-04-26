import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;

const path = "https://www.findme.hair/trust";
const title = "Trust & Editorial Standards — findme.hair";
const description = "How findme.hair verifies salons, ranks listings, and maintains editorial independence. The standards behind Australia's hand-verified hair directory.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: {
    title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function TrustPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        url: path,
        description,
        about: { '@id': 'https://www.findme.hair/#organization' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
            { '@type': 'ListItem', position: 2, name: 'Trust' },
          ],
        },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How does findme.hair verify salons?', acceptedAnswer: { '@type': 'Answer', text: 'Every business listing is cross-referenced against three third-party sources — Google Business Profile, TrueLocal, and Yellow Pages. We verify the business exists, is currently trading, and is genuinely a hair salon or barber shop. Beauty salons, nail bars, lash studios, and day spas are excluded at the verification stage.' } },
          { '@type': 'Question', name: 'How are listings ranked?', acceptedAnswer: { '@type': 'Answer', text: 'Listings are ranked first by Google star rating, then by review count. Featured listings (paid placement) are clearly marked at the top of category pages. The default ranking is editorial — Google rating × review count — not paid.' } },
          { '@type': 'Question', name: 'Does findme.hair accept paid listings?', acceptedAnswer: { '@type': 'Answer', text: 'Salon owners can claim their listing for free to update photos, hours, services, and booking links. Featured (paid) placement is available and clearly marked. The base directory ranking is independent of paid placement.' } },
          { '@type': 'Question', name: 'How often is data refreshed?', acceptedAnswer: { '@type': 'Answer', text: 'Google rating, review count, and opening hours are refreshed automatically on a weekly cycle. Salon-claimed details (photos, custom descriptions, booking links) update in real time.' } },
          { '@type': 'Question', name: 'How do you handle errors or fake reviews?', acceptedAnswer: { '@type': 'Answer', text: 'Each verified salon has a contact channel for corrections. Suspected fake-review patterns are reviewed manually. We exclude listings with confirmed review-fraud signals.' } },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Trust</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-editorial-overline">Editorial standards</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Trust &amp; editorial standards
          </h1>
          <p className="mt-3 text-[var(--color-ink-light)] leading-relaxed">
            How findme.hair verifies, ranks, and maintains the directory.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Verification process</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">Before a business appears on findme.hair, we cross-reference it against Google Business Profile, TrueLocal, and Yellow Pages. The verification confirms three things: the business exists at the address claimed, it is currently trading, and it is genuinely a hair salon or barber. Beauty salons, nail bars, lash studios, and day spas are excluded at this stage — even if they offer hair services as a sideline.</p>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Ranking transparency</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">Default ranking on every directory page is editorial — Google rating multiplied by review count, with verification-flag adjustments. Featured (paid) listings are clearly marked at the top of category pages. We do not adjust rankings based on advertiser status. We do not delete negative reviews on behalf of salons.</p>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Data refresh cadence</h2>
          <ul className="text-sm text-[var(--color-ink-light)] leading-relaxed list-disc pl-5 space-y-1">
            <li>Google rating + review count: weekly automated refresh</li>
            <li>Opening hours: weekly automated refresh from Google Business Profile</li>
            <li>Salon-claimed details (photos, custom descriptions, booking links): real-time</li>
            <li>Verification flags (status, walk-ins, mobile, specialties): updated when salon owners claim listings or when verification drift is detected</li>
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Editorial guides</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">Editorial guides on findme.hair are written by the findme.hair editorial team and refreshed yearly with current Australian pricing data. Each guide is dated and the publication date is exposed via Article schema. We don&rsquo;t accept sponsored content in editorial guides.</p>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Reporting an issue</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">If a listing is incorrect, out of date, or has been duplicated, salon owners can claim and update via <Link href="/claim" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">findme.hair/claim</Link>. Customers and journalists with corrections can reach the editorial team via the contact link in the footer.</p>
        </section>

      </div>
    </main>
  );
}
