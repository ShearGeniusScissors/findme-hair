import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/best-hair-salon-near-me";
const title = `Best Hair Salon Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find the best hair salon near you in Australia. Verified top-rated salons in every major city and suburb — cuts, colour, balayage, blow-dries with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/best-hair-salon-near-me",
      pageTitle: "Best Hair Salon Near Me",
      metaDescription: description,
      h1: "Best Hair Salon Near Me",
      hero: "Find the best hair salon near you in Australia. Verified top-rated salons in every major city and high-density suburb, ranked by Google rating and review count. The best salons earn their reputation visit by visit — the shortlist below filters for that.",
      cityRoute: "/best-hairdresser",
      suburbRoute: "/hair-salon",
      guideTitle: "How to find the best hair salon near you",
      guideIntro: "&ldquo;Best&rdquo; is subjective for hair, but a few signals separate the top salons from the rest. The shortlists below filter by Google rating and review count first, then verify against multiple third-party sources. Read the latest 30 reviews — the best salons earn most of their reviews recently because they&rsquo;re consistently good.",
      whatToDo: [
        "Type your suburb above to find top-rated salons nearby",
        "Or pick a city below to browse the verified shortlist",
        "Read recent (last 90 days) reviews — lifetime ratings hide stylist turnover",
        "Look for senior-stylist availability if you want sharper colour or balayage work",
        "Check Instagram for fresh work in your style before committing for a major change",
      ],
      faq: [
        { q: "What makes a hair salon the best?", a: "Five signals: senior stylist availability, recent (90-day) review consistency, a clear consultation step, included bond-builders on colour services, and a working Instagram presence with fresh work in your style. Marble fit-outs are decoration; the work is what matters." },
        { q: "How much does the best hair salon cost?", a: "Top-tier salons in Australia charge $120-$200 for a senior cut, $300-$650 for balayage, and $400-$800 for full corrective colour. The premium reflects senior-stylist time, included bond-builders, and longer service durations — not the marble countertops." },
        { q: "How do I find the best hair salon for my hair type?", a: "Match the salon's specialty to your need — curly hair specialists for textured hair, balayage specialists for colour, Korean salons for magic straightening, Japanese salons for precision dry-cutting. Use the city/suburb shortlists below to filter." },
        { q: "Are the best salons booked out far in advance?", a: "For senior stylists, expect 2-6 weeks lead time at top salons. Junior stylists at the same salons often have same-week availability and deliver excellent work because they're trained by the seniors. Junior bookings are how to access top salons without the wait." },
        { q: "Can I trust 5-star ratings on hair salons?", a: "Mostly yes, but read the actual reviews. Beware of salons with high lifetime ratings but few recent reviews (stylists may have moved on). The strongest signal is consistent recent reviews mentioning specific cuts or colours similar to what you want." },
      ],
      scissorPlug: { text: "Top hair salons in Australia put their scissors through hundreds of cuts a year. ShearGenius supplies", linkText: "Japanese-steel hairdressing scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
