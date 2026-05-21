import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;

const path = "https://www.findme.hair/for-salons/badge";
const title = "Salon owner: add the findme.hair badge to your website (free)";
const description =
  "Copy-paste HTML for the 'Featured on findme.hair' badge. Free for any active salon or barber listing. Helps clients see you&rsquo;re a verified salon and helps your site's SEO.";

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

const badgeHtmlLight = `<a href="https://www.findme.hair/" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:#ffffff;color:#1a1a1a;border:1px solid #e6e1d8;border-radius:8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;text-decoration:none;line-height:1.2">
  <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#c9a96e;color:#1a1a1a;border-radius:50%;font-weight:700;font-size:13px;font-family:Georgia,'Times New Roman',serif">F</span>
  <span><strong>Listed on</strong> findme.hair<br><span style="font-size:11px;color:#7a7163">Australia's verified hair directory</span></span>
</a>`;

const badgeHtmlDark = `<a href="https://www.findme.hair/" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:#1a1a1a;color:#ffffff;border:1px solid #2a2a2a;border-radius:8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;text-decoration:none;line-height:1.2">
  <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#c9a96e;color:#1a1a1a;border-radius:50%;font-weight:700;font-size:13px;font-family:Georgia,'Times New Roman',serif">F</span>
  <span><strong>Listed on</strong> findme.hair<br><span style="font-size:11px;color:#a8a094">Australia's verified hair directory</span></span>
</a>`;

const badgeHtmlInline = `<a href="https://www.findme.hair/" target="_blank" rel="noopener">Listed on findme.hair</a>`;

export default function BadgePage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          url: path,
          description,
          about: { "@id": "https://www.findme.hair/#organization" },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.findme.hair/" },
              { "@type": "ListItem", position: 2, name: "For Salons", item: "https://www.findme.hair/for-salons" },
              { "@type": "ListItem", position: 3, name: "Badge" },
            ],
          },
        }}
      />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <Link href="/for-salons" className="hover:text-[var(--color-gold-dark)]">For Salons</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Badge</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-editorial-overline">For salon owners</p>
          <h1 className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
            Add the findme.hair badge to your website
          </h1>
          <p className="mt-4 text-[var(--color-ink-light)] leading-relaxed">
            If your salon is listed on findme.hair (and every active hair salon and barber in Australia is) — add this small badge to the footer of your website. It tells clients you&rsquo;re a verified salon, and it helps your site rank better in local search.
          </p>
          <p className="mt-3 text-[var(--color-ink-light)] leading-relaxed">
            Free, forever. No tracking pixel. No JavaScript. Just one line of HTML.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        {/* Light badge */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Light badge (works on white / light backgrounds)
          </h2>
          <div className="my-5 p-6 bg-[var(--color-white)] border border-[var(--color-border)] rounded-lg inline-block" dangerouslySetInnerHTML={{ __html: badgeHtmlLight }} />
          <p className="text-sm text-[var(--color-ink-light)] mb-3">Copy the HTML below and paste it into the footer of your website:</p>
          <pre className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4 overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: "ui-monospace,Menlo,Consolas,monospace" }}>{badgeHtmlLight}</pre>
        </section>

        {/* Dark badge */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Dark badge (works on black / dark backgrounds)
          </h2>
          <div className="my-5 p-6 bg-[var(--color-ink)] rounded-lg inline-block" dangerouslySetInnerHTML={{ __html: badgeHtmlDark }} />
          <pre className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4 overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: "ui-monospace,Menlo,Consolas,monospace" }}>{badgeHtmlDark}</pre>
        </section>

        {/* Text only */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Text-only link (smallest possible)
          </h2>
          <p className="text-sm text-[var(--color-ink-light)] mb-3">If you&rsquo;d rather just add a small text link inside an existing footer:</p>
          <pre className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4 overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: "ui-monospace,Menlo,Consolas,monospace" }}>{badgeHtmlInline}</pre>
        </section>

        {/* Why */}
        <section className="card p-8">
          <h2 className="text-xl text-[var(--color-ink)] mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Why bother?
          </h2>
          <ul className="text-sm text-[var(--color-ink-light)] list-disc pl-5 space-y-2 leading-relaxed">
            <li><strong>Client trust.</strong> findme.hair only lists genuine hair professionals — no booking platforms, no scammers, no fake salons. The badge tells visitors a third party has verified your business is real.</li>
            <li><strong>Search engine signal.</strong> A reciprocal link between your site and findme.hair adds a relevance signal to Google&rsquo;s local search algorithm. Small effect, but it compounds.</li>
            <li><strong>Network of peers.</strong> The badge is used by salons across all states. You&rsquo;re joining a network of independent hairdressers and barbers who chose not to pay a booking platform.</li>
            <li><strong>Zero load.</strong> The badge is inline HTML — no external scripts, no images loaded from our server, no tracking, no privacy concerns. It works offline. It works without JavaScript.</li>
          </ul>
        </section>

        {/* Claim CTA */}
        <section className="card p-8 bg-[var(--color-ink)] text-[var(--color-white)]">
          <h2 className="text-xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Not sure if your salon is already listed?
          </h2>
          <p className="text-sm leading-relaxed mb-4">
            Every active hair salon and barber in Australia is in our directory — 13,800+ businesses across all 8 states and territories. Search for your salon name and claim your listing for free. Claiming lets you update photos, hours, and your booking link.
          </p>
          <Link href="/claim" className="inline-block px-4 py-2 bg-[var(--color-gold)] text-[var(--color-ink)] font-medium rounded text-sm">Claim your listing →</Link>
        </section>
      </div>
    </main>
  );
}
