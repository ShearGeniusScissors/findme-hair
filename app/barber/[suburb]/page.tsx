import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SuburbPivotPage from "@/components/SuburbPivotPage";
import { TOP_SUBURBS } from "@/lib/suburbConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "barber";
const TITLE_BASE = "Barbers";

export function generateStaticParams() {
  return TOP_SUBURBS.map((s) => ({ suburb: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ suburb: string }>;
}): Promise<Metadata> {
  const { suburb } = await params;
  const config = TOP_SUBURBS.find((s) => s.slug === suburb);
  if (!config) return {};

  const path = `https://www.findme.hair/${ROUTE}/${config.slug}`;
  const title = `Barbers in ${config.name} ${new Date().getFullYear()} | findme.hair`;
  const description = `Find the best barbers in ${config.name}, ${stateName(config.state)}. Skin fades, scissor cuts, hot-towel shaves and beard trims with real Google reviews.`;

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

async function getBusinesses(suburbName: string, state: string): Promise<Business[]> {
  const supabase = supabaseServerAnon();
  const { data: barbers } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .ilike("suburb", suburbName)
    .in("business_type", ["barber", "unisex"])
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  if (barbers && barbers.length >= 6) return barbers as Business[];

  // Fallback to specialty / description match
  const { data: bySpecialty } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .ilike("suburb", suburbName)
    .or("description.ilike.%barber%,description.ilike.%fade%,description.ilike.%men's cut%,description.ilike.%mens cut%")
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  const combined: Business[] = [];
  const seen = new Set<string>();
  for (const list of [barbers ?? [], bySpecialty ?? []]) {
    for (const b of list as Business[]) {
      if (!seen.has(b.id)) {
        combined.push(b);
        seen.add(b.id);
      }
    }
  }
  return combined.slice(0, 20);
}

export default async function Page({ params }: { params: Promise<{ suburb: string }> }) {
  const { suburb } = await params;
  const config = TOP_SUBURBS.find((s) => s.slug === suburb);
  if (!config) notFound();

  const businesses = await getBusinesses(config.name, config.state);
  const siblingSuburbs = TOP_SUBURBS.filter((s) => s.regionSlug === config.regionSlug && s.slug !== config.slug).slice(0, 12);

  return (
    <SuburbPivotPage
      suburb={config}
      businesses={businesses}
      siblingSuburbs={siblingSuburbs}
      allSuburbs={TOP_SUBURBS}
      content={{
        h1Prefix: TITLE_BASE,
        routePrefix: ROUTE,
        metaDescribeShort: "Barber shops for fades, scissor cuts, hot-towel shaves and beard work",
        hero: "Barbers in {suburb} cover skin fades, taper fades, scissor cuts, hot-towel shaves and beard trims. Below are the verified barber shops in {suburb} with the strongest Google reviews.",
        guideTitle: "How to find a great barber in {suburb}",
        guideIntro: "The fastest way to pick a barber in {suburb} is to scan recent Instagram fade work and the latest 30 Google reviews. Lifetime ratings hide stylist turnover — when senior staff move shops, the work changes fast. The shortlist below is filtered by Google rating and review count, so you start with the barbers locals actually rate.",
        whatToLook: [
          "Recent Instagram fade or scissor work in your style",
          "Walk-in availability vs. booked appointments",
          "Hot-towel shave and beard work if you want it",
          "Visible hygiene — clean clippers, fresh towels, sanitised guards",
          "Reviews from clients with similar hair texture (fine, thick, curly)",
        ],
        faq: [
          { q: "How much does a barber cost in {suburb}?", a: "A standard men's cut in {suburb} typically runs $30-$55, a skin or detail fade $45-$70, and a hot-towel shave $40-$60. Senior barbers and gentleman's grooming shops charge $65-$90." },
          { q: "Best barbers in {suburb} for fades?", a: "{suburb} fade specialists are listed above, ranked by Google rating and recent reviews. Always check Instagram for fresh fade work in your style before committing for a high-stakes cut." },
          { q: "Do barbers in {suburb} take walk-ins?", a: "Many {suburb} barbers take walk-ins, especially for standard cuts. Friday afternoon and Saturday morning are the busiest. Most shops post live queue updates on Google or Instagram." },
          { q: "How often should I get a haircut at a barber in {suburb}?", a: "A skin fade in {suburb} needs a refresh every 2-3 weeks to keep the line tight. Standard scissor cuts hold their shape for 4-6 weeks. Beard trims usually pair with a haircut every visit." },
        ],
        scissorPlug: {
          text: "Top barbers in {suburb} put their scissors through 30+ cuts a week. ShearGenius supplies",
          linkText: "professional Japanese-steel barber scissors and Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/barber-scissors",
        },
      }}
    />
  );
}
