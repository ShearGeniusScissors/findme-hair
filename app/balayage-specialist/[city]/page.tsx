import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPivotPage from "@/components/CityPivotPage";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;
export const dynamicParams = false;

const ROUTE = "balayage-specialist";
const TITLE_BASE = "Balayage Specialists";

export function generateStaticParams() {
  return PIVOT_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const config = PIVOT_CITIES.find((c) => c.slug === city);
  if (!config) return {};

  const path = `https://www.findme.hair/${ROUTE}/${config.slug}`;
  const title = `Balayage Specialists in ${config.name} ${new Date().getFullYear()} | findme.hair`;
  const description = `Find verified balayage specialists in ${config.name}, ${stateName(config.state)}. Hand-painted highlights, lived-in colour, foilage and money-piece work with real Google reviews.`;

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
      type: "article",
      images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
    },
  };
}

async function getBusinesses(state: AuState, suburbs: string[]): Promise<Business[]> {
  const supabase = supabaseServerAnon();
  const suburbFilters = suburbs.map((s) => `suburb.ilike.${s}`).join(",");

  const { data: bySpecialty } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .contains("specialties", ["balayage"])
    .or(suburbFilters)
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  if (bySpecialty && bySpecialty.length >= 6) return bySpecialty as Business[];

  const { data: byName } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .or("description.ilike.%balayage%,description.ilike.%lived in%,description.ilike.%foilage%,description.ilike.%hand paint%,description.ilike.%money piece%")
    .or(suburbFilters)
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  const combined: Business[] = [];
  const seen = new Set<string>();
  for (const list of [bySpecialty ?? [], byName ?? []]) {
    for (const b of list as Business[]) {
      if (!seen.has(b.id)) {
        combined.push(b);
        seen.add(b.id);
      }
    }
  }
  return combined.slice(0, 20);
}

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const config = PIVOT_CITIES.find((c) => c.slug === city);
  if (!config) notFound();

  const businesses = await getBusinesses(config.state, config.suburbs);

  return (
    <CityPivotPage
      city={config}
      businesses={businesses}
      allCities={PIVOT_CITIES}
      content={{
        h1Prefix: TITLE_BASE,
        routePrefix: ROUTE,
        metaDescribeShort: "Hand-painted balayage, lived-in colour, foilage and money-piece specialists",
        hero: "Balayage specialists in {city} hand-paint colour into the hair instead of the saturated, all-over foil approach — the result is a softer, sun-kissed grow-out and far less salon time over the year. Below are the verified balayage colourists across {city} with the strongest Google reviews.",
        guideTitle: "How to choose a balayage specialist in {city}",
        guideIntro: "Balayage is a hand-painting technique, not a colour formula — the difference between a great balayage and an average one comes down to the colourist's eye, hand placement, and how they manage tone after lifting. The best balayage specialists in {city} have a consistent Instagram portfolio, charge by hours of work rather than a flat colour fee, and book strand tests for clients with previously coloured hair.",
        whatToLook: [
          "Instagram portfolio with consistent before/after balayage shots",
          "Pricing structured by hours or by length, not a single flat colour fee",
          "Olaplex / bond-building included as standard",
          "Toner approach (clear gloss vs. ash vs. warm)",
          "Recent reviews mentioning grow-out (the real test of balayage placement)",
        ],
        faq: [
          { q: "How much does balayage cost in {city}?", a: "Balayage in {city} typically runs $250-$650 depending on hair length and how much lift you need. Premium colourists charge $400+ and include a bond-builder treatment, gloss and blow-dry. Always book a consultation first if you have previously coloured hair." },
          { q: "How long does balayage last in {city}?", a: "Because balayage grows out softly, most clients in {city} return for a refresh every 4-6 months — far less often than the 6-8 week cycle full foils need. A toning gloss between sessions extends the result." },
          { q: "What is foilayage and how is it different to balayage?", a: "Foilayage in {city} salons combines hand-painted balayage with foil to drive more lift. It works well on darker or coarser hair where freehand balayage struggles to lift cleanly. Most balayage specialists offer both and pick based on your hair." },
          { q: "Best balayage suburbs in {city}?", a: "Top balayage colourists in {city} cluster around {suburbs5}. Use the listings above to book the highest-rated balayage specialists, all verified with real Google reviews." },
        ],
        scissorPlug: {
          text: "Balayage specialists in {city} use weight-removal and chip-cutting scissors to expose the painted lengths. ShearGenius supplies",
          linkText: "Japanese-steel scissors and thinners with Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
