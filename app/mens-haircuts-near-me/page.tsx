import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/mens-haircuts-near-me";
const title = `Men's Haircuts Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find men's haircuts near you in Australia. Verified barbers and men's stylists for skin fades, scissor cuts, beard trims and gentleman's grooming with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/mens-haircuts-near-me",
      pageTitle: "Men's Haircuts Near Me",
      metaDescription: description,
      h1: "Men's Haircuts Near Me",
      hero: "Find men's haircuts near you in Australia. Verified barbers and men's stylists for skin fades, taper fades, scissor cuts, beard trims, hot-towel shaves and gentleman's grooming — ranked by Google rating and review count.",
      cityRoute: "/mens-haircut",
      suburbRoute: "/barber",
      guideTitle: "How to find a great men's haircut near you",
      guideIntro: "Choosing the right barber comes down to two things — the cut you want and how busy your week is. For sharp fades, dedicated barber shops with strong recent Instagram fade work. For longer scissor cuts, a salon barber or unisex stylist often delivers a sharper result. Walk-ins suit refresh cuts; bookings make sense before weddings or interviews.",
      whatToDo: [
        "Type your suburb above to find men's haircut shops nearby",
        "Or pick a city below to browse the verified shortlist",
        "For fades — pick a dedicated barber. For longer cuts and styling — pick a salon barber.",
        "Read recent reviews. Lifetime ratings hide stylist turnover.",
        "Check Instagram for fresh work in your style before committing for a high-stakes cut.",
      ],
      faq: [
        { q: "How much is a men's haircut in Australia?", a: "A standard men's cut typically runs $30-$55, a skin or detail fade $45-$70, and a hot-towel shave $40-$60. Senior barbers and gentleman's grooming shops charge $65-$90. Tipping is optional but appreciated for great work." },
        { q: "How often should men get a haircut?", a: "A skin fade needs a refresh every 2-3 weeks to keep the line tight. Standard scissor cuts hold their shape for 4-6 weeks. Beard trims usually pair with a haircut every visit." },
        { q: "What's the difference between a barber and a men's hairdresser?", a: "Barbers specialise in clipper-driven cuts — fades, tapers, beard work and shaves. Men's hairdressers in unisex salons focus more on longer scissor cuts, colour and styling. Pick based on the cut, not the venue." },
        { q: "Where can I find a men's haircut open near me right now?", a: "Type your suburb above to find barbers and men's stylists nearby. Most shops post live opening hours on Google. Friday afternoon and Saturday morning are the busiest." },
        { q: "What's a good men's haircut for thinning hair?", a: "Short scissor cuts with light texture mask thinning better than fades, which expose the scalp. A senior barber can recommend a cut suited to your hair density at consultation." },
      ],
      scissorPlug: { text: "Top barbers and men's stylists put their scissors through 30+ cuts a week. ShearGenius supplies", linkText: "professional Japanese-steel barber scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/barber-scissors" },
    }} />
  );
}
