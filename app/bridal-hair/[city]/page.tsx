import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPivotPage from "@/components/CityPivotPage";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "bridal-hair";
const TITLE_BASE = "Bridal Hair Stylists";

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
  const title = `Bridal Hair Stylists in ${config.name} ${new Date().getFullYear()} — Wedding Hair Specialists | findme.hair`;
  const description = `Find verified bridal hair stylists in ${config.name}, ${stateName(config.state)}. Wedding-day hair, on-location styling, bridal trials and bridesmaid packages with real Google reviews.`;

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
    .contains("specialties", ["bridal"])
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
    .or("name.ilike.%bridal%,name.ilike.%wedding%,description.ilike.%bridal hair%,description.ilike.%wedding hair%,description.ilike.%on location%")
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
        metaDescribeShort: "Wedding-day hair stylists, on-location styling, bridal trials and bridesmaid packages",
        hero: "Bridal hair stylists in {city} build the wedding-morning timeline as carefully as they build the actual hair — the right one is calm, fast, and has done the look you want a hundred times. Below are the verified bridal specialists across {city} with the strongest Google reviews.",
        guideTitle: "How to choose a bridal hair stylist in {city}",
        guideIntro: "Wedding hair is one of the highest-stakes bookings a stylist takes — it has to last 14 hours, photograph well in soft and harsh light, and survive a first dance. The strongest bridal hair stylists in {city} run mandatory trials, time-block the morning, and bring backup product on the day. Book at least 6-9 months out for peak wedding season (October to April).",
        whatToLook: [
          "On-location capability if your venue is regional",
          "Bridal trial included or offered (don't skip the trial)",
          "Bridesmaid and mother-of-the-bride package pricing",
          "Veil and hair-piece placement experience",
          "Recent reviews from brides specifically (not just regular salon clients)",
        ],
        faq: [
          { q: "How much does a bridal hair stylist cost in {city}?", a: "Bridal hair in {city} typically runs $200-$450 for the bride, plus $90-$180 per bridesmaid and $90-$160 for the mother of the bride. On-location travel adds $100-$300. Most stylists also charge a non-refundable deposit to lock the date." },
          { q: "How far in advance should I book bridal hair in {city}?", a: "For Saturday weddings between October and April, the most in-demand bridal stylists in {city} book out 6-12 months ahead. Off-season weddings (May-September) often have 3-4 month availability. Book the trial 2-3 months before the wedding day." },
          { q: "Do bridal stylists in {city} travel to the venue?", a: "Yes — most bridal hair specialists in {city} offer on-location services for hotels, accommodations and regional venues. Travel fees vary by distance and the size of the bridal party. Always confirm parking and a power point at the venue." },
          { q: "Best bridal hair suburbs in {city}?", a: "{city} bridal stylists cluster around {suburbs5}, but most travel city-wide and to regional venues. Use the listings above to book the highest-rated bridal specialists, all verified with real Google reviews." },
        ],
        scissorPlug: {
          text: "Bridal stylists in {city} use precision scissors for veil cutting, fringe trims and morning-of clean-ups. ShearGenius supplies",
          linkText: "Japanese-steel scissors and Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
