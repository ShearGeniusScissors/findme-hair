import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "findme.hair — Australia's hair salon & barber directory",
  description:
    "Hand-verified hair salons and barber shops across Australia. Hair and barber only — no beauty, no nails, no spa. Just hair.",
  metadataBase: new URL("https://findme.hair"),
  openGraph: {
    title: "findme.hair",
    description: "Find your next haircut. Australian hair salon & barber directory.",
    url: "https://findme.hair",
    siteName: "findme.hair",
    locale: "en_AU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
