import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/hair-color-near-me";
const title = `Hair Color Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find hair color near you in Australia. Verified hair color specialists for balayage, foils, lived-in color, blonde, brunette, copper and corrective color with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/hair-color-near-me",
      pageTitle: "Hair Color Near Me",
      metaDescription: description,
      h1: "Hair Color Near Me",
      hero: "Find hair color near you in Australia. Verified specialists for balayage, foils, lived-in color, blonde, brunette, copper, ash and corrective color — ranked by Google rating and review count. (Australian English: hair colour. Same service.)",
      cityRoute: "/balayage-specialist",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find the right hair color near you",
      guideIntro: "Color is a skill that varies hugely between stylists. The right color stylist depends on what you want — balayage specialists hand-paint for soft grow-out, foil specialists drive maximum lift, corrective specialists fix what other salons couldn't. Always book a consultation before a major color change.",
      whatToDo: [
        "Type your suburb above to find color stylists nearby",
        "Or pick a city below to browse the verified shortlist",
        "Match the specialty to your goal — balayage, foils, blonde, copper, lived-in, corrective",
        "Bring at least 3 reference photos in different lighting",
        "For coloring over previous color, always book a consultation and strand test first",
      ],
      faq: [
        { q: "How much does hair color cost in Australia?", a: "Single-tone all-over color runs $150-$280, half-head foils $200-$300, full-head foils $300-$450, balayage $250-$650, and corrective color $400-$1500+ depending on the starting hair. Senior colorists charge a 30-50% premium." },
        { q: "How do I find a good hair colorist?", a: "Top hair colorists have consistent recent Instagram work in the tone you want. Lifetime ratings hide stylist turnover. Book a consultation, ask about bond-builders, and never accept color without a strand test if you have previously colored hair." },
        { q: "What's the difference between balayage, ombré, and highlights?", a: "Highlights are foiled mid-shaft, balayage is painted freehand, ombré is a horizontal gradient. Balayage gives the softest grow-out, highlights give the most uniform lift, ombré gives the strongest contrast." },
        { q: "How often should I get hair color refreshed?", a: "Single-tone all-over color: every 4-6 weeks for root retouch. Foils: every 6-10 weeks. Balayage: every 4-6 months for refresh. Lived-in color grows out softly so refresh cadence is the most flexible." },
        { q: "Is 'hair color' the same as 'hair colour'?", a: "Yes — 'color' is American spelling, 'colour' is Australian and British. Same service, same chemistry. Australian salons use both spellings on their websites." },
      ],
      scissorPlug: { text: "Top color stylists pair color service with weight-removal scissors and chip-cutting techniques. ShearGenius supplies", linkText: "Japanese-steel scissors and thinners with Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
