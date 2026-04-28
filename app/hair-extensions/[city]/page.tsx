import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPivotPage from "@/components/CityPivotPage";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "hair-extensions";
const TITLE_BASE = "Hair Extension Specialists";

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
  const title = `Hair Extension Specialists in ${config.name} ${new Date().getFullYear()} | findme.hair`;
  const description = `Find verified hair extension specialists in ${config.name}, ${stateName(config.state)}. Tape extensions, bonds, hand-tied wefts, micro-bead and Russian Remy human hair with real Google reviews.`;

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
    .contains("specialties", ["extensions"])
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
    .or("description.ilike.%hair extensions%,description.ilike.%tape extensions%,description.ilike.%hand tied weft%,description.ilike.%micro bead%,description.ilike.%russian remy%,name.ilike.%extensions%")
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
        metaDescribeShort: "Tape extensions, hand-tied wefts, bonds, micro-beads and Russian Remy human hair specialists",
        hero: "Hair extension specialists in {city} install tape extensions, hand-tied wefts, bonds and micro-beads using human-hair lengths matched to your colour and texture. Below are the verified extension stylists across {city} with the strongest Google reviews.",
        guideTitle: "How to choose a hair extension specialist in {city}",
        guideIntro: "The right method depends on your natural hair density and how much maintenance you can commit to. Tape extensions in {city} are the most popular choice — light, fast to install, and easy to remove. Hand-tied wefts last longer but cost more upfront. Bonds and micro-beads need an experienced installer because poor placement causes traction damage.",
        whatToLook: [
          "Method match (tape vs. weft vs. bond) discussed at the consultation, not chosen for you",
          "Russian Remy or European human hair grade",
          "Maintenance schedule clearly explained (tape: 6-8 weeks, weft: 8-10 weeks)",
          "After-care kit and aftercare conversation included",
          "Recent reviews mentioning blend, comfort and the 6-month grow-out experience",
        ],
        faq: [
          { q: "How much do hair extensions cost in {city}?", a: "Hair extensions in {city} typically run $700-$1500 for a full head of tape, $1500-$3000 for hand-tied wefts, and $1200-$2500 for keratin bonds. Pricing reflects the quality and quantity of human hair used. Always book a consultation first." },
          { q: "How long do tape extensions last in {city}?", a: "Tape extensions in {city} last 12-18 months with proper care, but the tape itself needs moving up every 6-8 weeks as your natural hair grows. Hand-tied wefts last 6-12 months and refit every 8-10 weeks." },
          { q: "Do extensions damage your natural hair?", a: "Properly fitted extensions in {city} should not damage your natural hair. Damage usually comes from extensions installed too tight, the wrong method for your hair type, or poor removal. Always work with an experienced installer and follow the aftercare." },
          { q: "Best extension suburbs in {city}?", a: "{city} extension specialists cluster around {suburbs5}. Use the listings above to book the highest-rated extension stylists, all verified with real Google reviews." },
        ],
        scissorPlug: {
          text: "Extension stylists in {city} use specialised scissors to blend tape and weft into the natural hair. ShearGenius supplies",
          linkText: "Japanese-steel scissors with Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
