import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/womens-haircut-near-me";
const title = `Women's Haircuts Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find women's haircuts near you in Australia. Verified salons and stylists for cuts, blow-dries, layers, fringes, lob and pixie styles with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/womens-haircut-near-me",
      pageTitle: "Women's Haircuts Near Me",
      metaDescription: description,
      h1: "Women's Haircuts Near Me",
      hero: "Find women's haircuts near you in Australia. Verified hairdressers and salons for cuts, blow-dries, layered styles, fringes, lobs, pixies and grow-out repair — ranked by Google rating and review count.",
      cityRoute: "/best-hairdresser",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find a great women's haircut near you",
      guideIntro: "The right women's haircut starts with the right consultation. Top stylists spend 5-10 minutes before lifting scissors discussing face shape, lifestyle, styling time, and reference photos. Avoid salons that skip consultation — they're operating like a quick-cut shop, not a salon.",
      whatToDo: [
        "Type your suburb above to find hairdressers nearby",
        "Or pick a city below to browse the verified shortlist",
        "Bring at least 3 reference photos in different lighting",
        "For lob, pixie or major cut changes — book a senior stylist with photographic evidence in your style",
        "Discuss styling time honestly — the cut should suit your daily 5-minute routine, not the stylist's blow-dry",
      ],
      faq: [
        { q: "How much does a women's haircut cost in Australia?", a: "A standard women's cut typically runs $60-$120, blow-dries $50-$90. Senior stylists charge $120-$200 for a precision cut. Add $30-$50 for a fringe trim if booked separately. Pixie or lob cuts at top salons run $150-$250." },
        { q: "How often should women get a haircut?", a: "For most cuts, every 6-10 weeks keeps the shape sharp. Pixie cuts and short bobs need 3-5 week trims. Long-hair clients can stretch to 12 weeks if the ends are well-conditioned. Colour clients usually book around the cut to consolidate visits." },
        { q: "What women's haircuts are trending in Australia?", a: "Lived-in lobs, soft layered shags, butterfly haircuts, and curtain bangs dominated 2025-26. Australian summer drives demand for shorter styles and fringe trims that survive humidity. Senior stylists track trends but the right cut is the one that suits your hair type, not the trend." },
        { q: "How do I find a women's haircut open near me right now?", a: "Type your suburb above. Then check Google for live opening hours. Walk-ins are common at quick-cut salons but uncommon at senior-stylist salons — call ahead for major changes." },
        { q: "Should I get my haircut done at a hairdresser or a barber?", a: "If you want a fade, a barber. Anything longer than a pixie, a hairdresser. Some women regularly use barbers for short pixies and fades — both venues work, the cut matters more than the gendered label." },
      ],
      scissorPlug: { text: "Top hairdressers in Australia put their scissors through hundreds of cuts a year. ShearGenius supplies", linkText: "Japanese-steel hairdressing scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
