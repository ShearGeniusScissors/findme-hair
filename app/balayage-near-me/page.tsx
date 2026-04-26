import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/balayage-near-me";
const title = `Balayage Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a balayage near you in Australia. Verified balayage specialists for hand-painted highlights, lived-in colour, foilage, money-piece and ash-blonde with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/balayage-near-me",
      pageTitle: "Balayage Near Me",
      metaDescription: description,
      h1: "Balayage Near Me",
      hero: "Find a balayage near you in Australia. Verified balayage specialists for hand-painted highlights, lived-in colour, foilage, money-piece, ash-blonde and warm bronde — ranked by Google rating and review count.",
      cityRoute: "/balayage-specialist",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find a great balayage near you",
      guideIntro: "Balayage is a hand-painting technique, not a colour formula. The difference between a great balayage and an average one comes down to the colourist's eye, hand placement, and how they manage tone after lifting. The best balayage specialists have a consistent Instagram portfolio, charge by hours of work rather than a flat colour fee, and book strand tests for clients with previously coloured hair.",
      whatToDo: [
        "Type your suburb above to find balayage specialists nearby",
        "Or pick a city below to browse the verified shortlist",
        "Check Instagram for consistent before/after balayage in tones close to yours",
        "Confirm pricing structure — by hours/length is usually fairer than a flat fee",
        "Bond-building (Olaplex or equivalent) should be included as standard, not an upsell",
      ],
      faq: [
        { q: "How much does balayage cost in Australia?", a: "Balayage typically runs $250-$650 depending on hair length and how much lift you need. Premium colourists charge $400+ and include a bond-builder treatment, gloss and blow-dry. Always book a consultation first if you have previously coloured hair." },
        { q: "How long does balayage last?", a: "Because balayage grows out softly, most clients return for a refresh every 4-6 months — far less often than the 6-8 week cycle full foils need. A toning gloss between sessions extends the result." },
        { q: "What's foilayage and how is it different to balayage?", a: "Foilayage combines hand-painted balayage with foil to drive more lift. It works well on darker or coarser hair where freehand balayage struggles to lift cleanly. Most balayage specialists offer both and pick based on your hair." },
        { q: "How do I find the best balayage near me?", a: "Type your suburb above. Then check the salon's Instagram for fresh balayage in tones similar to what you want. Read recent reviews mentioning grow-out — that's the real test of balayage placement." },
        { q: "What's the difference between balayage, ombré and highlights?", a: "Highlights are foiled mid-shaft, balayage is painted freehand, ombré is a horizontal gradient root-to-tip. Balayage gives the softest grow-out, highlights give the most uniform lift, ombré gives the strongest contrast. Many salons combine techniques." },
      ],
      scissorPlug: { text: "Balayage specialists pair colour service with weight-removal scissors and chip-cutting techniques. ShearGenius supplies", linkText: "Japanese-steel scissors and thinners with Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors" },
    }} />
  );
}
