import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/mobile-hairdresser-near-me";
const title = `Mobile Hairdresser Near Me — At-Home Stylists in Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a mobile hairdresser near you in Australia. At-home stylists who come to your door — cuts, colour, blow-dries, weddings and event hair, all with real Google reviews.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: {
    title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <NearMePage
      content={{
        routePath: "/mobile-hairdresser-near-me",
        pageTitle: "Mobile Hairdresser Near Me",
        metaDescription: description,
        h1: "Mobile Hairdresser Near Me",
        hero: "Find a mobile hairdresser near you in Australia. Verified at-home stylists who bring the salon to your front door — ideal for parents, professionals, mobility-limited clients, weddings, formals and race-day. Browse by city or suburb below.",
        cityRoute: "/mobile-hairdresser",
        suburbRoute: "/at-home-hairdresser",
        guideTitle: "How to find a mobile hairdresser near you",
        guideIntro: "A mobile hairdresser near you should arrive with a complete portable kit — basin, chair, dryer, drop sheet — and treat your home with the same hygiene as a salon. The best mobile stylists are experienced salon hairdressers who switched to at-home work, so you get salon-quality results without the trip.",
        whatToDo: [
          "Type your suburb in the search above to find mobile stylists nearby",
          "Or pick a city or suburb below to browse the verified shortlist",
          "Confirm equipment list — basin and chair are non-negotiable for colour services",
          "Check travel coverage and any travel fee beyond a 10-15km radius",
          "Read recent reviews specifically mentioning at-home setup, not just salon-only reviews",
        ],
        faq: [
          { q: "How much does a mobile hairdresser cost in Australia?", a: "Mobile hairdressers in Australia typically charge $80-$150 for a cut and blow-dry, $150-$300+ for colour, plus a small travel fee beyond 10-15km. Pricing reflects portable equipment and travel, but works out similar to in-salon for many clients." },
          { q: "Do mobile hairdressers bring their own equipment?", a: "The best ones do. A portable basin is essential for colour rinses and conditioning. Confirm equipment when booking, especially for colour services. If a stylist won't bring a basin, save colour work for a salon visit." },
          { q: "Can a mobile hairdresser do balayage at home?", a: "Yes — established mobile hairdressers carry professional colour, a portable basin, and bond-builders. Balayage at home works well. Major colour corrections often still need a salon environment for safety and lighting." },
          { q: "How do I find a mobile hairdresser near me?", a: "Use the search above with your suburb name to see verified mobile stylists nearby. Or pick a major city below to browse the at-home hairdresser shortlist for that area." },
          { q: "Do mobile hairdressers come for weddings and events?", a: "Yes — many mobile hairdressers specialise in bridal and event hair. They time-block the morning, bring backup product, and travel to the venue. Book at least 6 months ahead for peak wedding season (October to April)." },
          { q: "Are mobile hairdressers cheaper than salon visits?", a: "Mobile hairdressers usually cost the same as a salon, sometimes slightly more once travel is included. The premium you're paying is for the convenience — saving the trip, the parking, and the time. For families or busy professionals, the maths often works out." },
        ],
        scissorPlug: {
          text: "Mobile hairdressers need scissors that hold a sharp edge between salon visits. ShearGenius supplies",
          linkText: "Japanese-steel scissors and Australia-wide mail-in sharpening",
          linkHref: "https://www.sheargenius.com.au/pages/hairdressing-scissor-sharpening-service",
        },
      }}
    />
  );
}
