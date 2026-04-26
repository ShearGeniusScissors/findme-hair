import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPivotPage from "@/components/CityPivotPage";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "mens-haircut";
const TITLE_BASE = "Men's Haircuts";

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
  const title = `Men's Haircuts in ${config.name} ${new Date().getFullYear()} — Best Barbers & Stylists | findme.hair`;
  const description = `Find the best men's haircuts in ${config.name}, ${stateName(config.state)}. Skin fades, scissor cuts, beard trims and gentleman's grooming with real Google reviews.`;

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

  const { data: barbers } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .in("business_type", ["barber", "unisex"])
    .or(suburbFilters)
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  if (barbers && barbers.length >= 6) return barbers as Business[];

  const { data: mensSpecialty } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .or("description.ilike.%mens cut%,description.ilike.%men's cut%,description.ilike.%men's haircut%,description.ilike.%mens haircut%,description.ilike.%gentleman%")
    .or(suburbFilters)
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  const combined: Business[] = [];
  const seen = new Set<string>();
  for (const list of [barbers ?? [], mensSpecialty ?? []]) {
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
        metaDescribeShort: "Men's haircut, skin fade, scissor cut, beard trim and gentleman's grooming specialists",
        hero: "Men's haircuts in {city} cover everything from a sharp skin fade to a classic scissor cut, plus beard work, hot-towel shaves and gentleman's grooming. Below are the verified barbers and male grooming specialists across {city} with the strongest Google reviews.",
        guideTitle: "How to find the best men's haircut in {city}",
        guideIntro: "Choosing a barber in {city} comes down to the type of cut you want. For modern fades, taper work and skin fades, look for a dedicated barber shop with strong recent fade work on Instagram. For longer scissor cuts, mod cuts and side parts, a salon barber or a unisex stylist will often deliver a sharper result. Read recent reviews — fade quality changes quickly when senior staff move shops.",
        whatToLook: [
          "Style match — fade specialists for short cuts, scissor specialists for longer styles",
          "Recent Instagram fade or scissor work in your style",
          "Hot-towel shave and beard work if you want it",
          "Walk-in availability vs. booked appointments",
          "Reviews from clients with similar hair texture (fine, thick, curly)",
        ],
        faq: [
          { q: "How much is a men's haircut in {city}?", a: "A standard men's cut in {city} typically runs $30-$55, a skin fade or detail fade $45-$70, and a hot-towel shave $40-$60. Senior barbers and gentleman's grooming shops charge $65-$90. Tipping is optional but appreciated for great work." },
          { q: "What's the difference between a barber and a men's stylist in {city}?", a: "Barbers in {city} specialise in clipper-driven cuts — fades, tapers, beard trims and shaves. Men's stylists in unisex salons are more focused on longer scissor cuts, colour, and styling. Pick based on the cut you want, not the venue type." },
          { q: "How often should men book a haircut in {city}?", a: "A skin fade in {city} needs a refresh every 2-3 weeks to keep the line tight. Standard scissor cuts hold their shape for 4-6 weeks. Beard trims usually pair with a haircut every visit." },
          { q: "Best suburbs for men's haircuts in {city}?", a: "{city} barbers and men's stylists cluster around {suburbs5}. Use the listings above to book the highest-rated barbers, all verified with real Google reviews." },
        ],
        scissorPlug: {
          text: "Top barbers and men's stylists in {city} put their scissors through 30+ cuts a week. ShearGenius supplies",
          linkText: "professional Japanese-steel barber scissors and lifetime sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/barber-scissors",
        },
      }}
    />
  );
}
