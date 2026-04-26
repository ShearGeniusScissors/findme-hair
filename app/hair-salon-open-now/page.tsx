import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/hair-salon-open-now";
const title = `Hair Salon Open Now Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a hair salon open now near you in Australia. Verified salons and barber shops with live Google opening hours — same-day cuts, walk-ins and last-minute appointments.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/hair-salon-open-now",
      pageTitle: "Hair Salon Open Now Near Me",
      metaDescription: description,
      h1: "Hair Salon Open Now Near Me",
      hero: "Find a hair salon open right now in Australia. Search your suburb to see verified salons and barber shops with live Google opening hours. Same-day cuts, walk-ins, and last-minute fringe trims.",
      cityRoute: "/best-hairdresser",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find a hair salon open near you, right now",
      guideIntro: "The fastest way to find a same-day haircut is to type your suburb in the search above, then check Google's live opening hours on each listing. Many salons take walk-ins for trims and quick cuts. Friday afternoon and Saturday morning are the busiest — weekday mornings and early afternoons are the most likely to take you immediately.",
      whatToDo: [
        "Type your suburb above to find salons nearby",
        "Click through to a listing and check live Google opening hours",
        "Call ahead to confirm walk-in availability — particularly for fades and colour",
        "Most barbers post live queue updates on Google or Instagram for walk-ins",
        "Saturday is the busiest day; weekday mornings are the quietest",
      ],
      faq: [
        { q: "How do I find a hair salon open right now?", a: "Use the search above with your suburb name. Then check the live opening hours on each listing — findme.hair pulls these from Google Business Profile and refreshes hourly. Many salons post live wait-time updates on Google or Instagram." },
        { q: "Are hair salons open on Sundays in Australia?", a: "Most major-city salons open at least limited Sunday hours, especially in shopping precincts. Regional salons often close Sundays. Always check live opening hours before driving." },
        { q: "What time do hair salons usually close?", a: "Most Australian salons close 5-6pm weekdays, 4-5pm Saturdays. Premium salons in capital cities often run late opening (until 7-8pm) on Thursdays and Fridays. Barber shops typically run later than hair salons." },
        { q: "Can I get a same-day haircut?", a: "Yes — many salons hold walk-in slots, especially for trims, blow-dries and men's cuts. For colour, balayage or any senior-stylist work, same-day is harder. Call ahead, or book through the salon's online booking link." },
        { q: "What if my regular salon is closed?", a: "Use the search above to find verified salons in nearby suburbs. The shortlists are ranked by Google rating and review count, so even an unfamiliar salon should deliver a quality cut if it ranks high." },
      ],
      scissorPlug: { text: "Salons running long hours need scissors that hold their edge through high-volume days. ShearGenius supplies", linkText: "Japanese-steel scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
