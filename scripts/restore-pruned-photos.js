#!/usr/bin/env node
/**
 * restore-pruned-photos.js — 2026-06-11
 *
 * Restores salon photos for the businesses whose files SURVIVED the May 2026
 * Google-cost emergency. Background:
 *   - 2026-04-20: a partial backfill downloaded 611 photo files (125 place_ids)
 *     into the `business-photos` bucket, then stopped.
 *   - 2026-05-13: "STOP THE GOOGLE BLEED" — businesses.google_photos was pruned
 *     to google_photos_pruned_2026_05_13 and business-photos was made PRIVATE
 *     (audit finding 4ad5ca94), so even the 611 surviving files went dark.
 *
 * This script:
 *   1. Lists every object in the private `business-photos` bucket.
 *   2. Copies each file into the PUBLIC `business-media` bucket (same path),
 *      preserving the audit decision to keep business-photos private.
 *   3. For each active business whose google_place_id matches a stored prefix,
 *      sets google_photos = ordered [{url}] entries pointing at business-media.
 *
 * It does NOT touch the other ~11.9k pruned rows — their storage URLs were
 * never backed by files and would render as broken images. Those need the
 * billable backfill pipeline (separate script, needs Matt's yes).
 *
 * Zero Google API calls. Zero recurring cost. Idempotent (upsert copy + update).
 */

const fs = require('fs');
const path = require('path');

// Minimal .env.local loader — no dotenv dependency needed.
const envPath = path.join(__dirname, '..', '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const SRC_BUCKET = 'business-photos';   // private — leave it that way
const DST_BUCKET = 'business-media';    // public
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function api(pathname, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
  });
  return res;
}

// ── 1. List every object in business-photos (folders = place_ids) ──────────
async function listAll() {
  // Storage list API is per-prefix; list root folders first, then files.
  const folders = [];
  let offset = 0;
  for (;;) {
    const res = await api(`/storage/v1/object/list/${SRC_BUCKET}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 1000, offset }),
    });
    if (!res.ok) throw new Error(`list root failed ${res.status}: ${await res.text()}`);
    const rows = await res.json();
    folders.push(...rows.filter((r) => r.id === null).map((r) => r.name));
    if (rows.length < 1000) break;
    offset += 1000;
  }

  const files = {}; // place_id -> sorted file names
  for (const folder of folders) {
    const res = await api(`/storage/v1/object/list/${SRC_BUCKET}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prefix: folder, limit: 100 }),
    });
    if (!res.ok) throw new Error(`list ${folder} failed ${res.status}`);
    const rows = await res.json();
    files[folder] = rows
      .filter((r) => r.id !== null)
      .map((r) => r.name)
      .sort((a, b) => parseInt(a) - parseInt(b)); // 0.jpg, 1.jpg, ...
  }
  return files;
}

// ── 2. Copy file private bucket → public bucket (download + upload) ────────
async function copyObject(objPath) {
  const dl = await api(`/storage/v1/object/${SRC_BUCKET}/${objPath}`);
  if (!dl.ok) throw new Error(`download ${objPath} failed ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  const ct = dl.headers.get('content-type') || 'image/jpeg';
  const up = await api(`/storage/v1/object/${DST_BUCKET}/${objPath}`, {
    method: 'POST',
    headers: { 'content-type': ct, 'x-upsert': 'true' },
    body: buf,
  });
  if (!up.ok) throw new Error(`upload ${objPath} failed ${up.status}: ${await up.text()}`);
  return buf.length;
}

// ── 3. Update businesses.google_photos for matched active rows ─────────────
async function updateBusiness(placeId, fileNames) {
  const photos = fileNames.map((f) => ({
    url: `${SUPABASE_URL}/storage/v1/object/public/${DST_BUCKET}/${placeId}/${f}`,
  }));
  const res = await api(
    `/rest/v1/businesses?google_place_id=eq.${encodeURIComponent(placeId)}&status=in.(active,unverified)&select=id,slug`,
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ google_photos: photos }),
    }
  );
  if (!res.ok) throw new Error(`update ${placeId} failed ${res.status}: ${await res.text()}`);
  return res.json();
}

(async () => {
  console.log('Listing surviving objects in private business-photos…');
  const byPlace = await listAll();
  const placeIds = Object.keys(byPlace);
  const totalFiles = placeIds.reduce((n, p) => n + byPlace[p].length, 0);
  console.log(`${placeIds.length} place_ids, ${totalFiles} files.`);

  let copied = 0, bytes = 0, updated = 0;
  const updatedSlugs = [];
  for (const placeId of placeIds) {
    for (const f of byPlace[placeId]) {
      bytes += await copyObject(`${placeId}/${f}`);
      copied++;
      if (copied % 50 === 0) console.log(`  copied ${copied}/${totalFiles}…`);
    }
    const rows = await updateBusiness(placeId, byPlace[placeId]);
    if (rows.length > 0) {
      updated += rows.length;
      updatedSlugs.push(...rows.map((r) => r.slug));
    }
  }

  console.log(`\nDone. Copied ${copied} files (${(bytes / 1024 / 1024).toFixed(1)} MB) to ${DST_BUCKET}.`);
  console.log(`Updated google_photos on ${updated} businesses.`);
  fs.writeFileSync(
    path.join(__dirname, 'restore-pruned-photos.result.json'),
    JSON.stringify({ ranAt: new Date().toISOString(), placeIds: placeIds.length, copied, updated, updatedSlugs }, null, 2)
  );
  console.log('Slugs written to scripts/restore-pruned-photos.result.json');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
