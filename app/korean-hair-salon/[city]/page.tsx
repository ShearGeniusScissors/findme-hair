import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPivotPage from "@/components/CityPivotPage";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "korean-hair-salon";
const TITLE_BASE = "Korean Hair Salons";

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
  const title = `Korean Hair Salons in ${config.name} ${new Date().getFullYear()} | findme.hair`;
  const description = `Find verified Korean hair salons in ${config.name}, ${stateName(config.state)}. Magic straightening, straight perm, layered Korean cuts and root touch-ups with real Google reviews.`;

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
    .contains("specialties", ["korean"])
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
    .or("name.ilike.%korean%,name.ilike.%seoul%,description.ilike.%korean salon%,description.ilike.%magic straight%")
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
        metaDescribeShort: "Korean hair salons specialising in straight perm, magic straightening and layered Korean cuts",
        hero: "Korean hair salons in {city} are known for magic straightening, straight perm, root touch-ups and the soft, layered cuts popularised by K-drama and K-pop. Below are the verified Korean stylists across {city} with the strongest Google reviews.",
        guideTitle: "How to choose a Korean hair salon in {city}",
        guideIntro: "Korean hair specialists in {city} typically use Japanese or Korean ionic clamps, lower-pH straightening systems, and a layered cutting approach that frames the face. Booking a Korean stylist is the right call when you want magic straight, healthy straight perm, root retouch, or a Korean-style layered cut that local Anglo-trained stylists rarely specialise in.",
        whatToLook: [
          "Magic straightening or straight perm experience — ask how many they do per week",
          "Brand of straightener used (lower-pH systems are kinder to fine hair)",
          "Korean-language service if you prefer it",
          "Recent reviews mentioning straightening or Korean perm specifically",
          "Photos of layered Korean cuts in their portfolio",
        ],
        faq: [
          { q: "How much does Korean magic straightening cost in {city}?", a: "Magic straightening in {city} typically runs $200-$450 depending on hair length and condition. Korean salons often quote a base price plus an extra fee for very long or thick hair. Always confirm pricing with a strand test before committing." },
          { q: "How long does Korean straight perm last?", a: "A well-applied Korean magic straightening or straight perm in {city} lasts 4-6 months on the treated hair. Roots will need a touch-up every 4-5 months, but the previously straightened lengths stay smooth." },
          { q: "Do Korean salons in {city} also do colour?", a: "Yes — most Korean hair salons in {city} offer balayage, ash tones, and the soft brown shades popular in K-beauty. Discuss colour history and any past straightening when you book, since chemically treated hair needs gentler colour." },
          { q: "Where are the best Korean hair salons in {city}?", a: "The strongest Korean salons in {city} cluster around {suburbs5} and surrounding suburbs. Use the listings above to book the highest-rated stylists, all verified with real Google reviews." },
        ],
        scissorPlug: {
          text: "Korean hair specialists in {city} rely on precision Japanese-steel scissors for soft layering and chip-cutting. ShearGenius supplies",
          linkText: "Hitachi ATS-314 Japanese steel scissors and Australia-wide sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
