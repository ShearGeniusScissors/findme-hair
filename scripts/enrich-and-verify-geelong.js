#!/usr/bin/env node
/**
 * Enrich CSV-imported Geelong businesses with Google Places data,
 * then run full 4-point verification, then auto-approve >= 75.
 *
 * For each business without google_place_id:
 *   1. Search Google Places by name + suburb
 *   2. Match by name similarity + proximity
 *   3. Update google_place_id, rating, review_count, website, hours, photos, status
 *   4. Run verification (Google reconfirm + TrueLocal + YellowPages + website HEAD)
 *   5. Score and flag
 *
 * Finally: auto-approve all >= 75.
 */

require('dotenv').config({ path: '.env.local' });
const { pgClient, slugify, normaliseAddress, nameSimilarity, sleep } = require('./_pipeline-lib');

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.types',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.currentOpeningHours',
  'places.regularOpeningHours',
  'places.photos',
  'places.googleMapsUri',
].join(',');

async function searchPlace(name, suburb, state, lat, lng) {
  const body = {
    textQuery: `${name} ${suburb} ${state}`,
    maxResultCount: 5,
  };
  if (lat && lng) {
    body.locationBias = {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 2000,
      },
    };
  }
  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  if (resp.status === 429) {
    console.log('  ⚠ 429 rate limit — sleeping 30s');
    await sleep(30000);
    return searchPlace(name, suburb, state, lat, lng);
  }
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Places search ${resp.status}: ${text}`);
  }
  const json = await resp.json();
  return json.places || [];
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bestMatch(places, business) {
  let best = null;
  let bestScore = 0;
  for (const p of places) {
    const pName = p.displayName?.text || '';
    const sim = nameSimilarity(pName, business.name);
    if (sim < 0.5) continue;

    let score = sim;
    // Bonus for proximity
    if (business.lat && business.lng && p.location) {
      const dist = distanceKm(business.lat, business.lng, p.location.latitude, p.location.longitude);
      if (dist < 0.5) score += 0.3;
      else if (dist < 2) score += 0.1;
      else if (dist > 10) score -= 0.3;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 0.6 ? best : null;
}

function extractPhotos(place) {
  if (!Array.isArray(place.photos)) return null;
  return place.photos.slice(0, 5).map((p) => ({
    name: p.name,
    widthPx: p.widthPx,
    heightPx: p.heightPx,
  }));
}

function extractHours(place) {
  const src = place.currentOpeningHours || place.regularOpeningHours;
  if (!src) return null;
  return {
    weekdayDescriptions: src.weekdayDescriptions || [],
    periods: src.periods || [],
  };
}

// ---- Verification checks (same as verify-businesses.js) --------------------

async function googleReconfirm(placeId) {
  if (!placeId) return { result: 'error', raw: { error: 'no_place_id' } };
  try {
    const resp = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=id,businessStatus,rating,userRatingCount`,
      { headers: { 'X-Goog-Api-Key': API_KEY } },
    );
    if (!resp.ok) return { result: 'error', raw: { status: resp.status } };
    const json = await resp.json();
    return {
      result: json.businessStatus === 'OPERATIONAL' ? 'confirmed' : 'closed',
      raw: json,
    };
  } catch (err) {
    return { result: 'error', raw: { error: err.message } };
  }
}

async function scrapeDirectory(url, businessName) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (resp.status === 403 || resp.status === 429) return { result: 'blocked', raw: { status: resp.status } };
    if (!resp.ok) return { result: 'error', raw: { status: resp.status } };
    const html = await resp.text();
    const hay = html.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');
    const needle = businessName.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();
    if (needle && hay.includes(needle)) return { result: 'confirmed', raw: { matched: 'substring' } };
    const tokens = needle.split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length > 0) {
      const hits = tokens.filter((t) => hay.includes(t)).length;
      if (hits / tokens.length >= 0.6) return { result: 'confirmed', raw: { matched: 'tokens', hits } };
    }
    return { result: 'not_found', raw: null };
  } catch (err) {
    return { result: 'error', raw: { error: err.message } };
  }
}

async function trueLocal(b) {
  const q = encodeURIComponent(b.name);
  const l = encodeURIComponent(`${b.suburb} ${b.state}`);
  return scrapeDirectory(`https://www.truelocal.com.au/search?q=${q}&l=${l}`, b.name);
}

async function yellowPages(b) {
  const q = encodeURIComponent(b.name);
  const l = encodeURIComponent(`${b.suburb} ${b.state}`);
  return scrapeDirectory(`https://www.yellowpages.com.au/search/listings?clue=${q}&locationClue=${l}`, b.name);
}

async function websiteAlive(url) {
  if (!url) return { result: 'skipped', raw: null };
  try {
    const resp = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
    return { result: resp.status < 400 ? 'confirmed' : 'not_found', raw: { status: resp.status } };
  } catch (err) {
    return { result: 'not_found', raw: { error: err.message } };
  }
}

function scoreAndFlag(business, checks) {
  let score = 0;
  const flags = [];
  if (checks.google.result === 'confirmed') score += 40;
  if ((business.google_rating ?? 0) >= 4.0) score += 10;
  const rc = business.google_review_count ?? 0;
  if (rc >= 10) score += 15;
  else if (rc >= 3) score += 5;
  if (checks.trueLocal.result === 'confirmed') score += 15;
  if (checks.yellowPages.result === 'confirmed') score += 15;
  if (checks.website.result === 'confirmed') score += 10;
  if (business.phone) score += 5;
  if (rc < 3) flags.push('low_reviews');
  if (rc === 0) flags.push('no_reviews');
  if (checks.trueLocal.result === 'not_found' && checks.yellowPages.result === 'not_found') flags.push('directory_absent');
  if (business.website_url && checks.website.result === 'not_found') flags.push('website_dead');
  if ((business.google_rating ?? 5) < 3.0 && rc >= 5) flags.push('low_rating');
  if (!business.phone) flags.push('no_phone');
  if (score < 50 || flags.includes('low_reviews')) flags.push('needs_attention');
  return { score: Math.min(100, score), flags: [...new Set(flags)] };
}

async function main() {
  const pg = pgClient();
  await pg.connect();

  const regionRes = await pg.query("SELECT id, name, state FROM regions WHERE slug='geelong'");
  const region = regionRes.rows[0];
  console.log(`📍 ${region.name} (${region.state})`);

  // Get ALL unverified businesses (including those with low scores from first pass)
  const { rows: businesses } = await pg.query(
    `SELECT id, name, slug, suburb, state, lat, lng, phone, website_url,
            google_place_id, google_rating, google_review_count, business_type
     FROM businesses
     WHERE region_id = $1 AND status = 'unverified'
     ORDER BY name`,
    [region.id],
  );
  console.log(`🔍 ${businesses.length} unverified businesses to enrich + verify\n`);

  let enriched = 0;
  let verified = 0;
  let apiCalls = 0;

  for (let i = 0; i < businesses.length; i++) {
    const b = businesses[i];
    console.log(`[${i + 1}/${businesses.length}] ${b.name}`);

    // Step 1: Enrich with Google Places if no place_id
    if (!b.google_place_id) {
      try {
        const places = await searchPlace(b.name, b.suburb, b.state, b.lat, b.lng);
        apiCalls++;
        await sleep(120);

        const match = bestMatch(places, b);
        if (match) {
          const photos = extractPhotos(match);
          const hours = extractHours(match);
          await pg.query(
            `UPDATE businesses SET
              google_place_id = $1,
              google_rating = $2,
              google_review_count = $3,
              google_business_status = $4,
              google_photos = $5,
              google_hours = $6,
              website_url = COALESCE(website_url, $7),
              phone = COALESCE(phone, $8)
            WHERE id = $9`,
            [
              match.id,
              match.rating ?? null,
              match.userRatingCount ?? null,
              match.businessStatus ?? null,
              photos ? JSON.stringify(photos) : null,
              hours ? JSON.stringify(hours) : null,
              match.websiteUri ?? null,
              match.nationalPhoneNumber ?? null,
              b.id,
            ],
          );
          // Update local object for scoring
          b.google_place_id = match.id;
          b.google_rating = match.rating ?? null;
          b.google_review_count = match.userRatingCount ?? null;
          b.website_url = b.website_url || match.websiteUri || null;
          b.phone = b.phone || match.nationalPhoneNumber || null;
          enriched++;
          console.log(`  ✓ Found on Google: ${match.displayName?.text} ★${match.rating ?? '?'} (${match.userRatingCount ?? 0} reviews)`);
        } else {
          console.log(`  ✗ No Google match found`);
        }
      } catch (err) {
        console.error(`  ✗ Google search error: ${err.message}`);
      }
    } else {
      console.log(`  ✓ Already has place_id`);
    }

    // Step 2: Verify (4-point check)
    const checks = {
      google: await googleReconfirm(b.google_place_id),
      trueLocal: { result: 'skipped', raw: null },
      yellowPages: { result: 'skipped', raw: null },
      website: { result: 'skipped', raw: null },
    };
    if (b.google_place_id) apiCalls++;
    await sleep(120);

    checks.trueLocal = await trueLocal(b);
    await sleep(800);
    checks.yellowPages = await yellowPages(b);
    await sleep(800);
    checks.website = await websiteAlive(b.website_url);

    // Log checks
    for (const [name, c] of Object.entries(checks)) {
      if (c.result === 'skipped') continue;
      const checkType = name === 'google' ? 'google_places' : name === 'trueLocal' ? 'true_local' : name === 'yellowPages' ? 'yellow_pages' : 'website_alive';
      await pg.query(
        `INSERT INTO verification_log (business_id, check_type, result, raw_data) VALUES ($1, $2, $3, $4)`,
        [b.id, checkType, c.result, c.raw ? JSON.stringify(c.raw) : null],
      );
    }

    const { score, flags } = scoreAndFlag(b, checks);
    const status = checks.google.result === 'closed' ? 'closed' : 'unverified';

    await pg.query(
      `UPDATE businesses SET
        confidence_score = $1,
        verification_flags = $2::jsonb,
        google_last_checked = now(),
        true_local_found = $3,
        yellow_pages_found = $4,
        website_alive = $5,
        status = $6
      WHERE id = $7`,
      [score, JSON.stringify(flags), checks.trueLocal.result === 'confirmed', checks.yellowPages.result === 'confirmed', checks.website.result === 'confirmed', status, b.id],
    );

    verified++;
    const badge = score >= 75 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    console.log(`  ${badge} Score: ${score}  ${flags.length ? `[${flags.join(', ')}]` : ''}`);
    console.log('');
  }

  // Step 3: Auto-approve >= 75
  const approveRes = await pg.query(
    `UPDATE businesses
     SET status = 'active', updated_at = now()
     WHERE region_id = $1
       AND confidence_score >= 75
       AND status = 'unverified'
     RETURNING id`,
    [region.id],
  );

  // Step 4: Ground-truth override — Matt physically visited these businesses.
  // Any that still couldn't be enriched via Google get confidence 70 + active.
  const groundTruthRes = await pg.query(
    `UPDATE businesses
     SET status = 'active', confidence_score = 70, updated_at = now()
     WHERE region_id = $1
       AND status = 'unverified'
       AND google_place_id IS NULL
     RETURNING id`,
    [region.id],
  );
  console.log(`\n🏪 Ground-truth override: ${groundTruthRes.rowCount} businesses approved (physically visited, no Google match)`);

  // Final tally
  const tally = await pg.query(
    `SELECT
       count(*)::int AS total,
       sum(case when status='active' then 1 else 0 end)::int AS active,
       sum(case when confidence_score >= 75 then 1 else 0 end)::int AS green,
       sum(case when confidence_score >= 50 and confidence_score < 75 then 1 else 0 end)::int AS amber,
       sum(case when confidence_score < 50 then 1 else 0 end)::int AS red
     FROM businesses WHERE region_id = $1`,
    [region.id],
  );
  const t = tally.rows[0];

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GEELONG ENRICH + VERIFY + APPROVE COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Enriched with Google data: ${enriched}`);
  console.log(`  Verified:                  ${verified}`);
  console.log(`  Auto-approved (≥75):       ${approveRes.rowCount}`);
  console.log(`  Google API calls:          ${apiCalls}`);
  console.log(`  Est. cost:                 $${(apiCalls * 0.032).toFixed(2)} USD`);
  console.log('');
  console.log(`  Total businesses:   ${t.total}`);
  console.log(`  Active:             ${t.active}`);
  console.log(`  🟢 Green (≥75):     ${t.green}`);
  console.log(`  🟡 Amber (50-74):   ${t.amber}`);
  console.log(`  🔴 Red (<50):       ${t.red}`);

  await pg.end();
}

main().catch((err) => {
  console.error('❌ fatal:', err);
  process.exit(1);
});
