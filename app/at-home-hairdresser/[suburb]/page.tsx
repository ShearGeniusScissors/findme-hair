import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SuburbPivotPage from "@/components/SuburbPivotPage";
import { TOP_SUBURBS } from "@/lib/suburbConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "at-home-hairdresser";
const TITLE_BASE = "At-Home Hairdressers";

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
  const title = `At-Home Hairdressers ${config.name} ${new Date().getFullYear()} | findme.hair`;
  const description = `Find at-home hairdressers in ${config.name}, ${stateName(config.state)}. Stylists who come to your home or workplace — cuts, colour, blow-dries with real Google reviews.`;

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

  // Mobile/at-home: prefer specialty:'mobile' or description match.
  const { data: bySpecialty } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .ilike("suburb", suburbName)
    .contains("specialties", ["mobile"])
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  if (bySpecialty && bySpecialty.length >= 6) return bySpecialty as Business[];

  // Fallback: name or description match for "mobile" / "home" / "at home" / "we come to you"
  const { data: byMatch } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .ilike("suburb", suburbName)
    .or("name.ilike.%mobile%,description.ilike.%mobile hair%,description.ilike.%at home%,description.ilike.%home visit%,description.ilike.%we come to you%,description.ilike.%come to your%")
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);

  // If no mobile-flagged businesses, fall back to top-rated salons in the suburb so the page is never empty.
  if ((bySpecialty?.length ?? 0) === 0 && (byMatch?.length ?? 0) === 0) {
    const { data: topRated } = await supabase
      .from("businesses")
      .select("*")
      .eq("status", "active")
      .eq("state", state)
      .ilike("suburb", suburbName)
      .in("business_type", ["hair_salon", "unisex"])
      .order("google_rating", { ascending: false, nullsFirst: false })
      .order("google_review_count", { ascending: false, nullsFirst: false })
      .limit(20);
    return (topRated ?? []) as Business[];
  }

  const combined: Business[] = [];
  const seen = new Set<string>();
  for (const list of [bySpecialty ?? [], byMatch ?? []]) {
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
        metaDescribeShort: "At-home and mobile hairdressers — stylists who come to your home or workplace",
        hero: "At-home hairdressers in {suburb} bring the salon to your front door — ideal for busy parents, professionals on tight schedules, anyone with mobility limits, or event hair (weddings, formals, race-day). Below are the verified mobile and at-home stylists serving {suburb}.",
        guideTitle: "How to choose an at-home hairdresser in {suburb}",
        guideIntro: "An at-home hairdresser in {suburb} should arrive with a complete portable kit — basin, chair, dryer, drop sheet — and treat your home with the same hygiene standards as a salon. The best at-home stylists are experienced salon hairdressers who chose mobile work; the worst are unqualified sole traders cutting corners. Read recent reviews carefully and confirm equipment up front.",
        whatToLook: [
          "Travel coverage and any travel fee beyond a 10-15km radius",
          "Equipment list — portable basin and chair are non-negotiable for colour services",
          "Public liability insurance",
          "Recent reviews mentioning their at-home setup, not just salon-only reviews",
          "Specialty match — colour, kids, seniors, event hair all need different skills",
        ],
        faq: [
          { q: "How much does an at-home hairdresser in {suburb} cost?", a: "An at-home cut and blow-dry in {suburb} typically runs $80-$150, $150-$300+ for colour, plus a small travel fee beyond 10-15km. Pricing reflects portable equipment and travel time, but works out similar to in-salon for many clients." },
          { q: "Do at-home hairdressers in {suburb} bring their own basin?", a: "The best ones do. A portable basin is essential for colour rinses and proper conditioning. Confirm equipment when booking, especially for colour services. If a stylist won't bring a basin, save colour work for a salon visit." },
          { q: "Can I get colour done by an at-home hairdresser in {suburb}?", a: "Yes — established at-home hairdressers in {suburb} carry professional colour, a portable basin, and bond-builders. Discuss colour history during booking. Major colour corrections often still need a salon environment for safety." },
          { q: "Best at-home hairdressers in {suburb}?", a: "{suburb} at-home hairdressers are listed above, ranked by Google rating and review count. Read recent reviews, confirm equipment and travel coverage, and book early — the best mobile stylists fill up weeks ahead." },
        ],
        scissorPlug: {
          text: "At-home hairdressers in {suburb} need scissors that hold a sharp edge between salon visits. ShearGenius supplies",
          linkText: "Japanese-steel scissors and Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/pages/hairdressing-scissor-sharpening-service",
        },
      }}
    />
  );
}
