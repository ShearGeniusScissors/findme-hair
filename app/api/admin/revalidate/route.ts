import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { slugify } from '@/lib/geo';

/**
 * POST /api/admin/revalidate
 *
 * Manually or via Supabase webhook, flush the ISR cache for a salon and the
 * pivot pages that index it. Caller supplies either an explicit `path` /
 * `slug`, OR a Supabase webhook payload (the trigger we install on the
 * `businesses` table sends those automatically on INSERT/UPDATE/DELETE).
 *
 * Auth: shared-secret in `REVALIDATE_SECRET` env var. We accept it via either:
 *   - `Authorization: Bearer <secret>` (matches /api/indexnow style), or
 *   - `x-revalidate-secret: <secret>` (Supabase webhook custom-header form).
 * Comparison is constant-time. A shared secret is enough here because the
 * endpoint is idempotent (revalidating an already-fresh page is a no-op) and
 * the secret is stored in Vercel env, never client-side.
 *
 * Body shapes:
 *   Manual:   { slug?: string, path?: string, state?: string, suburb?: string }
 *   Webhook:  { type: "INSERT"|"UPDATE"|"DELETE", table: "businesses",
 *               record: { slug, state, suburb, ... }, old_record?: {...} }
 */

type SupabasePayload = {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  record?: { slug?: string; state?: string; suburb?: string } | null;
  old_record?: { slug?: string; state?: string; suburb?: string } | null;
  slug?: string;
  path?: string;
  state?: string;
  suburb?: string;
};

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function authorised(req: NextRequest, secret: string): boolean {
  const bearer = req.headers.get('authorization');
  if (bearer?.startsWith('Bearer ') && safeEq(bearer.slice(7), secret)) return true;
  const headerSecret = req.headers.get('x-revalidate-secret');
  if (headerSecret && safeEq(headerSecret, secret)) return true;
  return false;
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET not configured' }, { status: 500 });
  }
  if (!authorised(req, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SupabasePayload;
  try {
    body = (await req.json()) as SupabasePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Resolve slug + state + suburb from whichever payload shape we got.
  const row = body.record ?? body.old_record ?? null;
  const slug = body.slug ?? row?.slug ?? null;
  const state = (body.state ?? row?.state ?? '').toString().toLowerCase();
  const suburb = body.suburb ?? row?.suburb ?? null;
  const explicitPath = body.path ?? null;

  const paths = new Set<string>();
  if (explicitPath) paths.add(explicitPath);
  if (slug) paths.add(`/salon/${slug}`);
  // State index page (e.g. /vic) is the parent of every salon in that state.
  if (state) paths.add(`/${state}`);
  // Suburb pivot pages — multiple service variants live under suburb-slug routes.
  if (suburb) {
    const s = slugify(suburb);
    paths.add(`/hairdresser/${s}`);
    paths.add(`/hair-salon/${s}`);
    paths.add(`/barber/${s}`);
  }

  if (paths.size === 0) {
    return NextResponse.json(
      { error: 'No revalidation target — supply { path } or { slug } or a Supabase webhook payload' },
      { status: 400 },
    );
  }

  const revalidated: string[] = [];
  const errors: Array<{ path: string; error: string }> = [];
  for (const p of paths) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch (e) {
      errors.push({ path: p, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    revalidated,
    errors,
    type: body.type ?? 'manual',
  });
}
