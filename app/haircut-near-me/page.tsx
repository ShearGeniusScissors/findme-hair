import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/haircut-near-me";
const title = `Haircut Near Me — Find a Hairdresser or Barber in Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a haircut near you in Australia. Verified hairdressers, barbers and salons in every major city and suburb — quick cuts, fades, blow-dries and full colour with real Google reviews.";

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
        routePath: "/haircut-near-me",
        pageTitle: "Haircut Near Me",
        metaDescription: description,
        h1: "Haircut Near Me",
        hero: "Find a haircut near you in Australia — hairdressers, barbers and salons in every major city and high-density suburb, ranked by Google rating and review count. Whether you need a quick fringe trim, a full skin fade, or a bridal upstyle, start here.",
        cityRoute: "/best-hairdresser",
        suburbRoute: "/hairdresser",
        guideTitle: "How to find a haircut near you, fast",
        guideIntro: "The fastest haircut is the one you can walk into right now. The best haircut is the one your stylist has done a hundred times before. Most people want both. Start by typing your suburb above, then pick the salon or barber that matches the cut you want — short fades go to barbers, longer cuts and colour go to hairdressers.",
        whatToDo: [
          "Type your suburb in the search above to find a haircut nearby",
          "For fades, taper cuts, beard work — pick a barber",
          "For longer cuts, colour, balayage, treatments — pick a hairdresser",
          "Read the latest 10-20 Google reviews before booking",
          "Walk-ins are common at barbers and quick-cut salons; colour and senior stylists usually need a booking",
        ],
        faq: [
          { q: "How much does a haircut cost in Australia?", a: "Men's cuts typically run $30-$55 at standard barbers and $65-$90 at premium gentleman's barbers. Women's cuts run $60-$120 at standard salons and $150+ at senior-stylist salons. Colour adds $200-$650 depending on technique and length." },
          { q: "How long does a haircut take?", a: "A standard men's cut takes 25-35 minutes. A skin fade takes 35-50 minutes. A women's cut and blow-dry runs 45-75 minutes. Colour services run 90 minutes to 4 hours depending on whether you're getting a single tone, foils, or balayage." },
          { q: "How do I find a haircut open right now?", a: "Use the search above to find salons and barbers in your suburb, then check Google for live opening hours. Many shops post live queue updates on Google or Instagram for walk-ins. Saturday morning is the busiest, weekday mornings are quietest." },
          { q: "What's the difference between a salon and a barber?", a: "Salons handle longer cuts, colour, balayage and styling — most clients book ahead. Barbers handle clipper-driven cuts (fades, tapers), beards and shaves — many take walk-ins. Pick based on the cut, not the venue type." },
          { q: "How often should I get a haircut?", a: "Skin fades need a refresh every 2-3 weeks. Standard men's cuts hold 4-6 weeks. Women's cuts hold 6-10 weeks. Pixies and short bobs need 3-5 week trims. Long-hair clients can stretch to 12 weeks if the ends are healthy." },
          { q: "Should I tip my hairdresser or barber in Australia?", a: "Tipping is optional in Australia — wages cover the service. That said, $5-$10 for a great cut or fade is a friendly gesture, and regulars often tip at Christmas. Don't feel obligated for routine visits." },
        ],
        scissorPlug: {
          text: "Whatever cut you book, your stylist's most important tool is their scissors. ShearGenius supplies",
          linkText: "Japanese-steel scissors with Australia-wide mail-in sharpening for barbers and hairdressers Australia-wide",
          linkHref: "https://www.sheargenius.com.au/collections/hairdressing-scissors",
        },
      }}
    />
  );
}
