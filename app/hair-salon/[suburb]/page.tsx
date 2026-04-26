import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SuburbPivotPage from "@/components/SuburbPivotPage";
import { TOP_SUBURBS } from "@/lib/suburbConfig";
import { stateName } from "@/lib/geo";
import { supabaseServerAnon } from "@/lib/supabase";
import type { Business } from "@/types/database";

export const revalidate = 3600;

const ROUTE = "hair-salon";
const TITLE_BASE = "Hair Salons";

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
  const title = `Hair Salons in ${config.name} ${new Date().getFullYear()} — Best ${config.name} Salons | findme.hair`;
  const description = `Find the best hair salons in ${config.name}, ${stateName(config.state)}. Verified salons offering cuts, colour, balayage, blow-dries and treatments — with real Google reviews.`;

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
        hero: "Hair salons in {suburb} cover the full salon range — cuts, colour, balayage, foils, blow-dries, treatments and styling. Below are the verified salons in {suburb} ranked by Google rating and review count.",
        guideTitle: "How to choose a hair salon in {suburb}",
        guideIntro: "The right hair salon in {suburb} depends on the work you want done. For a quick cut and blow-dry, walk-in or last-minute Saturday slots matter most. For colour, balayage, or a major cut change, look for senior-stylist availability, a clear consultation step, and recent Instagram work in your style. The shortlist below filters by Google rating and review count, so you start with the salons clients actually rate.",
        whatToLook: [
          "Senior stylist availability for higher-stakes work (colour, balayage, fringe)",
          "Recent Instagram or Google photos that match the cut or colour you want",
          "Bond-building and aftercare advice as standard, not an upsell",
          "Pricing transparency — by hours or by length, not just a flat rate",
          "Recent reviews mentioning the specific service you need",
        ],
        faq: [
          { q: "How much does a hair salon cost in {suburb}?", a: "A standard cut and blow-dry in {suburb} typically runs $80-$150 depending on length and seniority. Half-head foils sit around $200-$300, balayage $250-$650, and bridal hair $250-$450. Senior stylists charge a premium and usually deliver a sharper result for higher-stakes work." },
          { q: "How do I find the best hair salon in {suburb}?", a: "The best hair salons in {suburb} are listed above, ranked by Google rating, review count and verification flags. Always read the most recent reviews for cuts and colours similar to what you want." },
          { q: "Do hair salons in {suburb} take walk-ins?", a: "Some {suburb} salons take walk-ins for trims and blow-dries, but colour and any senior-stylist work usually need a booking. Always call ahead, especially Friday afternoons and Saturdays." },
          { q: "What's the difference between a hair salon and a barber in {suburb}?", a: "Hair salons in {suburb} cover the full range — cuts, colour, balayage, treatments and styling for women and men. Barbers focus on clipper-driven men's cuts, fades, beards and shaves. Pick based on the cut you want." },
        ],
        scissorPlug: {
          text: "Top hair salons in {suburb} put their scissors through hundreds of cuts a year. ShearGenius supplies",
          linkText: "Japanese-steel hairdressing scissors and Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
