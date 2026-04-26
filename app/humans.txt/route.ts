// Serves /humans.txt — small E-E-A-T signal documenting the team behind the site.
export const dynamic = 'force-static';
export const revalidate = 86400;

const TEXT = `/* TEAM */
Founder: Matt Grumley
Role: Hair industry veteran (35+ years) and Scissorsmith. Built findme.hair as a sister project to ShearGenius (premium scissors + sharpening, founded 2007).
Twitter: —
Site: https://www.findme.hair
From: Australia

/* SITE */
Last update: 2026
Standards: HTML5, CSS3, JSON-LD
Components: Next.js 16, Supabase, Vercel
Software: Next.js, TypeScript, Supabase, Tailwind CSS

/* THANKS */
The 13,000+ Australian hair salons and barber shops who let us list them, and the salon owners who claim and update their listings to keep the directory current.

/* SCOPE */
Hair only. No beauty, no nails, no lashes, no spa. One building, one listing.
`;

export async function GET() {
  return new Response(TEXT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
