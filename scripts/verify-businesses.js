#!/usr/bin/env node
/**
 * 4-point cross-verification for every unverified business in a region.
 *
 * Checks:
 *   1. Google Places re-confirm (business_status still OPERATIONAL)
 *   2. True Local search result match
 *   3. Yellow Pages search result match
 *   4. Website HTTP HEAD
 *
 * Writes each check to verification_log, computes a confidence score and
 * verification_flags array, and updates the business row. Listings stay
 * at status='unverified' — Matt approves everything in /admin.
 *
 * Usage:
 *   node scripts/verify-businesses.js --region=ballarat
 */

require('dotenv').config({ path: '.env.local' });
const { requireEnv, pgClient, sleep, nameSimilarity } = require('./_pipeline-lib');

requireEnv([
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_DB_PASSWORD',
  'GOOGLE_PLACES_API_KEY',
]);

// ---- Google re-confirm -----------------------------------------------------

async function googleReconfirm(placeId) {
  try {
    const resp = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=id,businessStatus,rating,userRatingCount`,
      {
        headers: {
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        },
      },
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

// ---- Directory scrapes -----------------------------------------------------

async function scrapeDirectory(url, businessName) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (resp.status === 403 || resp.status === 429) {
      return { result: 'blocked', raw: { status: resp.status } };
    }
    if (!resp.ok) return { result: 'error', raw: { status: resp.status } };
    const html = await resp.text();
    // Very loose fuzzy match — normalise both sides and look for the
    // business name (or a close variant) in the rendered HTML.
    const hay = html.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');
    const needle = businessName.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();
    // Direct substring match against normalised haystack
    if (needle && hay.includes(needle)) {
      return { result: 'confirmed', raw: { matched: 'substring' } };
    }
    // Token-overlap fallback (>=60% of tokens present)
    const tokens = needle.split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length > 0) {
      const hits = tokens.filter((t) => hay.includes(t)).length;
      if (hits / tokens.length >= 0.6) {
        return { result: 'confirmed', raw: { matched: 'tokens', hits } };
      }
    }
    return { result: 'not_found', raw: null };
  } catch (err) {
    if (err.name === 'TimeoutError') return { result: 'error', raw: { error: 'timeout' } };
    return { result: 'error', raw: { error: err.message } };
  }
}

async function trueLocal(business) {
  const q = encodeURIComponent(business.name);
  const l = encodeURIComponent(`${business.suburb} ${business.state}`);
  const url = `https://www.truelocal.com.au/search?q=${q}&l=${l}`;
  return scrapeDirectory(url, business.name);
}

async function yellowPages(business) {
  const q = encodeURIComponent(business.name);
  const l = encodeURIComponent(`${business.suburb} ${business.state}`);
  const url = `https://www.yellowpages.com.au/search/listings?clue=${q}&locationClue=${l}`;
  return scrapeDirectory(url, business.name);
}

// ---- Website HEAD ----------------------------------------------------------

async function websiteAlive(url) {
  if (!url) return { result: 'skipped', raw: null };
  try {
    const resp = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    return {
      result: resp.status >= 200 && resp.status < 400 ? 'confirmed' : 'not_found',
      raw: { status: resp.status },
    };
  } catch (err) {
    return { result: 'not_found', raw: { error: err.message } };
  }
}

// ---- Confidence score ------------------------------------------------------

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
  if (checks.trueLocal.result === 'not_found' && checks.yellowPages.result === 'not_found') {
    flags.push('directory_absent');
  }
  if (business.website_url && checks.website.result === 'not_found') flags.push('website_dead');
  if ((business.google_rating ?? 5) < 3.0 && rc >= 5) flags.push('low_rating');
  if (!business.phone) flags.push('no_phone');
  if (score < 50 || flags.includes('low_reviews')) flags.push('needs_attention');

  return { score: Math.min(100, score), flags: [...new Set(flags)] };
}

// ---- Main ------------------------------------------------------------------

async function main() {
  const arg = process.argv.find((a) => a.startsWith('--region='));
  if (!arg) {
    console.error('Usage: node scripts/verify-businesses.js --region=<slug>');
    process.exit(1);
  }
  const regionSlug = arg.split('=')[1];

  const pg = pgClient();
  await pg.connect();

  const region = await pg.query('SELECT id, name FROM regions WHERE slug=$1', [regionSlug]);
  if (region.rowCount === 0) {
    console.error(`Region "${regionSlug}" not found`);
    process.exit(1);
  }
  const regionId = region.rows[0].id;

  const { rows: businesses } = await pg.query(
    `SELECT id, name, suburb, state, phone, website_url, google_place_id, google_rating, google_review_count
     FROM businesses
     WHERE region_id = $1 AND google_last_checked IS NULL
     ORDER BY created_at`,
    [regionId],
  );

  console.log(`🔎 Verifying ${businesses.length} businesses in ${region.rows[0].name}`);

  let completed = 0;
  for (const b of businesses) {
    const checks = {
      google: await googleReconfirm(b.google_place_id),
      trueLocal: { result: 'skipped', raw: null },
      yellowPages: { result: 'skipped', raw: null },
      website: { result: 'skipped', raw: null },
    };
    await sleep(120);
    checks.trueLocal = await trueLocal(b);
    await sleep(1000);
    checks.yellowPages = await yellowPages(b);
    await sleep(1000);
    checks.website = await websiteAlive(b.website_url);

    // Log each check
    for (const [name, c] of Object.entries(checks)) {
      if (c.result === 'skipped') continue;
      await pg.query(
        `INSERT INTO verification_log (business_id, check_type, result, raw_data)
         VALUES ($1, $2, $3, $4)`,
        [b.id, name === 'google' ? 'google_places' : name === 'trueLocal' ? 'true_local' : name === 'yellowPages' ? 'yellow_pages' : 'website_alive', c.result, c.raw ? JSON.stringify(c.raw) : null],
      );
    }

    const { score, flags } = scoreAndFlag(b, checks);
    const status = checks.google.result === 'closed' ? 'closed' : 'unverified';

    await pg.query(
      `UPDATE businesses
       SET confidence_score = $1,
           verification_flags = $2::jsonb,
           google_last_checked = now(),
           true_local_found = $3,
           yellow_pages_found = $4,
           website_alive = $5,
           status = $6
       WHERE id = $7`,
      [
        score,
        JSON.stringify(flags),
        checks.trueLocal.result === 'confirmed',
        checks.yellowPages.result === 'confirmed',
        checks.website.result === 'confirmed',
        status,
        b.id,
      ],
    );

    completed++;
    const badge = score >= 75 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    console.log(`  ${badge} [${completed}/${businesses.length}] ${b.name} — score ${score}${flags.length ? ` flags: ${flags.join(',')}` : ''}`);
  }

  console.log(`\n✅ Verified ${completed} businesses in ${region.rows[0].name}`);
  await pg.end();
}

main().catch((err) => {
  console.error('❌ verify-businesses failed:', err);
  process.exit(1);
});
