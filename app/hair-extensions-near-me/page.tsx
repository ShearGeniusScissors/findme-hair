import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/hair-extensions-near-me";
const title = `Hair Extensions Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find hair extensions near you in Australia. Verified specialists for tape extensions, hand-tied wefts, bonds, micro-beads and Russian Remy human hair — with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/hair-extensions-near-me",
      pageTitle: "Hair Extensions Near Me",
      metaDescription: description,
      h1: "Hair Extensions Near Me",
      hero: "Find hair extensions near you in Australia. Verified specialists for tape extensions, hand-tied wefts, keratin bonds, micro-beads and Russian Remy human hair, ranked by Google rating and review count. Browse by city or suburb below.",
      cityRoute: "/hair-extensions",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find the right hair extensions near you",
      guideIntro: "The right method depends on your natural hair density and how much maintenance you can commit to. Tape extensions are the most popular — fast install, easy removal. Hand-tied wefts last longer. Bonds and micro-beads need a skilled installer because poor placement causes traction damage. Always book a consultation before committing.",
      whatToDo: [
        "Type your suburb in the search above to find extension specialists nearby",
        "Or pick a city below to browse the verified shortlist",
        "Method match — tape vs weft vs bond should be discussed at consultation, not chosen for you",
        "Ask about hair grade — Russian Remy or European human hair is the gold standard",
        "Confirm aftercare kit, refit cadence, and removal cost up front",
      ],
      faq: [
        { q: "How much do hair extensions cost in Australia?", a: "Tape extensions typically run $700-$1500 for a full head, hand-tied wefts $1500-$3000, and keratin bonds $1200-$2500. Pricing reflects the quality and quantity of human hair used. Always book a consultation first." },
        { q: "How long do tape extensions last?", a: "Tape extensions last 12-18 months with proper care, but the tape itself needs moving up every 6-8 weeks as your natural hair grows. Hand-tied wefts last 6-12 months and refit every 8-10 weeks." },
        { q: "Do extensions damage your natural hair?", a: "Properly fitted extensions should not damage natural hair. Damage usually comes from extensions installed too tight, the wrong method for your hair type, or poor removal. Always work with an experienced installer and follow the aftercare." },
        { q: "What's the difference between Russian Remy and standard human hair?", a: "Russian Remy is the highest grade — collected with cuticles aligned in one direction, never chemically stripped, and lasts 12-18+ months. Standard human hair is often acid-bath stripped to remove cuticles, then synthetic-coated, which gives a shorter lifespan." },
        { q: "How do I find a hair extension specialist near me?", a: "Type your suburb above, or pick a major city below. Read recent reviews specifically mentioning blend, comfort, and the 6-month grow-out experience — not just the install day." },
      ],
      scissorPlug: { text: "Extension stylists rely on specialised scissors to blend tape and weft into the natural hair. ShearGenius supplies", linkText: "Japanese-steel scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
