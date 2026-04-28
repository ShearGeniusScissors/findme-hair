import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/cheap-haircut-near-me";
const title = `Cheap Haircut Near Me ${new Date().getFullYear()} | findme.hair`;
const description = "Find a cheap haircut near you in Australia. Affordable hairdressers, barbers and salons in every major city and suburb — student cuts, men's clipper cuts, blow-dries from $20.";

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
        routePath: "/cheap-haircut-near-me",
        pageTitle: "Cheap Haircut Near Me",
        metaDescription: description,
        h1: "Cheap Haircut Near Me",
        hero: "Find a cheap haircut near you in Australia. Verified hairdressers and barbers offering affordable cuts, student rates, men's clipper cuts and quick blow-dries — without sacrificing quality. Browse by city or suburb below.",
        cityRoute: "/best-hairdresser",
        suburbRoute: "/hairdresser",
        guideTitle: "How to find a cheap haircut near you, without regret",
        guideIntro: "Cheap doesn't mean bad. The best-value haircuts in Australia come from junior stylists at top salons (the senior stylist trained them), apprentice nights, and TAFE student clinics. Avoid mall chains where staff turnover destroys quality. Use the suburb search to find local options, then read recent reviews to filter for the ones that punch above their price.",
        whatToDo: [
          "Type your suburb in the search above to find affordable salons and barbers nearby",
          "Look for 'junior stylist', 'apprentice night', or 'TAFE clinic' deals at established salons",
          "Read the latest reviews — cheap salons with consistent good reviews are the gold",
          "Avoid chains where reviews mention rushed cuts or rotating staff",
          "Standard men's cuts run $25-$40, women's cuts $40-$70 at the cheap end of quality",
        ],
        faq: [
          { q: "What's the cheapest haircut in Australia?", a: "TAFE hairdressing student clinics and apprentice nights at salons are the cheapest — typically $15-$30 for a cut. The cut takes longer (the student is learning) but is supervised by a qualified senior stylist. Mall chain barbers are similarly cheap at $20-$30." },
          { q: "Are cheap haircuts worth it?", a: "It depends. Junior stylists at established salons consistently deliver good cuts at lower prices because they're trained by senior staff. Mall chains and walk-in cheap barbers can be hit-or-miss because of staff turnover. Read recent reviews carefully." },
          { q: "How much should a cheap haircut cost in Australia?", a: "A cheap men's cut runs $20-$35 (mall barber, walk-in, apprentice). A cheap women's cut runs $35-$60 (junior stylist, TAFE clinic). Anything below $20 is usually a sign of corner-cutting on hygiene or quality." },
          { q: "Do junior stylists give cheap haircuts?", a: "Yes — many established salons have junior stylist pricing that's $20-$40 cheaper than senior pricing. The cut is still done at a quality salon with senior supervision. Ask about junior stylist availability when booking." },
          { q: "Where can I get a cheap haircut as a student?", a: "TAFE hairdressing clinics offer the cheapest cuts in Australia (student rates), supervised by qualified instructors. Many salons also offer student discounts on weekdays. Use the search above to find salons in your suburb that may run student deals." },
        ],
        scissorPlug: {
          text: "Even at cheap prices, your stylist's tools matter. ShearGenius supplies",
          linkText: "professional Japanese-steel scissors with Australia-wide mail-in sharpening for salons across Australia",
          linkHref: "https://www.sheargenius.com.au/collections/hair-scissors",
        },
      }}
    />
  );
}
