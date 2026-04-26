import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "findme.hair — Australia's Hair Salon & Barber Directory",
    template: '%s',
  },
  description:
    "Hand-verified hair salons and barber shops across Australia. Hair and barber only — no beauty, no nails, no spa. Just hair.",
  metadataBase: new URL("https://www.findme.hair"),
  openGraph: {
    title: "findme.hair",
    description:
      "Find your next haircut. Australia's premium hair salon & barber directory.",
    url: "https://www.findme.hair",
    siteName: "findme.hair",
    locale: "en_AU",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
  other: {
    "theme-color": "#C9A96E",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://taxuueemqtquihhzhgnr.supabase.co" />
        <link rel="alternate" hrefLang="en-AU" href="https://www.findme.hair/" />
        <meta name="theme-color" content="#C9A96E" />
        {/* Organization + WebSite JSON-LD — entity authority signal */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://www.findme.hair/#organization',
                  name: 'findme.hair',
                  alternateName: 'Find Me Hair',
                  url: 'https://www.findme.hair',
                  logo: 'https://www.findme.hair/og-image.jpg',
                  description: "Australia's hand-verified hair salon and barber directory. Hair only — no beauty, no nails, no spa.",
                  areaServed: { '@type': 'Country', name: 'Australia' },
                  knowsAbout: ['hairdressers', 'barbers', 'hair salons', 'mobile hairdressers', 'haircut', 'balayage', 'bridal hair', 'kids haircuts', 'mens haircuts', 'curly hair', 'hair extensions', 'Australian salons'],
                  sameAs: ['https://www.sheargenius.com.au'],
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://www.findme.hair/#website',
                  url: 'https://www.findme.hair',
                  name: 'findme.hair',
                  description: "Australia's hand-verified hair salon and barber directory.",
                  inLanguage: 'en-AU',
                  publisher: { '@id': 'https://www.findme.hair/#organization' },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: { '@type': 'EntryPoint', urlTemplate: 'https://www.findme.hair/search?q={search_term_string}' },
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-[var(--color-white)] border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <BrandMark size="md" />


        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/search"
            className="text-sm font-medium text-[var(--color-ink-light)] hover:text-[var(--color-ink)]"
          >
            Browse
          </Link>
          <Link
            href="/for-salons"
            className="text-sm font-medium text-[var(--color-ink-light)] hover:text-[var(--color-ink)]"
          >
            For Salons
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-[var(--color-ink-light)] hover:text-[var(--color-ink)]"
          >
            Blog
          </Link>
          <Link
            href="/search"
            className="btn-gold text-sm !py-2 !px-5"
          >
            Find a salon
          </Link>
        </nav>

        {/* Mobile nav trigger */}
        <Link
          href="/search"
          className="md:hidden btn-gold text-xs !py-2 !px-4"
        >
          Search
        </Link>
      </div>
    </header>
  );
}

function SiteFooter() {
  const states = [
    { code: "vic", name: "Victoria" },
    { code: "nsw", name: "New South Wales" },
    { code: "qld", name: "Queensland" },
    { code: "wa", name: "Western Australia" },
    { code: "sa", name: "South Australia" },
    { code: "tas", name: "Tasmania" },
    { code: "nt", name: "Northern Territory" },
    { code: "act", name: "ACT" },
  ];

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-white)]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-1">
            <BrandMark size="md" href={null} />
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Australia&rsquo;s hand-verified hair salon &amp; barber directory.
              Hair only — nothing else.
            </p>
          </div>

          {/* Browse by state */}
          <div>
            <p className="text-editorial-overline mb-4">Browse by state</p>
            <ul className="space-y-2">
              {states.map((s) => (
                <li key={s.code}>
                  <Link
                    href={`/${s.code}`}
                    className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Directory */}
          <div>
            <p className="text-editorial-overline mb-4">Find a haircut</p>
            <ul className="space-y-2">
              <li>
                <Link href="/hairdresser-near-me" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Hairdresser Near Me
                </Link>
              </li>
              <li>
                <Link href="/barber-near-me" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Barber Near Me
                </Link>
              </li>
              <li>
                <Link href="/haircut-near-me" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Haircut Near Me
                </Link>
              </li>
              <li>
                <Link href="/search?type=hair_salon" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  All Hair Salons
                </Link>
              </li>
              <li>
                <Link href="/search?type=barber" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  All Barber Shops
                </Link>
              </li>
              <li>
                <Link href="/for-salons" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  For Salon Owners
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="text-editorial-overline mb-4">Services</p>
            <ul className="space-y-2">
              <li>
                <Link href="/services/mobile-hairdresser" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Mobile Hairdressers
                </Link>
              </li>
              <li>
                <Link href="/services/balayage-specialist" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Balayage Specialists
                </Link>
              </li>
              <li>
                <Link href="/services/curly-hair-specialist" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Curly Hair Specialists
                </Link>
              </li>
              <li>
                <Link href="/services/barber" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Barber Shops
                </Link>
              </li>
              <li>
                <Link href="/services/bridal-hair" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Bridal Hair
                </Link>
              </li>
              <li>
                <Link href="/services/hair-extensions" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Hair Extensions
                </Link>
              </li>
              <li>
                <Link href="/services/mens-haircut" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Men&rsquo;s Haircuts
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <p className="text-editorial-overline mb-4">About</p>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  About findme.hair
                </Link>
              </li>
              <li>
                <Link href="/claim" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Claim Your Listing
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Contact
                </Link>
              </li>
            </ul>
            <p className="text-editorial-overline mb-4 mt-8">For Professionals</p>
            <ul className="space-y-2">
              <li>
                <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Professional Hairdressing Scissors
                </a>
              </li>
              <li>
                <a href="https://www.sheargenius.com.au/pages/hairdressing-scissor-sharpening-service" target="_blank" rel="noopener" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Scissor Sharpening Service
                </a>
              </li>
              <li>
                <a href="https://www.sheargenius.com.au/pages/barber-scissors" target="_blank" rel="noopener" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Barber Scissors Australia
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--color-border-light)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-ink-muted)]">
            &copy; {new Date().getFullYear()} findme.hair — An Australian hair directory.
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Every listing hand-verified. Hair &amp; barber only. Scissors by{" "}
            <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="hover:text-[var(--color-gold-dark)]">
              ShearGenius
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
