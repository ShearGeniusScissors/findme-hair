import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Engagement tracking endpoint (playbook Tactic 5). Receives sendBeacon
// POSTs from EngagementTracker and inserts into listing_events via the
// service role (the table has no public insert policy). No PII stored.
export const runtime = 'nodejs';

const ACTIONS = new Set(['view', 'call', 'website', 'book', 'directions', 'maps']);
const SOURCES = new Set(['profile', 'sticky', 'card', 'search']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  let body: { business_id?: string; action?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const { business_id, action, source } = body;
  if (!business_id || !UUID_RE.test(business_id) || !action || !ACTIONS.has(action)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  // Skip obvious bots — engagement stats should reflect humans.
  const ua = req.headers.get('user-agent') ?? '';
  if (/bot|crawler|spider|crawl|slurp|bingpreview|headless/i.test(ua)) {
    return new NextResponse(null, { status: 204 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  );
  // Fire-and-forget semantics: a failed insert must never break the client.
  await db.from('listing_events').insert({
    business_id,
    action,
    source: source && SOURCES.has(source) ? source : 'profile',
  });

  return new NextResponse(null, { status: 204 });
}
