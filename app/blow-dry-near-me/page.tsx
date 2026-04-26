import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/blow-dry-near-me";
const title = `Blow Dry Near Me — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a blow dry near you in Australia. Verified salons offering wash-and-blow-dry, blowout styles, event hair and quick-finish blow-drys with real Google reviews.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/blow-dry-near-me",
      pageTitle: "Blow Dry Near Me",
      metaDescription: description,
      h1: "Blow Dry Near Me",
      hero: "Find a blow dry near you in Australia. Verified salons offering wash-and-blow-dry, sleek blowouts, voluminous bouncy blow-drys, and event-ready styling — ranked by Google rating and review count.",
      cityRoute: "/best-hairdresser",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find a great blow dry near you",
      guideIntro: "A blow dry is the fastest way to walk out of a salon looking like the best version of yourself. The right blow dry stylist matches the technique to your hair type — round-brush for volume on fine hair, paddle-brush for smoothing thick or curly hair, ionic dryers for shine. Always specify the style you want when booking.",
      whatToDo: [
        "Type your suburb above to find blow dry salons nearby",
        "Or pick a city below to browse the verified shortlist",
        "Bring a photo of the style you want — sleek, voluminous, beachy, or curly",
        "Allow 30-45 minutes for a standard blow dry; 60-75 for elaborate styling",
        "For events, book the blow dry as close to the event start as possible",
      ],
      faq: [
        { q: "How much does a blow dry cost in Australia?", a: "A standard wash and blow dry runs $50-$90 in capital cities and $40-$70 regionally. Add $15-$30 for elaborate styling (curls, updos, twists). Premium salons in major cities charge $90-$150 for senior-stylist blow drys." },
        { q: "How long does a blow dry last?", a: "On clean hair with the right product, a quality blow dry lasts 2-4 days. Sleeping on a silk pillowcase, dry shampoo between days, and avoiding humidity all help extend it. Coloured or chemically straightened hair typically holds a blow dry longer." },
        { q: "What's the difference between a blow dry and a blowout?", a: "Blowout is the American term for what Australians call a blow dry — same technique, same result. Some Australian salons use 'blowout' to mean a more elaborate styled finish (more volume, more shape) versus a basic dry-and-go." },
        { q: "Can I get a same-day blow dry?", a: "Most salons take same-day blow dry bookings, especially weekday mornings. Friday afternoon and Saturday morning are the busiest. Many salons advertise 'express blow dry' slots that take 25-30 minutes for last-minute walk-ins." },
        { q: "Do I need to wash my hair before a blow dry appointment?", a: "No — most blow dry services include the wash. Some quick-finish or budget options assume you arrive with washed, towel-dried hair. Confirm at booking." },
      ],
      scissorPlug: { text: "Top blow-dry stylists in Australia keep their scissors sharp between washes. ShearGenius supplies", linkText: "Japanese-steel hairdressing scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
