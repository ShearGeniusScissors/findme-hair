import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/barber-near-me";
const title = `Barber Near Me — Find a Barber in Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a barber near you in Australia. Verified barber shops in every major city and suburb — skin fades, scissor cuts, hot-towel shaves and beard trims with real Google reviews.";

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
        routePath: "/barber-near-me",
        pageTitle: "Barber Near Me",
        metaDescription: description,
        h1: "Barber Near Me",
        hero: "Find a barber near you in Australia. Verified barber shops in every major city and high-density suburb — skin fades, taper fades, scissor cuts, hot-towel shaves and beard trims, all ranked by Google rating and review count.",
        cityRoute: "/best-barber",
        suburbRoute: "/barber",
        guideTitle: "How to find the best barber near you",
        guideIntro: "Picking the right barber comes down to two things — the cut you want and how busy your week is. For a sharp fade, look for a dedicated barber shop with strong recent Instagram fade work. For a longer scissor cut, a salon-trained barber will often deliver better. Walk-in versus booked is the other axis: walk-ins suit a quick refresh, bookings make sense for high-stakes cuts before weddings or interviews.",
        whatToDo: [
          "Type your suburb in the search above to find barbers around you",
          "Or pick a city or suburb below to browse the verified shortlist",
          "Read the most recent Google reviews — fade quality changes when senior staff move shops",
          "Check the shop's Instagram for fresh fade work in your style",
          "Confirm walk-in availability if you don't have time to book ahead",
        ],
        faq: [
          { q: "How much does a haircut cost at a barber in Australia?", a: "A standard men's cut typically runs $30-$55, a skin or detail fade $45-$70, and a hot-towel shave $40-$60. Senior barbers and gentleman's grooming shops charge $65-$90. Tipping is optional but appreciated for great work." },
          { q: "How often should men get a haircut?", a: "A skin fade needs a refresh every 2-3 weeks to keep the line tight. Standard scissor cuts hold their shape for 4-6 weeks. Beard trims usually pair with a haircut every visit." },
          { q: "What's the difference between a barber and a hairdresser?", a: "Barbers specialise in clipper-driven cuts — fades, tapers, beard trims and shaves. Hairdressers focus on cuts, colour, balayage and styling. Pick based on the cut you want, not just gender." },
          { q: "Do barbers take walk-ins?", a: "Many barbers take walk-ins, especially for standard cuts. Friday afternoon and Saturday morning are the busiest. Most shops post live queue updates on Google or Instagram so you can time it." },
          { q: "How do I find a good barber for a fade?", a: "Look for shops with consistent recent Instagram fade work in your style. Lifetime Google ratings hide stylist turnover — read the last 30 reviews and check fade work that's less than 3 months old." },
          { q: "Why are some barbers so expensive?", a: "Premium gentleman's barbers ($65-$90) include longer cut times, hot towel, beard work, and tonic finishes. Standard barbers ($30-$55) deliver the same haircut quality but skip the spa elements. Pick based on what you actually want from the visit." },
        ],
        scissorPlug: {
          text: "Top barbers in Australia put their scissors through 30+ cuts a week. ShearGenius supplies",
          linkText: "professional Japanese-steel barber scissors and lifetime sharpening",
          linkHref: "https://www.sheargenius.com.au/collections/barber-scissors",
        },
      }}
    />
  );
}
