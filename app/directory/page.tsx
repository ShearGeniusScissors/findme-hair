import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { TOP_SUBURBS } from "@/lib/suburbConfig";

export const revalidate = 86400;

const path = "https://www.findme.hair/directory";
const title = `findme.hair Directory ${new Date().getFullYear()} | Australian Salon Index`;
const description = "Complete directory index of findme.hair — every state, region, city and suburb. Browse hairdressers, barbers, hair salons and mobile stylists across Australia.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: {
    title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

const STATES = [
  { code: "vic", name: "Victoria" },
  { code: "nsw", name: "New South Wales" },
  { code: "qld", name: "Queensland" },
  { code: "wa", name: "Western Australia" },
  { code: "sa", name: "South Australia" },
  { code: "tas", name: "Tasmania" },
  { code: "nt", name: "Northern Territory" },
  { code: "act", name: "Australian Capital Territory" },
];

const NEAR_ME_PILLARS = [
  { href: "/hairdresser-near-me", title: "Hairdresser Near Me" },
  { href: "/barber-near-me", title: "Barber Near Me" },
  { href: "/haircut-near-me", title: "Haircut Near Me" },
  { href: "/mobile-hairdresser-near-me", title: "Mobile Hairdresser Near Me" },
  { href: "/cheap-haircut-near-me", title: "Cheap Haircut Near Me" },
];

const SERVICE_PIVOTS = [
  { route: "best-hairdresser", label: "Best Hairdressers" },
  { route: "best-barber", label: "Best Barbers" },
  { route: "mobile-hairdresser", label: "Mobile Hairdressers" },
  { route: "korean-hair-salon", label: "Korean Hair Salons" },
  { route: "japanese-hairdresser", label: "Japanese Hairdressers" },
  { route: "walk-in-barber", label: "Walk-in Barbers" },
  { route: "kids-hairdresser", label: "Kids Hairdressers" },
  { route: "balayage-specialist", label: "Balayage Specialists" },
  { route: "bridal-hair", label: "Bridal Hair Stylists" },
  { route: "hair-extensions", label: "Hair Extension Specialists" },
  { route: "mens-haircut", label: "Men's Haircuts" },
  { route: "curly-hair-specialist", label: "Curly Hair Specialists" },
];

const BLOG_POSTS = [
  { slug: "how-to-choose-a-hairdresser", title: "How to choose a hairdresser" },
  { slug: "hair-salon-vs-barber-shop", title: "Hair salon vs barber shop" },
  { slug: "questions-to-ask-your-hairdresser", title: "Questions to ask your hairdresser" },
  { slug: "how-much-does-a-haircut-cost-in-australia", title: "How much does a haircut cost in Australia" },
  { slug: "what-is-balayage", title: "What is balayage" },
  { slug: "how-to-find-a-good-barber", title: "How to find a good barber" },
  { slug: "tipping-your-hairdresser-in-australia", title: "Tipping your hairdresser in Australia" },
  { slug: "how-often-should-you-get-a-haircut", title: "How often should you get a haircut" },
  { slug: "what-to-do-if-you-hate-your-haircut", title: "What to do if you hate your haircut" },
  { slug: "how-to-prepare-for-a-hair-appointment", title: "How to prepare for a hair appointment" },
];

export default function DirectoryPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        url: path,
        description,
        isPartOf: { '@type': 'WebSite', url: 'https://www.findme.hair', name: 'findme.hair' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Directory', item: path },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Directory</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-editorial-overline">findme.hair</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Complete Directory Index
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            Every section of findme.hair on one page. States, regions, cities, suburbs and editorial guides — for browsing, sharing, and giving search engines and AI assistants a clean view of the directory.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>A&ndash;Z list of every salon</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-3">
            Complete listing of every verified hair salon and barber on findme.hair, paginated by 100. The fastest way to browse the whole directory.
          </p>
          <Link href="/directory/salons/1" className="inline-block btn-gold text-sm">
            Browse all salons &rarr;
          </Link>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Find a haircut</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {NEAR_ME_PILLARS.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">{p.title}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Browse by state</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {STATES.map((s) => (
              <li key={s.code}>
                <Link href={`/${s.code}`} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Cities — by service</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">Twelve service categories across {PIVOT_CITIES.length} major Australian cities.</p>
          <div className="space-y-6">
            {SERVICE_PIVOTS.map((sv) => (
              <div key={sv.route}>
                <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-2">{sv.label}</h3>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {PIVOT_CITIES.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/${sv.route}/${c.slug}`} className="text-xs text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Suburbs — high-density coverage</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">{TOP_SUBURBS.length} Australian suburbs with dedicated pages for hairdresser, barber, hair salon, and at-home hairdresser searches.</p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-2">/hairdresser/[suburb]</h3>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {TOP_SUBURBS.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/hairdresser/${s.slug}`} className="text-xs text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-2">/barber/[suburb]</h3>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {TOP_SUBURBS.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/barber/${s.slug}`} className="text-xs text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-2">/hair-salon/[suburb]</h3>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {TOP_SUBURBS.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/hair-salon/${s.slug}`} className="text-xs text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-2">/at-home-hairdresser/[suburb]</h3>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {TOP_SUBURBS.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/at-home-hairdresser/${s.slug}`} className="text-xs text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Editorial guides</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {BLOG_POSTS.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Other</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <li><Link href="/about" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">About findme.hair</Link></li>
            <li><Link href="/for-salons" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">For salon owners</Link></li>
            <li><Link href="/claim" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Claim your listing</Link></li>
            <li><Link href="/blog" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Editorial blog</Link></li>
            <li><Link href="/search" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">Search the directory</Link></li>
            <li><Link href="/sitemap.xml" className="text-sm text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">XML sitemap</Link></li>
          </ul>
        </section>

      </div>
    </main>
  );
}
