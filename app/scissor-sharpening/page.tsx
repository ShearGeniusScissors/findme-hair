import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;

const path = "https://www.findme.hair/scissor-sharpening";
const title = `Scissor Sharpening for Hairdressers Australia ${new Date().getFullYear()} — Editorial Guide | findme.hair`;
const description = "How Australian hairdressers and barbers should approach scissor sharpening — frequency, cost, mail-in vs mobile, what to look for in a sharpening service. Editorial guide.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: {
    title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "article",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function ScissorSharpeningPage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        datePublished: `${year}-04-26`,
        dateModified: `${year}-04-26`,
        author: { '@id': 'https://www.findme.hair/#organization' },
        publisher: { '@id': 'https://www.findme.hair/#organization' },
        mainEntityOfPage: path,
        inLanguage: 'en-AU',
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Scissor Sharpening', item: path },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How often should hairdressing scissors be sharpened?', acceptedAnswer: { '@type': 'Answer', text: 'For a working hairdresser cutting 20+ heads of hair a week, every 6-9 months. For a busy barber doing 40+ cuts, every 4-6 months. For occasional home use, every 2-3 years. Sharpening a Japanese-steel scissor restores it to factory edge.' } },
          { '@type': 'Question', name: 'How much does scissor sharpening cost in Australia?', acceptedAnswer: { '@type': 'Answer', text: 'Quality scissor sharpening in Australia runs $30-$60 per pair for hairdressing scissors and $40-$80 for thinning scissors (more complex). Prices include return shipping for mail-in services. Cheaper services often skip the convex edge step which is what professional scissors need.' } },
          { '@type': 'Question', name: 'What is the difference between sharpening and re-edging?', acceptedAnswer: { '@type': 'Answer', text: 'Sharpening restores an existing edge that has dulled. Re-edging creates a new edge, often after the previous one has rolled or chipped beyond simple sharpening. Re-edging takes longer and costs more, but extends the scissor lifespan.' } },
          { '@type': 'Question', name: 'Mail-in vs mobile scissor sharpening — which is better?', acceptedAnswer: { '@type': 'Answer', text: 'Mobile sharpening is faster (no shipping time) and lets you ask the sharpener questions in person, but is only available in specific service areas. Mail-in lets any Australian hairdresser access the same Scissorsmith — quality is identical, turnaround is 5-10 days including post.' } },
          { '@type': 'Question', name: 'Can I sharpen my own scissors?', acceptedAnswer: { '@type': 'Answer', text: 'For everyday stainless household scissors, yes. For professional Japanese-steel hairdressing scissors with a convex edge, no. The angle and finish on a convex edge requires a specialised stone setup and significant practice. A poorly self-sharpened pair often costs more to recover than to send out.' } },
        ],
      }} />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Scissor Sharpening</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-editorial-overline">Editorial guide · {year}</p>
          <h1 className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Scissor Sharpening for Australian Hairdressers
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            How working hairdressers and barbers should think about scissor sharpening — when, where, how much, and what to look for. From a directory that lists thousands of working stylists across Australia.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">

        <section className="card p-8 text-sm text-[var(--color-ink-light)] leading-relaxed">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Why scissor sharpening matters</h2>
          <p>A dull scissor doesn&rsquo;t just cut slower. It pushes hair instead of slicing it, which leaves split ends, ragged tips, and subtle damage that shows up in the next 4-6 weeks of grow-out. It also triggers wrist strain because the hand compensates for the resistance — a working hairdresser who skips sharpening for too long usually feels it in the carpal tunnel before the clients see it in their hair.</p>
          <p className="mt-3">A well-sharpened scissor cuts hair like the cuticle isn&rsquo;t there. The edge slides through, the ends seal, the result is what the salon photographs.</p>
        </section>

        <section className="card p-8 text-sm text-[var(--color-ink-light)] leading-relaxed">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>How often to sharpen</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Working hairdresser, 20+ heads a week</strong> — every 6-9 months. Senior stylists with high client volume push closer to 6 months.</li>
            <li><strong>Busy barber, 40+ cuts a week</strong> — every 4-6 months. Clipper-blending creates more friction on the scissor edge than salon work.</li>
            <li><strong>Mobile or part-time stylist</strong> — every 9-12 months.</li>
            <li><strong>Apprentice or quiet salon</strong> — yearly, or sooner if the scissor feels different in the hand.</li>
            <li><strong>Home / occasional use</strong> — every 2-3 years.</li>
          </ul>
          <p className="mt-3">If you can feel the scissor pushing rather than slicing, it&rsquo;s overdue. If the ends are splitting on cut, it&rsquo;s overdue. Don&rsquo;t wait for a visible problem.</p>
        </section>

        <section className="card p-8 text-sm text-[var(--color-ink-light)] leading-relaxed">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>What to look for in a sharpening service</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Convex edge capability.</strong> Professional Japanese-steel scissors have a convex edge, not a bevelled one. Many cheap sharpening services run a generic V-edge that ruins a convex finish. Confirm convex before sending.</li>
            <li><strong>By-hand finishing.</strong> Machine-finished edges look right under inspection but feel different under hair. The best sharpeners hand-finish the final edge.</li>
            <li><strong>Tension adjustment.</strong> Sharpening a scissor without re-tensioning the pivot screw is half a job. The screw should be checked, cleaned, and adjusted to your hand.</li>
            <li><strong>Pre and post inspection.</strong> A photo of the blade on receipt and a written note about edge condition is normal practice for a real Scissorsmith.</li>
            <li><strong>Australian-based service.</strong> Sending scissors overseas adds 4-6 weeks of postage and customs risk. Stick with Australian-based sharpeners.</li>
          </ul>
        </section>

        <section className="card p-8 text-sm text-[var(--color-ink-light)] leading-relaxed">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Mail-in vs mobile</h2>
          <p>Both work. Mobile gets your scissors back same-day; mail-in adds 5-10 days for postage but is the only option for stylists outside the major mobile-service areas.</p>
          <p className="mt-3">If you&rsquo;re in <strong>Victoria, Tasmania or South Australia</strong>, you have both options. The mobile service typically visits salons on a fixed schedule. <strong>NSW, QLD, WA, NT, ACT</strong> stylists usually rely on mail-in — turnaround is reliable.</p>
        </section>

        <section className="card p-8 text-sm text-[var(--color-ink-light)] leading-relaxed">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Where Australian hairdressers send their scissors</h2>
          <p>findme.hair&rsquo;s sister brand, <a href="https://www.sheargenius.com.au" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">ShearGenius</a>, runs an Australia-wide mail-in sharpening service plus a mobile run across VIC/TAS/SA. Founded in 2007 by Scissorsmith Matt Grumley, it&rsquo;s sharpened over 100,000 scissors across the country.</p>
          <p className="mt-3"><strong>City-specific guides:</strong></p>
          <ul className="grid gap-1 mt-2 sm:grid-cols-2">
            <li>· <a href="https://www.sheargenius.com.au/pages/scissor-sharpening-sydney" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Scissor sharpening Sydney</a></li>
            <li>· <a href="https://www.sheargenius.com.au/pages/scissor-sharpening-melbourne" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Scissor sharpening Melbourne</a></li>
            <li>· <a href="https://www.sheargenius.com.au/pages/scissor-sharpening-adelaide" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Scissor sharpening Adelaide</a></li>
            <li>· <a href="https://www.sheargenius.com.au/pages/scissor-sharpening-hobart" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Scissor sharpening Hobart</a></li>
            <li>· <a href="https://www.sheargenius.com.au/pages/scissor-sharpening-ballarat" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Scissor sharpening Ballarat</a></li>
            <li>· <a href="https://www.sheargenius.com.au/pages/scissor-sharpening-bendigo" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Scissor sharpening Bendigo</a></li>
            <li>· <a href="https://www.sheargenius.com.au/pages/scissor-sharpening-geelong" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Scissor sharpening Geelong</a></li>
            <li>· <a href="https://www.sheargenius.com.au/pages/hairdressing-scissor-sharpening-service" target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">Australia-wide mail-in service</a></li>
          </ul>
        </section>

        <section className="card p-8 text-sm text-[var(--color-ink-light)] leading-relaxed">
          <h2 className="text-xl text-[var(--color-ink)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Salons we list</h2>
          <p>findme.hair lists 13,000+ verified hair salons and barber shops across Australia. If you&rsquo;re a stylist running a salon, claim your listing free at <Link href="/claim" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">findme.hair/claim</Link>. If you&rsquo;re a customer looking for a salon, browse the <Link href="/directory" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">full directory</Link> or jump straight to <Link href="/hairdresser-near-me" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] font-medium">hairdresser near me</Link>.</p>
        </section>

      </div>
    </main>
  );
}
