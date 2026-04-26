import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/hair-colourist-near-me";
const title = `Hair Colourist Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a hair colourist near you in Australia. Verified specialists for balayage, foils, lived-in colour, blonde, brunette, copper and corrective colour with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/hair-colourist-near-me",
      pageTitle: "Hair Colourist Near Me",
      metaDescription: description,
      h1: "Hair Colourist Near Me",
      hero: "Find a hair colourist near you in Australia. Verified specialists for balayage, foils, lived-in colour, blonde, brunette, copper, ash, and corrective colour — ranked by Google rating and review count.",
      cityRoute: "/balayage-specialist",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find the right hair colourist near you",
      guideIntro: "Colour is a skill that varies hugely between stylists — far more than cutting. The right colourist for you depends on what you want: balayage specialists hand-paint for soft grow-out, foil specialists drive maximum lift, and corrective specialists fix what other salons couldn't. Always book a consultation before a major colour change.",
      whatToDo: [
        "Type your suburb above to find colourists nearby",
        "Or pick a city below to browse the verified shortlist",
        "Match the specialty to your goal — balayage, foils, blonde, copper, lived-in, corrective",
        "Bring at least 3 reference photos in different lighting",
        "Always book a consultation before a major colour change, especially over previous colour",
      ],
      faq: [
        { q: "How much does a hair colourist cost in Australia?", a: "Single-tone all-over colour runs $150-$280, half-head foils $200-$300, full-head foils $300-$450, balayage $250-$650, and corrective colour $400-$1500+ depending on the starting hair. Senior colourists charge a 30-50% premium." },
        { q: "How do I find a good hair colourist?", a: "Top hair colourists have consistent recent Instagram work in the tone you want. Lifetime ratings hide stylist turnover. Book a consultation, ask about bond-builders (Olaplex or equivalent included as standard), and never accept colour without a strand test if you have previously coloured hair." },
        { q: "What's the difference between a hair colourist and a hairdresser?", a: "All hair colourists are hairdressers, but not all hairdressers are colour specialists. A colourist invests heavily in colour education, runs more colour services per week than cuts, and usually has a documented portfolio of complex work like balayage, copper, or corrective." },
        { q: "How often should I get my hair coloured?", a: "Single-tone all-over colour: every 4-6 weeks for root retouch. Foils: every 6-10 weeks. Balayage: every 4-6 months for refresh. Lived-in colour grows out softly so refresh cadence is the most flexible." },
        { q: "Can a colourist fix bad colour?", a: "Yes — corrective colour specialists rebuild bleached, brassy, or banded hair into a healthier tone. Costs $400-$1500+ depending on starting condition. Always book a consultation first; a strand test confirms the hair can take the correction." },
      ],
      scissorPlug: { text: "Top colourists pair colour service with weight-removal scissors and chip-cutting techniques. ShearGenius supplies", linkText: "Japanese-steel scissors and thinners with Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
