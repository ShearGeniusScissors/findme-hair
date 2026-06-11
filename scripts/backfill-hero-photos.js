#!/usr/bin/env node
/**
 * backfill-hero-photos.js — 2026-06-11
 *
 * Cost-capped Google Places photo backfill: ONE hero photo per business,
 * downloaded once into the public `business-media` bucket, then served
 * forever from Supabase storage with zero recurring Google billing.
 * This is the permanent fix for the May 2026 cost incident — we never
 * again serve rotating Google photo references at render time.
 *
 * Per business: 1× Place Details (photos field only) + 1× Photo media
 * download. Both are billable SKUs — that's why --limit is REQUIRED and
 * there is no "all" default. Pilot = --limit 20 (cents). The full run
 * (~11.9k businesses) is an explicit Matt-approved operation.
 *
 * Usage:
 *   node scripts/backfill-hero-photos.js --limit 20 [--dry-run]
 *
 * Selection: active businesses with google_place_id, empty google_photos,
 * highest google_review_count first (most-viewed pages get photos first).
 * Skips anything the restore script already covered (google_photos set).
 * Idempotent: re-running picks up where it left off.
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!SUPABASE_URL || !SERVICE_KEY || !PLACES_KEY) {
  console.error('Missing env (SUPABASE url/service key or GOOGLE_PLACES_API_KEY)');
  process.exit(1);
}

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : NaN;
const DRY = args.includes('--dry-run');
if (!Number.isFinite(LIMIT) || LIMIT < 1) {
  console.error('A --limit N is required (no default — every row costs real money).');
  process.exit(1);
}

const BUCKET = 'business-media';
const sb = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function pickBusinesses() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/businesses` +
      `?status=eq.active&google_place_id=not.is.null&google_photos=is.null` +
      `&select=id,slug,name,google_place_id,google_review_count` +
      `&order=google_review_count.desc.nullslast&limit=${LIMIT}`,
    { headers: sb }
  );
  if (!res.ok) throw new Error(`select failed ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchHeroPhotoRef(placeId) {
  // Place Details (New), photos field only — Essentials-IDs-only SKU band.
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: { 'X-Goog-Api-Key': PLACES_KEY, 'X-Goog-FieldMask': 'photos' },
  });
  if (!res.ok) return { error: `details ${res.status}` };
  const json = await res.json();
  const photo = json.photos?.[0];
  return photo ? { name: photo.name } : { error: 'no photos' };
}

async function downloadPhoto(photoName) {
  // Photo media endpoint — returns the image bytes (skipHttpRedirect=false
  // would 302; we follow redirects so we get bytes directly).
  const res = await fetch(
    `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=900&key=${PLACES_KEY}`,
    { redirect: 'follow' }
  );
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function uploadAndLink(biz, buf) {
  const objPath = `${biz.google_place_id}/0.jpg`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objPath}`, {
    method: 'POST',
    headers: { ...sb, 'content-type': 'image/jpeg', 'x-upsert': 'true' },
    body: buf,
  });
  if (!up.ok) throw new Error(`upload ${objPath} failed ${up.status}: ${await up.text()}`);
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objPath}`;
  const patch = await fetch(`${SUPABASE_URL}/rest/v1/businesses?id=eq.${biz.id}`, {
    method: 'PATCH',
    headers: { ...sb, 'content-type': 'application/json' },
    body: JSON.stringify({ google_photos: [{ url }] }),
  });
  if (!patch.ok) throw new Error(`patch ${biz.slug} failed ${patch.status}`);
  return url;
}

(async () => {
  const businesses = await pickBusinesses();
  console.log(`Selected ${businesses.length} businesses (cap ${LIMIT})${DRY ? ' [DRY RUN]' : ''}.`);

  let ok = 0, noPhoto = 0, failed = 0;
  const results = [];
  for (const biz of businesses) {
    if (DRY) { console.log(`  would fetch: ${biz.slug} (${biz.google_review_count ?? 0} reviews)`); continue; }
    try {
      const ref = await fetchHeroPhotoRef(biz.google_place_id);
      if (ref.error) { noPhoto++; results.push({ slug: biz.slug, status: ref.error }); continue; }
      const buf = await downloadPhoto(ref.name);
      if (!buf) { failed++; results.push({ slug: biz.slug, status: 'download failed' }); continue; }
      const url = await uploadAndLink(biz, buf);
      ok++;
      results.push({ slug: biz.slug, status: 'ok', url });
      console.log(`  ✓ ${biz.slug} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      failed++;
      results.push({ slug: biz.slug, status: String(e.message || e) });
    }
  }

  console.log(`\nDone. ok=${ok} noPhoto=${noPhoto} failed=${failed}`);
  if (!DRY) {
    fs.writeFileSync(
      path.join(__dirname, 'backfill-hero-photos.result.json'),
      JSON.stringify({ ranAt: new Date().toISOString(), limit: LIMIT, ok, noPhoto, failed, results }, null, 2)
    );
  }
})().catch((e) => { console.error(e); process.exit(1); });
