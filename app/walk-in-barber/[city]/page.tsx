import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPivotPage from "@/components/CityPivotPage";
import { PIVOT_CITIES } from "@/lib/cityPivotConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { AuState, Business } from "@/types/database";

export const revalidate = 3600;
export const dynamicParams = false;

const ROUTE = "walk-in-barber";
const TITLE_BASE = "Walk-In Barbers";

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
  const title = `Walk-In Barbers in ${config.name} ${new Date().getFullYear()} | findme.hair`;
  const description = `Find verified walk-in barbers in ${config.name}, ${stateName(config.state)}. No-appointment cuts, fades, hot-towel shaves and beard trims with real Google reviews.`;

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

  const { data: byFlag } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .in("business_type", ["barber", "unisex"])
    .eq("walk_ins_welcome", true)
    .or(suburbFilters)
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  if (byFlag && byFlag.length >= 6) return byFlag as Business[];

  const { data: bySpecialty } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .in("business_type", ["barber", "unisex"])
    .or("description.ilike.%walk in%,description.ilike.%walk-in%,description.ilike.%no appointment%")
    .or(suburbFilters)
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  const combined: Business[] = [];
  const seen = new Set<string>();
  for (const list of [byFlag ?? [], bySpecialty ?? []]) {
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
        metaDescribeShort: "Walk-in barbers — no appointment needed for cuts, fades and hot-towel shaves",
        hero: "Walk-in barbers in {city} take customers without an appointment — handy when you need a fade before an interview or a quick clean-up before a wedding. Below are the verified walk-in barbers across {city} with the strongest Google reviews.",
        guideTitle: "How to find a good walk-in barber in {city}",
        guideIntro: "Walk-in barbers in {city} trade off the certainty of a booked time for the freedom to drop in. The best walk-in shops are honest about wait times, post live queue updates on Google or socials, and keep their chair turnover steady — usually 25-40 minutes per client. Avoid shops where the queue is long but the work looks rushed.",
        whatToLook: [
          "Live wait-time signal (Google posts, Instagram story queue, or app booking with walk-in slots)",
          "Recent reviews mentioning fade quality, not just speed",
          "Hot-towel shave and beard work if that matters to you",
          "Late opening hours for after-work cuts",
          "Visible hygiene — clean clippers, fresh towels, sanitised guards",
        ],
        faq: [
          { q: "How long is the wait at walk-in barbers in {city}?", a: "Walk-in barbers in {city} typically run 15-45 minute waits depending on the day. Friday afternoon and Saturday morning are the busiest, while weekday mornings and early afternoons are quietest. Many shops post live queue updates on Google or Instagram." },
          { q: "How much do walk-in barbers in {city} charge?", a: "A walk-in cut in {city} typically runs $30-$55 for a standard cut, $45-$70 for a fade, and $25-$40 for a beard trim. Hot-towel shaves usually run $40-$60. Most walk-in shops are cash-friendly but accept card." },
          { q: "Do walk-in barbers in {city} do fades?", a: "Yes — most {city} walk-in barbers offer skin fades, taper fades and drop fades. Quality varies, so read recent reviews before committing for a high-stakes cut. Established walk-in shops post fade work on Instagram so you can check before you go." },
          { q: "Best walk-in barber suburbs in {city}?", a: "{city} walk-in barbers cluster around {suburbs5}. Use the listings above to find the highest-rated walk-in shops, all verified with real Google reviews." },
        ],
        scissorPlug: {
          text: "Busy walk-in barbers in {city} put their scissors through more cuts than appointment-only shops. ShearGenius supplies",
          linkText: "professional Japanese-steel scissors and Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/barber-scissors",
        },
      }}
    />
  );
}
