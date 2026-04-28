import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SuburbPivotPage from "@/components/SuburbPivotPage";
import { TOP_SUBURBS } from "@/lib/suburbConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { Business } from "@/types/database";

export const revalidate = 3600;
export const dynamicParams = false;

const ROUTE = "hairdresser";
const TITLE_BASE = "Hairdressers";

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
  const title = `Hairdressers in ${config.name} ${new Date().getFullYear()} | findme.hair`;
  const description = `Find the best hairdressers in ${config.name}, ${stateName(config.state)}. Verified salons with real Google reviews — cuts, colour, balayage, blow-dries and more.`;

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
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "active")
    .eq("state", state)
    .ilike("suburb", suburbName)
    .in("business_type", ["hair_salon", "unisex"])
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("google_rating", { ascending: false, nullsFirst: false })
    .order("google_review_count", { ascending: false, nullsFirst: false })
    .limit(20);
  return (data ?? []) as Business[];
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
        metaDescribeShort: "Hair salons offering cuts, colour, balayage, blow-dries and treatments",
        hero: "Hairdressers in {suburb} cover everything from a quick fringe trim to balayage, foils, blow-dries and bridal hair. Below are the verified salons in {suburb} with the strongest Google reviews.",
        guideTitle: "How to choose a hairdresser in {suburb}",
        guideIntro: "Pick a hairdresser in {suburb} based on the work in their portfolio, not the salon fit-out. Recent reviews, fresh Instagram cuts, and a clear consultation up front matter more than the chair you sit in. The shortlist below is filtered by Google rating and review count, so you start with the salons that local clients actually rate.",
        whatToLook: [
          "Recent Instagram or Google photos that match the cut or colour you want",
          "Senior stylist availability for higher-stakes work (colour correction, balayage, bridal)",
          "Bond-building and aftercare advice as standard, not an upsell",
          "Clear pricing — by hours or by length, not just a flat rate",
          "Reviews from clients with similar hair texture (fine, thick, curly, coloured)",
        ],
        faq: [
          { q: "How much does a haircut cost in {suburb}?", a: "A standard women's cut in {suburb} typically runs $60-$120, blow-dries $50-$90, and balayage colour $250-$650 depending on length. Senior stylists charge a premium and usually deliver a sharper result for higher-stakes work." },
          { q: "Where can I find the best hairdresser in {suburb}?", a: "The best hairdressers in {suburb} are listed above, ranked by Google rating, review count and our verification flags. Check the most recent reviews for cuts and colours similar to what you want." },
          { q: "Do hairdressers in {suburb} take walk-ins?", a: "Some {suburb} salons take walk-ins for trims and blow-dries, but colour and any senior-stylist work usually need a booking. Always call ahead, especially Friday afternoons and Saturdays." },
          { q: "What's the difference between a hairdresser and a barber in {suburb}?", a: "Hairdressers in {suburb} cover the full salon range — cuts, colour, balayage, treatments and styling. Barbers focus on clipper-driven men's cuts, fades, beards and shaves. Pick based on the cut you want, not just gender." },
        ],
        scissorPlug: {
          text: "Top hairdressers in {suburb} put their scissors through hundreds of cuts a year. ShearGenius supplies",
          linkText: "Japanese-steel hairdressing scissors and Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
