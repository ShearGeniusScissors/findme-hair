import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/kids-haircut-near-me";
const title = `Kids Haircut Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a kids haircut near you in Australia. Verified family-friendly salons offering first haircuts, sensory-friendly cuts, and quick kid-favourite trims with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/kids-haircut-near-me",
      pageTitle: "Kids Haircut Near Me",
      metaDescription: description,
      h1: "Kids Haircut Near Me",
      hero: "Find a kids haircut near you in Australia. Verified family-friendly salons that handle first haircuts, the trickier toddler trims, sensory-friendly cuts and quick kid-favourite styles — ranked by Google rating and review count.",
      cityRoute: "/kids-hairdresser",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find a great kids haircut near you",
      guideIntro: "A great kids haircut is patient, fast, and good at distraction. Some salons run dedicated kids studios with car-shaped chairs and cartoons; others are mixed salons with one or two stylists who genuinely enjoy cutting children. Sensory-friendly options matter for kids who struggle with clippers, mirrors, or the smell of styling product.",
      whatToDo: [
        "Type your suburb above to find kids haircut salons nearby",
        "Or pick a city below to browse the verified shortlist",
        "For first haircuts, ask about certificate / photo / curl-saving offers",
        "For sensory needs, mention them at booking — many stylists will use scissors only, skip the cape, dim the lights",
        "Standard kids cut takes 15-25 minutes — book longer for first cuts or anxious kids",
      ],
      faq: [
        { q: "How much does a kids haircut cost in Australia?", a: "A kids cut runs $25-$45 in capital cities and $20-$40 regionally. Dedicated kids salons may charge a small premium for the experience (chair, distraction toys, certificate). Most salons charge a separate kids price up to age 11 or 12." },
        { q: "What's a sensory-friendly kids cut?", a: "Sensory-friendly cuts are designed for kids who find clippers, mirrors, or salon noise overwhelming. Stylists may use scissors only, work with the child on a parent's lap, skip the cape, and dim the lights. Book ahead and mention sensory needs." },
        { q: "Where can I get a first haircut for my baby?", a: "Many salons specialise in first haircuts — typically a certificate, a photo, and a saved curl in a small envelope. Most run them as a $35-$50 package. Use the search above to find dedicated kids salons in your suburb." },
        { q: "What age is best for a first haircut?", a: "There's no perfect age — most parents do a first cut between 12 and 24 months when hair starts getting in the eyes or becomes unmanageable. Some wait longer for sentimental reasons. Bring a snack, a favourite toy, and book the quietest time of day." },
        { q: "How do I find a kids haircut open near me?", a: "Use the search above with your suburb name. Most kids salons post live opening hours on Google. Saturday morning is the busiest, weekday mornings are quietest." },
      ],
      scissorPlug: { text: "Kids stylists need scissors that stay sharp through hundreds of fast, short cuts. ShearGenius supplies", linkText: "professional Japanese-steel scissors with Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
