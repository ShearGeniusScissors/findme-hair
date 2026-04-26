import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/korean-hair-salon-near-me";
const title = `Korean Hair Salon Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a Korean hair salon near you in Australia. Verified specialists for magic straightening, straight perm, root retouch and Korean layered cuts with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/korean-hair-salon-near-me",
      pageTitle: "Korean Hair Salon Near Me",
      metaDescription: description,
      h1: "Korean Hair Salon Near Me",
      hero: "Find a Korean hair salon near you in Australia. Verified specialists for magic straightening, straight perm, root retouch and the soft, layered cuts popularised by K-drama and K-pop — ranked by Google rating and review count.",
      cityRoute: "/korean-hair-salon",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find a Korean hair salon near you",
      guideIntro: "Korean hair specialists in Australia typically use Japanese or Korean ionic clamps, lower-pH straightening systems, and a layered cutting approach that frames the face. Book a Korean salon when you want magic straight, healthy straight perm, root retouch, or a Korean-style layered cut that local Anglo-trained stylists rarely specialise in.",
      whatToDo: [
        "Type your suburb above to find Korean hair salons nearby",
        "Or pick a city below to browse the verified shortlist",
        "For magic straightening, ask how many they do per week — high volume = experience",
        "Check the brand of straightener used (lower-pH systems are kinder to fine hair)",
        "Korean-language service available if you prefer it — many Australian Korean salons offer both",
      ],
      faq: [
        { q: "How much does Korean magic straightening cost in Australia?", a: "Magic straightening typically runs $200-$450 depending on hair length and condition. Korean salons often quote a base price plus an extra fee for very long or thick hair. Always confirm pricing with a strand test before committing." },
        { q: "How long does Korean straight perm last?", a: "A well-applied Korean magic straightening or straight perm lasts 4-6 months on the treated hair. Roots will need a touch-up every 4-5 months, but the previously straightened lengths stay smooth." },
        { q: "What's the difference between magic straightening and Japanese straightening?", a: "Magic straightening (Korean) uses a lower-pH chemical system with ionic clamping. Japanese straightening (yuko) uses higher-pH cysteamine. Both deliver permanently straight hair, but magic straightening is gentler on fine or previously coloured hair." },
        { q: "Do Korean salons in Australia also do colour?", a: "Yes — most Korean hair salons offer balayage, ash tones, and the soft brown shades popular in K-beauty. Discuss colour history and any past straightening when you book, since chemically treated hair needs gentler colour." },
        { q: "Where can I find a Korean hair salon near me?", a: "Korean hair salons cluster in major Australian cities — Sydney's Strathfield and Eastwood, Melbourne's Box Hill and Glen Waverley, Brisbane's Sunnybank. Use the city or suburb search above to see the verified shortlist." },
      ],
      scissorPlug: { text: "Korean stylists rely on precision Japanese-steel scissors for soft layering and chip-cutting. ShearGenius supplies", linkText: "Hitachi ATS-314 Japanese steel scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
