import { NextRequest, NextResponse } from 'next/server';

const INDEXNOW_KEY = 'ba738bf522e6697bad5cb03d868d141d';
const HOST = 'https://www.findme.hair';
const KEY_LOCATION = `${HOST}/${INDEXNOW_KEY}.txt`;

/**
 * POST /api/indexnow
 * Body: { urls: string[] }
 * Submits URLs to IndexNow (Bing, Yandex, etc.) for instant indexing.
 * Protected by a simple bearer token check (INDEXNOW_SECRET env var).
 */
export async function POST(req: NextRequest) {
  // Simple auth — set INDEXNOW_SECRET env var in Vercel
  const secret = process.env.INDEXNOW_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const body = await req.json();
  const urls: string[] = body.urls;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls array required' }, { status: 400 });
  }

  // IndexNow allows up to 10,000 URLs per submission
  const payload = {
    host: 'www.findme.hair',
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls.slice(0, 10000),
  };

  const resp = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  return NextResponse.json({
    submitted: urls.length,
    indexNowStatus: resp.status,
    indexNowBody: resp.status === 200 ? 'OK' : await resp.text(),
  });
}
