import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy Google Places API photo URLs.
 *
 * COST CONTROL — CRITICAL:
 * Google Places API photo references rotate (the `name` field has a TTL).
 * When a name is stale, Google returns 400 INVALID_ARGUMENT — but the call
 * is still billable. If we don't cache the failure at the edge, every page
 * render re-fires the billable upstream call.
 *
 * This route MUST:
 *   1. Send long cache-control on BOTH success AND failure responses, so the
 *      Vercel edge serves a stored response for repeated requests without
 *      re-invoking the function.
 *   2. Validate the name shape locally (free) before paying for an upstream call.
 *   3. Use force-cache on the upstream fetch so even on a cold edge, Next's
 *      data cache short-circuits the billable call where possible.
 *
 * Usage: <img src={`/api/photo?name=${name}&h=${800}`} />
 */
export const runtime = 'edge';
export const revalidate = 86400;

// Identical Cache-Control on the failure path is the key cost lever: at
// max-age=0 every repeat hit re-invokes the function AND re-bills Google.
const SHARED_CACHE = 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=2592000, immutable';

function cachedResponse(body: BodyInit | null, init: ResponseInit & { contentType?: string }): NextResponse {
  return new NextResponse(body, {
    ...init,
    headers: {
      'Content-Type': init.contentType ?? 'text/plain;charset=UTF-8',
      'Cache-Control': SHARED_CACHE,
      'X-Robots-Tag': 'noindex, nofollow',
      ...(init.headers ?? {}),
    },
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get('name');
  const h = url.searchParams.get('h') ?? '600';
  if (!name) return cachedResponse('missing name', { status: 400 });

  // Defence: only allow places-api photo names ("places/{place_id}/photos/{photo_id}").
  if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(name)) {
    return cachedResponse('invalid name', { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return cachedResponse('Google API key not configured', { status: 500 });

  const upstream = `https://places.googleapis.com/v1/${name}/media?maxHeightPx=${encodeURIComponent(h)}&key=${key}`;
  let r: Response;
  try {
    r = await fetch(upstream, { cache: 'force-cache' });
  } catch {
    // Network error — cache as 502 so repeated bursts don't re-fire.
    return cachedResponse('upstream error', { status: 502 });
  }

  if (!r.ok) {
    // CRITICAL: cache the failure response too. Stale Places photo references
    // 400 forever; without this, the same dead reference re-bills Google on
    // every visitor. 1 month s-maxage matches the success path.
    return cachedResponse(`upstream ${r.status}`, { status: r.status >= 500 ? 502 : 404 });
  }

  const body = await r.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': r.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': SHARED_CACHE,
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
