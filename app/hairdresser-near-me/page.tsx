import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/hairdresser-near-me";
const title = `Hairdresser Near Me — Find a Hairdresser in Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a hairdresser near you in Australia. Verified salons and stylists in every major city and suburb — cuts, colour, balayage, blow-dries and treatments with real Google reviews.";

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
        routePath: "/hairdresser-near-me",
        pageTitle: "Hairdresser Near Me",
        metaDescription: description,
        h1: "Hairdresser Near Me",
        hero: "Find a hairdresser near you in Australia. Verified hair salons and stylists in every major city and high-density suburb — cuts, colour, balayage, foils, blow-dries and treatments, ranked by Google rating and review count.",
        cityRoute: "/best-hairdresser",
        suburbRoute: "/hairdresser",
        guideTitle: "How to find the best hairdresser near you",
        guideIntro: "The right hairdresser depends on the work you want done. For a quick cut and blow-dry, last-minute Saturday slots and walk-in flexibility matter most. For colour, balayage, or a major change, look for senior-stylist availability, a clear consultation step, and recent Instagram work in your style. The shortlists below are filtered by Google rating and review count, so you start with the salons local clients actually rate.",
        whatToDo: [
          "Type your suburb in the search above to find hairdressers around you",
          "Or pick a city or suburb below to browse the verified shortlist",
          "Read the most recent Google reviews — quality changes when senior staff move salons",
          "Check the salon's Instagram for fresh cuts and colour in your style",
          "Book consultations for colour, balayage, or any major cut change",
        ],
        faq: [
          { q: "How much does a haircut cost at a hairdresser in Australia?", a: "A standard women's cut typically runs $60-$120, blow-dries $50-$90, half-head foils $200-$300, and balayage $250-$650 depending on hair length. Senior stylists charge a premium and usually deliver a sharper result for higher-stakes work." },
          { q: "How often should I get a haircut?", a: "For most cuts, every 6-10 weeks keeps the shape sharp. Pixie cuts and short bobs need 3-5 week trims. Long-hair clients can stretch to 12 weeks if the ends are well-conditioned. Colour clients usually book around the cut to consolidate visits." },
          { q: "What's the difference between a hairdresser and a barber?", a: "Hairdressers cover the full salon range — cuts, colour, balayage, treatments and styling. Barbers focus on clipper-driven men's cuts, fades, beards and shaves. Pick based on the cut you want, not just gender." },
          { q: "How do I find a good hairdresser for colour or balayage?", a: "Always book a consultation first — colour is a skill that varies hugely between stylists. Look for a strong Instagram portfolio of work in your tone, and check that bond-building (Olaplex or similar) is included as standard, not an upsell." },
          { q: "Do hairdressers take walk-ins?", a: "Some salons take walk-ins for trims, blow-dries, and last-minute fringe cuts. Colour and senior-stylist work usually need a booking. Always call ahead, especially Friday afternoons and Saturdays." },
          { q: "How do I find a hairdresser open near me right now?", a: "Use the search above with your suburb name to see verified salons nearby. Then check Google for live opening hours and recent reviews. Many salons also post Instagram stories with same-day availability." },
        ],
        scissorPlug: {
          text: "Top hairdressers in Australia put their scissors through hundreds of cuts a year. ShearGenius supplies",
          linkText: "Japanese-steel hairdressing scissors and lifetime sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
