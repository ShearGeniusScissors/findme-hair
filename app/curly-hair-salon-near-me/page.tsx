import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/curly-hair-salon-near-me";
const title = `Curly Hair Salon Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a curly hair salon near you in Australia. Verified specialists for Rezo cut, DevaCut, dry cutting and curly colour work with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/curly-hair-salon-near-me",
      pageTitle: "Curly Hair Salon Near Me",
      metaDescription: description,
      h1: "Curly Hair Salon Near Me",
      hero: "Find a curly hair salon near you in Australia. Verified curly cutters using Rezo cut, DevaCut and dry-cutting techniques — ranked by Google rating and review count. Curl by curl, on dry styled hair, the way curls actually behave.",
      cityRoute: "/curly-hair-specialist",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find a curly hair salon near you",
      guideIntro: "Most generalist hairdressers cut curls wet, which removes weight you need and creates a triangle shape when the hair dries. A trained curly specialist cuts dry, curl by curl, often using the Rezo or DevaCut method. They also understand low-poo washing, the curly girl method, and how to gloss curls without weighing them down.",
      whatToDo: [
        "Type your suburb above to find curly hair specialists nearby",
        "Or pick a city below to browse the verified shortlist",
        "Confirm dry-cutting technique — they should cut on dry, styled curls (not wet)",
        "Method match — Rezo, DevaCut, or freehand curly — pick what suits your curl pattern",
        "Read reviews from curly clients specifically, not just regular salon reviews",
      ],
      faq: [
        { q: "How much does a curly cut cost in Australia?", a: "A dedicated curly cut typically runs $120-$220, more than a standard cut because the technique takes 60-90 minutes. Many curly specialists include a tutorial on washing, plopping and product application." },
        { q: "What's the difference between a Rezo cut and a DevaCut?", a: "DevaCut cuts each curl individually with the hair styled and dry. Rezo cut focuses on volume and weight balance, often combining wet and dry techniques. Most curly specialists are trained in both and choose based on your curl pattern." },
        { q: "Can curly specialists also colour curly hair?", a: "Yes — curly colour specialists use balayage and gloss techniques designed for curls, applying colour to the curl pattern rather than mid-shaft saturation. Always discuss colour history because curls are more porous than straight hair." },
        { q: "How often should I get a curly cut?", a: "Curly clients usually return every 3-6 months. Curls grow in different patterns, so it doesn't follow the typical 6-week cycle. Listen to your hair — when the shape feels off or weight is uneven, book in." },
        { q: "Where can I find a curly specialist near me?", a: "Curly specialists cluster in inner-city suburbs of major Australian cities. Use the city or suburb search above to see the verified shortlist, all ranked by Google rating and review count." },
      ],
      scissorPlug: { text: "Curly cutters need scissors that hold a fine edge for chip and slide cutting on dry hair. ShearGenius supplies", linkText: "Japanese Hitachi ATS-314 scissors with Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
