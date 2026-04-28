import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;

const path = "https://www.findme.hair/contact";
const title = "Contact findme.hair — Australia's Hair & Barber Directory";
const description = "Get in touch with findme.hair — corrections, listing requests, salon claims, partnership enquiries. We respond within two business days.";

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
    type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: title,
        url: path,
        description,
        publisher: { "@id": "https://www.findme.hair/#organization" },
        inLanguage: "en-AU",
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.findme.hair/" },
          { "@type": "ListItem", position: 2, name: "Contact", item: path },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Contact</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-editorial-overline">Get in touch</p>
          <h1 className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
            Contact findme.hair
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            Corrections, listing requests, claims, partnerships — we read every email and respond within two business days.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>Email</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed mb-3">
            For listing corrections, removal requests, salon claims and editorial enquiries:
          </p>
          <a href="mailto:hello@findme.hair" className="text-base font-medium text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
            hello@findme.hair
          </a>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>Common requests</h2>
          <ul className="grid gap-3 text-sm text-[var(--color-ink-light)] leading-relaxed">
            <li>
              <strong className="text-[var(--color-ink)]">Listing wrong, missing, or out of date?</strong>{" "}
              Send the salon name, suburb and what needs correcting.
            </li>
            <li>
              <strong className="text-[var(--color-ink)]">Salon owner — claim your listing.</strong>{" "}
              See <Link href="/claim" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] underline">/claim</Link> or email us with the salon URL.
            </li>
            <li>
              <strong className="text-[var(--color-ink)]">Add a salon we missed.</strong>{" "}
              Send the business name, address and Google Maps link.
            </li>
            <li>
              <strong className="text-[var(--color-ink)]">Press &amp; partnerships.</strong>{" "}
              See <Link href="/press" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] underline">/press</Link> for media kit and editorial standards.
            </li>
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: "var(--font-serif)" }}>Editorial standards</h2>
          <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
            Every listing on findme.hair is hand-verified. We do not accept payment for placement. See{" "}
            <Link href="/trust" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] underline">our trust &amp; editorial standards</Link>{" "}
            for the full process and review policy.
          </p>
        </section>
      </div>
    </main>
  );
}
