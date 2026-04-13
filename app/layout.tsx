import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import Link from "next/link";
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
  title: "findme.hair — Australia's Hair Salon & Barber Directory",
  description:
    "Hand-verified hair salons and barber shops across Australia. Hair and barber only — no beauty, no nails, no spa. Just hair.",
  metadataBase: new URL("https://findme.hair"),
  openGraph: {
    title: "findme.hair",
    description:
      "Find your next haircut. Australia's premium hair salon & barber directory.",
    url: "https://findme.hair",
    siteName: "findme.hair",
    locale: "en_AU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
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
        <Link href="/" className="flex items-center gap-2">
          <span className="font-[var(--font-serif)] text-xl font-normal tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}>
            findme<span className="text-[var(--color-gold)]">.</span>hair
          </span>
        </Link>

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
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <p
              className="text-xl tracking-tight text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              findme<span className="text-[var(--color-gold)]">.</span>hair
            </p>
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
            <p className="text-editorial-overline mb-4">Directory</p>
            <ul className="space-y-2">
              <li>
                <Link href="/search?type=hair_salon" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Hair Salons
                </Link>
              </li>
              <li>
                <Link href="/search?type=barber" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Barber Shops
                </Link>
              </li>
              <li>
                <Link href="/search?type=unisex" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Unisex Salons
                </Link>
              </li>
              <li>
                <Link href="/for-salons" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  For Salon Owners
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
                <Link href="/contact" className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--color-border-light)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-ink-muted)]">
            &copy; {new Date().getFullYear()} findme.hair — An Australian hair directory.
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Every listing hand-verified. Hair &amp; barber only.
          </p>
        </div>
      </div>
    </footer>
  );
}
