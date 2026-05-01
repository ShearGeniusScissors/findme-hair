import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";

export const revalidate = 86400;
export const dynamicParams = true;

const PAGE_SIZE = 100;

interface SalonRow {
  id: string;
  slug: string;
  name: string;
  suburb: string;
  state: string;
}

async function getTotalCount(): Promise<number> {
  const supabase = supabaseServerAnon();
  const { count } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  return count ?? 0;
}

async function getSalonPage(pageNum: number): Promise<SalonRow[]> {
  const supabase = supabaseServerAnon();
  const offset = (pageNum - 1) * PAGE_SIZE;
  const { data } = await supabase
    .from("businesses")
    .select("id, slug, name, suburb, state")
    .eq("status", "active")
    .order("state", { ascending: true })
    .order("suburb", { ascending: true })
    .order("name", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);
  return (data ?? []) as SalonRow[];
}

export async function generateStaticParams() {
  // Pre-render the first 5 pages; the rest are ISR.
  return [{ page: "1" }, { page: "2" }, { page: "3" }, { page: "4" }, { page: "5" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  const pageNum = Number.parseInt(page, 10);
  if (!Number.isFinite(pageNum) || pageNum < 1) return {};
  const path = `https://www.findme.hair/directory/salons/${pageNum}`;
  const title =
    pageNum === 1
      ? `Every Hair Salon & Barber on findme.hair | Australia Directory`
      : `findme.hair Salon Directory — Page ${pageNum} | Australia`;
  const description =
    pageNum === 1
      ? "Complete A-Z directory of every verified hair salon and barber on findme.hair. 13,000+ listings across Australia, paginated by 100. Browse all and click through to full profiles."
      : `Hair salon and barber directory page ${pageNum} of findme.hair — verified Australian listings, sorted by state and suburb.`;
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { "en-AU": path, "x-default": path },
    },
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
}

export default async function SalonDirectoryPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNum = Number.parseInt(page, 10);
  if (!Number.isFinite(pageNum) || pageNum < 1) notFound();

  const [total, salons] = await Promise.all([
    getTotalCount(),
    getSalonPage(pageNum),
  ]);

  if (salons.length === 0) notFound();

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const path = `https://www.findme.hair/directory/salons/${pageNum}`;

  // Group salons by state for readability.
  const byState = new Map<string, SalonRow[]>();
  for (const s of salons) {
    const arr = byState.get(s.state) ?? [];
    arr.push(s);
    byState.set(s.state, arr);
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Salon directory page ${pageNum}`,
          url: path,
          isPartOf: { "@id": "https://www.findme.hair/#website" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.findme.hair/" },
            { "@type": "ListItem", position: 2, name: "Directory", item: "https://www.findme.hair/directory" },
            { "@type": "ListItem", position: 3, name: `Salons page ${pageNum}` },
          ],
        }}
      />

      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <span>›</span>
            <Link href="/directory" className="hover:text-[var(--color-gold-dark)]">Directory</Link>
            <span>›</span>
            <span className="text-[var(--color-ink)] font-medium">Salons page {pageNum}</span>
          </nav>
        </div>
      </div>

      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-editorial-overline">Directory · {total.toLocaleString()} listings</p>
          <h1 className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>
            findme.hair Salon Directory — Page {pageNum} of {totalPages}
          </h1>
          <p className="mt-3 text-[var(--color-ink-light)]">
            Every hair salon and barber on findme.hair, verified and paginated. Sorted by state, then suburb, then name.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {[...byState.entries()].map(([stateCode, list]) => (
          <section key={stateCode} className="card p-6">
            <h2 className="text-lg text-[var(--color-ink)] mb-3" style={{ fontFamily: "var(--font-serif)" }}>
              {stateName(stateCode as never)} — {list.length} listings
            </h2>
            <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              {list.map((s) => (
                <li key={s.id} className="truncate">
                  <Link
                    href={`/salon/${s.slug}`}
                    className="text-[var(--color-ink)] hover:text-[var(--color-gold-dark)]"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-[var(--color-ink-muted)]"> — {s.suburb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Pagination */}
        <nav className="card p-6 flex flex-wrap items-center gap-2 text-sm">
          {pageNum > 1 && (
            <Link
              href={`/directory/salons/${pageNum - 1}`}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)]"
            >
              ← Previous
            </Link>
          )}
          <span className="text-[var(--color-ink-muted)] mx-2">
            Page {pageNum} of {totalPages}
          </span>
          {pageNum < totalPages && (
            <Link
              href={`/directory/salons/${pageNum + 1}`}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)]"
            >
              Next →
            </Link>
          )}
          <div className="ml-auto flex flex-wrap gap-1">
            {Array.from({ length: Math.min(15, totalPages) }, (_, i) => {
              const target = pageNum <= 8 ? i + 1 : Math.max(1, pageNum - 7) + i;
              if (target > totalPages) return null;
              return (
                <Link
                  key={target}
                  href={`/directory/salons/${target}`}
                  className={`rounded-md px-2 py-1 text-xs ${
                    target === pageNum
                      ? "bg-[var(--color-gold)] text-white"
                      : "border border-[var(--color-border)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)]"
                  }`}
                >
                  {target}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}
