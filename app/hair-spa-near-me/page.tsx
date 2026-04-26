import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/hair-spa-near-me";
const title = `Hair Spa Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a hair spa near you in Australia. Verified salons offering hair spa treatments, scalp massage, deep conditioning, keratin and Olaplex bond-building with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/hair-spa-near-me",
      pageTitle: "Hair Spa Near Me",
      metaDescription: description,
      h1: "Hair Spa Near Me",
      hero: "Find a hair spa near you in Australia. Verified salons offering hair spa treatments — scalp massage, deep conditioning, keratin, Olaplex bond-building, and Japanese head-spa style services. Ranked by Google rating and review count.",
      cityRoute: "/best-hairdresser",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find a hair spa near you",
      guideIntro: "A hair spa treatment goes beyond a wash and blow-dry — it includes a longer scalp massage, deep conditioning mask, often keratin or bond-building treatment, and a styled finish. Japanese head-spa services include extended pressure-point scalp work. Premium hair spas can run 90 minutes and feel more like a wellness service than a haircut.",
      whatToDo: [
        "Type your suburb above to find hair spa salons nearby",
        "Or pick a city below to browse the verified shortlist",
        "Specify the hair concern at booking — dry ends, scalp tension, color damage all need different treatments",
        "Allow 60-90 minutes for a quality hair spa session",
        "For maximum benefit, schedule monthly rather than as a one-off",
      ],
      faq: [
        { q: "What is a hair spa treatment?", a: "A hair spa is an extended salon service that combines wash + scalp massage + deep conditioning mask + bond-building treatment + styled finish. Japanese head-spa adds extended pressure-point scalp work. Sessions run 60-90 minutes." },
        { q: "How much does a hair spa cost in Australia?", a: "A standard hair spa runs $80-$150 in capital cities. Japanese head-spa or premium scalp-treatment specialists charge $150-$300. Prices include all products and the styled finish." },
        { q: "What's the difference between a hair spa and a regular salon visit?", a: "A regular salon visit is task-focused — cut, colour, blow-dry. A hair spa is wellness-focused — extended massage, deep conditioning, longer time at the basin. Some clients book hair spa monthly between cut/colour appointments to maintain hair health." },
        { q: "Are hair spas worth it?", a: "For dry, damaged, color-treated or stressed hair, yes — the cumulative effect of monthly hair spa visits over a year is often more visible than a single high-end colour service. For low-maintenance hair, occasional treatments are enough." },
        { q: "Where can I find Japanese head-spa near me?", a: "Japanese head-spa specialists cluster in major Australian cities — Sydney's Strathfield and Eastwood, Melbourne's Box Hill and Glen Waverley, Brisbane's Sunnybank. Use the city or suburb search above to see Japanese hairdressers, many of whom offer head-spa." },
      ],
      scissorPlug: { text: "Premium hair spa salons need scissors maintained to salon-spa standard. ShearGenius supplies", linkText: "Japanese-steel hairdressing scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
