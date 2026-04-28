import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy Google Places API photo URLs.
 *
 * Why: previously every salon profile inlined the raw places.googleapis.com
 * URL into its `<img src>`. Site-Audit crawlers (Ahrefs in particular) follow
 * those URLs as if they were pages, which inflates the audit's URL count by
 * ~13k third-party CDN URLs per crawl. Routing through this `/api/photo`
 * proxy hides the upstream URL behind a path that's blocked by robots.txt
 * (`Disallow: /api/`).
 *
 * Usage: <img src={`/api/photo?name=${name}&h=${800}`} />
 */
export const runtime = 'edge';
export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get('name');
  const h = url.searchParams.get('h') ?? '600';
  if (!name) return new NextResponse('missing name', { status: 400 });

  // Defence: only allow places-api photo names ("places/{place_id}/photos/{photo_id}").
  if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)) {
    return new NextResponse('invalid name', { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return new NextResponse('not configured', { status: 500 });

  const upstream = `https://places.googleapis.com/v1/${name}/media?maxHeightPx=${encodeURIComponent(h)}&key=${key}`;
  const r = await fetch(upstream, { cache: 'force-cache' });
  if (!r.ok) {
    return new NextResponse(`upstream ${r.status}`, { status: r.status });
  }

  const body = await r.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': r.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000, immutable',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
