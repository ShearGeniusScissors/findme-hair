import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force canonical host to https://www.findme.hair so the site doesn't serve
  // duplicate content on https://findme.hair (no www) or http://www.findme.hair.
  // Vercel sets x-forwarded-proto and Next sees the host header.
  async redirects() {
    return [
      // Strip the no-www variant — point everything at www.findme.hair
      {
        source: "/:path*",
        has: [{ type: "host", value: "findme.hair" }],
        destination: "https://www.findme.hair/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
