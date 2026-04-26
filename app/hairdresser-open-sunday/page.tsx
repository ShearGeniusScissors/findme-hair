import type { Metadata } from "next";
import NearMePage from "@/components/NearMePage";

export const revalidate = 86400;

const path = "https://www.findme.hair/hairdresser-open-sunday";
const title = `Hairdresser Open Sunday — Australia ${new Date().getFullYear()} | findme.hair`;
const description = "Find a hairdresser open Sunday near you in Australia. Verified salons and barbers with Sunday opening hours — same-day cuts, walk-ins, and weekend appointments.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: path, languages: { "en-AU": path, "x-default": path } },
  openGraph: { title, description, url: path, siteName: "findme.hair", locale: "en_AU", type: "website",
    images: [{ url: "https://www.findme.hair/og-image.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <NearMePage content={{
      routePath: "/hairdresser-open-sunday",
      pageTitle: "Hairdresser Open Sunday",
      metaDescription: description,
      h1: "Hairdresser Open Sunday",
      hero: "Find a hairdresser open Sunday near you in Australia. Verified salons and barbers with Sunday opening hours — type your suburb to see live Google opening hours, then call ahead to confirm walk-in availability.",
      cityRoute: "/best-hairdresser",
      suburbRoute: "/hairdresser",
      guideTitle: "How to find a hairdresser open on Sunday",
      guideIntro: "Most major-city Australian hair salons keep at least limited Sunday hours, especially salons in shopping precincts. Regional salons often close Sundays. The fastest way to find a Sunday-open salon is to type your suburb above, click through to listings, and check live Google opening hours — findme.hair pulls these hourly.",
      whatToDo: [
        "Type your suburb above to find salons nearby",
        "Click through to a listing and check Sunday opening hours on the Details card",
        "Sunday hours typically run shorter — 10am-4pm rather than weekday 9am-5pm",
        "Call ahead to confirm walk-in availability — many Sundays-open salons book up early",
        "Shopping centre salons are most likely to be open Sundays; standalone salons less so",
      ],
      faq: [
        { q: "Are most Australian hair salons open Sunday?", a: "Major-city salons in shopping precincts usually open Sundays with limited hours (typically 10am-4pm). Standalone salons in residential suburbs and regional salons often close Sundays. Premium senior-stylist salons typically close Mondays-Sundays for stylist rest days." },
        { q: "Can I get a haircut on Sunday in Australia?", a: "Yes — but plan ahead. Sunday is a popular day for cuts because clients have free time, so booking ahead increases the odds of getting your preferred stylist. Walk-in barbers often have shorter Sunday queues than Saturdays." },
        { q: "Why do hair salons close on Sundays?", a: "Most independent salons close one day a week (Sunday or Monday) so stylists can rest — hair work is physical and standing all week takes a toll. Shopping centre salons stay open more days because rent is calculated against trading hours." },
        { q: "How do I find Sunday hairdressers near me?", a: "Use the search above. Then check each listing's live Google opening hours for the current day. The Details card on every salon profile shows current opening status." },
        { q: "What time do Sunday hairdressers usually close?", a: "Most close 4-5pm Sundays, earlier than weekday 6pm closes. Last booking is usually 1-2 hours before close, so call by mid-afternoon for same-day Sunday service." },
      ],
      scissorPlug: { text: "Salons running 7-day weeks need scissors that hold their edge through high-volume rosters. ShearGenius supplies", linkText: "Japanese-steel scissors and Australia-wide mail-in sharpening", linkHref: "https://www.sheargenius.com.au/collections/hair-scissors" },
    }} />
  );
}
