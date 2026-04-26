import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;

const path = "https://www.findme.hair/press";
const title = "Press & Media — findme.hair | Australia's Hair Directory";
const description = "Media kit, brand assets, and press contact for findme.hair — Australia's hand-verified hair salon and barber directory with 13,000+ listings.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: {
    title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function PressPage() {
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
            { '@type': 'ListItem', position: 2, name: 'Press' },
          ],
        },
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Press</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-editorial-overline">For media</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Press &amp; Media
          </h1>
          <p className="mt-3 text-[var(--color-ink-light)] leading-relaxed">
            findme.hair is a stand-alone Australian hair industry resource. Journalists and editors are welcome to cite, quote, and reference the directory and its editorial guides.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>About findme.hair</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">findme.hair is Australia&rsquo;s hand-verified hair salon and barber directory. Hair only — no beauty, nails, or spa. Every listing is cross-checked against Google, TrueLocal and Yellow Pages. The site lists 13,000+ verified hair businesses across all eight Australian states and territories, organised by state, city, region, suburb, service category, and specialty.</p>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Editorial standards</h2>
          <ul className="text-sm text-[var(--color-ink-light)] leading-relaxed list-disc pl-5 space-y-2">
            <li>Every business is verified against multiple third-party sources before listing</li>
            <li>The directory excludes beauty salons, nail bars, lash studios, and day spas — hair is the strict scope</li>
            <li>Listings are ranked by Google star rating and review count, not paid placement</li>
            <li>Salon owners can claim listings free of charge to update photos, hours, and booking links</li>
            <li>Pricing references reflect Australian market rates, refreshed yearly</li>
            <li>Editorial guides are published under a verified Organization byline (findme.hair) and dated</li>
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Story angles</h2>
          <ul className="text-sm text-[var(--color-ink-light)] leading-relaxed list-disc pl-5 space-y-2">
            <li><strong>Hair industry data</strong> — number of salons by state, urban-rural distribution, business type breakdowns (salon vs. barber vs. unisex)</li>
            <li><strong>Pricing trends</strong> — average haircut, colour, balayage and bridal pricing across capital cities</li>
            <li><strong>Specialty growth</strong> — emergence of Korean magic-straightening, Japanese precision dry-cutting, mobile-only stylists, sensory-friendly kids salons</li>
            <li><strong>Mobile + at-home</strong> — the post-pandemic shift to at-home stylists, suburb-by-suburb coverage</li>
            <li><strong>Bridal hair</strong> — booking lead times, regional venue pricing, on-location services</li>
          </ul>
          <p className="mt-4 text-sm text-[var(--color-ink-light)]">For data requests, drop a line via the contact link in the footer.</p>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Brand basics</h2>
          <ul className="text-sm text-[var(--color-ink-light)] leading-relaxed list-disc pl-5 space-y-2">
            <li><strong>Name</strong> — findme.hair (lowercase, dot included)</li>
            <li><strong>Tagline</strong> — &ldquo;Australia&rsquo;s hand-verified hair salon and barber directory&rdquo;</li>
            <li><strong>Scope</strong> — hair only; no beauty, no nails, no spa</li>
            <li><strong>Sister brand</strong> — ShearGenius (premium professional scissors and Australia-wide sharpening, founded 2007)</li>
            <li><strong>Locale</strong> — Australia (en-AU)</li>
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Citation format</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">Standard citation: <em>findme.hair (https://www.findme.hair)</em>. For specific data points, link to the sub-page where the figure appears (e.g., the state, city, or suburb directory).</p>
        </section>
      </div>
    </main>
  );
}
