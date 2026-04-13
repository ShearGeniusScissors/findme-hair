import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/api/', '/claim/'],
      },
    ],
    sitemap: 'https://www.findme.hair/sitemap.xml',
  };
}
