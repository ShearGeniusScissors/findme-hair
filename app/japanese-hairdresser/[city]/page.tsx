import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPivotPage from "@/components/CityPivotPage";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "japanese-hairdresser";
const TITLE_BASE = "Japanese Hairdressers";

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
  const title = `Japanese Hairdressers in ${config.name} ${new Date().getFullYear()} — Precision Japanese Cuts | findme.hair`;
  const description = `Find verified Japanese hair stylists in ${config.name}, ${stateName(config.state)}. Precision dry-cutting, slide-cut layering, digital perms and Japanese head-spa with real Google reviews.`;

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
    .contains("specialties", ["japanese"])
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
    .or("name.ilike.%japanese%,name.ilike.%tokyo%,name.ilike.%kyoto%,description.ilike.%japanese hair%,description.ilike.%digital perm%,description.ilike.%dry cut%")
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
        metaDescribeShort: "Japanese hair stylists specialising in dry-cutting, slide-cut layering and digital perms",
        hero: "Japanese hairdressers in {city} bring the precision dry-cut and slide-cut layering technique trained in Tokyo and Osaka. Below are the verified Japanese stylists across {city} with the strongest Google reviews.",
        guideTitle: "How to choose a Japanese hairdresser in {city}",
        guideIntro: "Japanese-trained stylists in {city} approach a haircut differently to Australian-trained scissors-over-comb hairdressers — most cut hair dry, slide-cut to remove weight without leaving blunt lines, and use Japanese-steel shears that hold a finer edge. Book a Japanese specialist when you want a precision cut that grows out cleanly, a digital perm, or an authentic Japanese head-spa.",
        whatToLook: [
          "Training in Japan or under a Japanese senior stylist",
          "Dry-cutting and slide-cut technique mentioned in their profile",
          "Digital perm capability if you want low-maintenance soft curls",
          "Japanese-steel scissor brand (Mizutani, Joewell, Kasho, Hikari)",
          "Recent reviews from clients with similar hair texture to yours",
        ],
        faq: [
          { q: "What is a Japanese dry cut and why is it different?", a: "A Japanese dry cut in {city} is performed on dry, styled hair so the stylist can see exactly how each section will fall. Hair shrinks differently when wet, so cutting wet hides flaws that only appear when dried. Japanese stylists charge more because the technique takes 60-90 minutes." },
          { q: "How much does a Japanese hairdresser cost in {city}?", a: "Japanese-trained stylists in {city} typically charge $90-$180 for a women's precision cut and $60-$100 for a men's cut. Digital perms run $250-$500. Pricing reflects the longer technique time and Japanese-grade scissors and product." },
          { q: "Do Japanese hairdressers in {city} do digital perms?", a: "Yes — most Japanese hair specialists in {city} offer digital perms, which create soft, lasting curls using heat plus chemical processing. Results last 4-6 months and look more natural than a traditional cold perm." },
          { q: "What suburbs have the most Japanese hair salons in {city}?", a: "Japanese hairdressers in {city} cluster around {suburbs5}. Use the listings above to book the highest-rated Japanese stylists, all verified with real Google reviews." },
        ],
        scissorPlug: {
          text: "Japanese precision cutting in {city} is built on the right tools. ShearGenius supplies",
          linkText: "Japanese Hitachi ATS-314 steel scissors with Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
