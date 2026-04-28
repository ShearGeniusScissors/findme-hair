import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPivotPage from "@/components/CityPivotPage";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "curly-hair-specialist";
const TITLE_BASE = "Curly Hair Specialists";

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
  const title = `Curly Hair Specialists in ${config.name} ${new Date().getFullYear()} | findme.hair`;
  const description = `Find verified curly hair specialists in ${config.name}, ${stateName(config.state)}. Curly cut, Rezo cut, DevaCut, dry cutting and curly colour work with real Google reviews.`;

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
    .contains("specialties", ["curly"])
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
    .or("description.ilike.%curly%,description.ilike.%devacut%,description.ilike.%rezo cut%,description.ilike.%dry cutting%,name.ilike.%curl%")
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
        metaDescribeShort: "Dedicated curly cutters, Rezo cut, DevaCut, dry cutting and curly colour specialists",
        hero: "Curly hair specialists in {city} cut hair dry, curl by curl, so what you see in the mirror is what you'll see at home. Below are the verified curly cutters across {city} with the strongest Google reviews.",
        guideTitle: "How to choose a curly hair specialist in {city}",
        guideIntro: "Most generalist hairdressers cut curls wet, which removes weight you need and creates a triangle shape when the hair dries. A trained curly specialist in {city} cuts dry, curl by curl, often using the Rezo or DevaCut method. They also understand low-poo washing, the curly girl method, and how to gloss curls without weighing them down.",
        whatToLook: [
          "Dry cutting technique — cut on dry, styled curls (not wet)",
          "Method match (Rezo, DevaCut, or Aussie freehand curly)",
          "Curl-typing knowledge (2A through 4C) — and the willingness to actually look at yours",
          "Curly-specific aftercare advice and product recommendation",
          "Recent reviews from curly clients (not the regular salon clients)",
        ],
        faq: [
          { q: "How much does a curly cut cost in {city}?", a: "A dedicated curly cut in {city} typically runs $120-$220, more than a standard cut because the technique takes 60-90 minutes. Many curly specialists include a tutorial on washing, plopping and product application." },
          { q: "What's the difference between a Rezo cut and a DevaCut?", a: "DevaCut in {city} cuts each curl individually with the hair styled and dry. Rezo cut focuses on volume and weight balance, often combining wet and dry techniques. Most curly specialists in {city} are trained in both and choose based on your curl pattern." },
          { q: "Can curly specialists in {city} also colour curly hair?", a: "Yes — curly colour specialists in {city} use balayage and gloss techniques designed for curls, applying colour to the curl pattern rather than mid-shaft saturation. Always discuss colour history because curls are more porous than straight hair." },
          { q: "Best curly hair suburbs in {city}?", a: "{city} curly specialists cluster around {suburbs5}. Use the listings above to book the highest-rated curly cutters, all verified with real Google reviews." },
        ],
        scissorPlug: {
          text: "Curly cutters in {city} need scissors that hold a fine edge for chip and slide cutting on dry hair. ShearGenius supplies",
          linkText: "Japanese Hitachi ATS-314 scissors with Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
