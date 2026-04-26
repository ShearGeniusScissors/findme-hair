import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/hair-stylist-near-me";
const title = `Hair Stylist Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a hair stylist near you in Australia. Verified senior stylists for cuts, colour, balayage, blow-dries and special-occasion styling with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/hair-stylist-near-me",
      pageTitle: "Hair Stylist Near Me",
      metaDescription: description,
      h1: "Hair Stylist Near Me",
      hero: "Find a hair stylist near you in Australia. Verified senior stylists for cuts, colour, balayage, blow-dries and special-occasion styling — ranked by Google rating and review count. The shortlist below filters for stylists clients actually rate.",
      cityRoute: "/best-hairdresser",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find the right hair stylist near you",
      guideIntro: "Stylists matter more than salons. The same chair, same products, same blow-dryer can deliver wildly different results depending on the person holding the scissors. The fastest way to pick a stylist is to scan their Instagram for fresh work in your style — if their portfolio is consistent and recent, you're in good hands.",
      whatToDo: [
        "Type your suburb above to find stylists nearby",
        "Or pick a city below to browse the verified shortlist",
        "Check the stylist's individual Instagram, not just the salon's",
        "Senior stylists for high-stakes work; junior stylists for routine cuts (often great value at top salons)",
        "Read recent reviews mentioning the specific service you want",
      ],
      faq: [
        { q: "How much does a senior hair stylist cost in Australia?", a: "Senior stylists charge $120-$200 for a women's cut, $250-$650 for balayage, and $400-$800 for full corrective colour. Junior stylists at the same salons charge 30-50% less and often deliver excellent work because they're trained by the seniors." },
        { q: "How do I find a hair stylist that suits me?", a: "Match the stylist's portfolio to your goals. A balayage specialist won't be your best choice for a precision pixie. A precision-cut specialist won't be your best for elaborate bridal styling. Use the city/suburb shortlists below to narrow." },
        { q: "What's the difference between a hair stylist and a hairdresser?", a: "Often the same person. 'Hair stylist' suggests a senior or specialist; 'hairdresser' is the broader trade term covering everyone from junior to master. In Australia both are used interchangeably." },
        { q: "Can I book the same hair stylist every time?", a: "Yes — most salons let you book by stylist name, not just date. Booking the same stylist consistently is the single fastest way to get great hair. Your stylist learns your hair, your preferences, your tolerance for change." },
        { q: "How far in advance should I book a hair stylist?", a: "For senior stylists at top salons, 2-6 weeks ahead. For junior stylists or routine cuts, often same-week availability. For bridal hair, 6-12 months. Use the listings above to check live booking availability." },
      ],
      scissorPlug: { text: "Top hair stylists in Australia put their scissors through hundreds of cuts a year. ShearGenius supplies", linkText: "Japanese-steel hairdressing scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
