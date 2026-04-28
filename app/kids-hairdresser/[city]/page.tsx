import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPivotPage from "@/components/CityPivotPage";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "kids-hairdresser";
const TITLE_BASE = "Kids Hairdressers";

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
  const title = `Kids Hairdressers in ${config.name} ${new Date().getFullYear()} | findme.hair`;
  const description = `Find verified kids hairdressers in ${config.name}, ${stateName(config.state)}. First-haircut salons, sensory-friendly cuts and family-friendly stylists with real Google reviews.`;

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
    .contains("specialties", ["kids"])
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
    .or("name.ilike.%kids%,name.ilike.%children%,name.ilike.%little%,name.ilike.%junior%,description.ilike.%kids cut%,description.ilike.%first haircut%,description.ilike.%family friendly%")
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
        metaDescribeShort: "Family-friendly hairdressers for first haircuts, kids cuts and sensory-friendly visits",
        hero: "Kids hairdressers in {city} are the salons that make first haircuts and the trickier toddler trims a smooth experience. Below are the verified family-friendly stylists across {city} with the strongest Google reviews.",
        guideTitle: "How to choose a kids hairdresser in {city}",
        guideIntro: "A great kids hairdresser in {city} is patient, fast, and good at distraction. Some run dedicated kids salons with car-shaped chairs and cartoons, others are mixed salons with one or two stylists who genuinely enjoy cutting children. Sensory-friendly options matter for kids who struggle with clippers, mirrors, or the smell of styling product.",
        whatToLook: [
          "First-haircut certificate or photo offering",
          "Sensory-friendly cuts (quieter clippers, no cape, parent on lap)",
          "Toy / iPad distraction set up at the chair",
          "Speed — kids cuts done well in 15-25 minutes",
          "Recent reviews from parents specifically",
        ],
        faq: [
          { q: "How much does a kids haircut cost in {city}?", a: "A kids cut in {city} typically runs $25-$45. Dedicated kids salons may charge a small premium for the experience (chair, distraction toys, certificate). Most salons charge a separate kids price up to age 11 or 12." },
          { q: "What is a sensory-friendly kids cut?", a: "Sensory-friendly cuts in {city} are designed for kids who find clippers, mirrors, or salon noise overwhelming. Stylists may use scissors only, work with the child on a parent's lap, skip the cape, and dim the lights. Book ahead and mention sensory needs." },
          { q: "Best kids hairdressers in {city} for first haircuts?", a: "{city} salons that specialise in first haircuts typically offer a certificate, take a photo, and save a curl. Many run them as a $35-$50 package. Use the listings above to find the highest-rated kids stylists, all verified with real Google reviews." },
          { q: "Where are the best kids salons in {city}?", a: "Family-friendly kids salons in {city} cluster around {suburbs5}. Use the listings above to book the highest-rated kids hairdressers, all verified with real Google reviews." },
        ],
        scissorPlug: {
          text: "Kids stylists in {city} need scissors that stay sharp through hundreds of fast, short cuts. ShearGenius supplies",
          linkText: "professional Japanese-steel kids and salon scissors with Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
