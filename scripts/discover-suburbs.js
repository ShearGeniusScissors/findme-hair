#!/usr/bin/env node
/**
 * Discover every suburb inside a region that has at least one hair salon or
 * barber. Uses the Google Places (New) API's searchText endpoint across a
 * wide geographic bias, extracts every unique locality/sublocality from the
 * results, then upserts those suburbs into the `suburbs` table.
 *
 * Usage:
 *   node scripts/discover-suburbs.js --region=ballarat
 *   node scripts/discover-suburbs.js --region=geelong
 */

require('dotenv').config({ path: '.env.local' });
const { requireEnv, pgClient, slugify, sleep } = require('./_pipeline-lib');

requireEnv([
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_DB_PASSWORD',
  'GOOGLE_PLACES_API_KEY',
]);

const REGION_CENTRES = {
  ballarat: { name: 'Ballarat', state: 'VIC', lat: -37.5622, lng: 143.8503, radius: 25000 },
  geelong: { name: 'Geelong', state: 'VIC', lat: -38.1499, lng: 144.3617, radius: 30000 },
  bendigo: { name: 'Bendigo', state: 'VIC', lat: -36.757, lng: 144.2794, radius: 20000 },
  shepparton: { name: 'Shepparton', state: 'VIC', lat: -36.3833, lng: 145.4, radius: 15000 },
  hobart: { name: 'Hobart', state: 'TAS', lat: -42.8821, lng: 147.3272, radius: 20000 },
  launceston: { name: 'Launceston', state: 'TAS', lat: -41.4332, lng: 147.1441, radius: 20000 },
  'adelaide-cbd': { name: 'Adelaide CBD', state: 'SA', lat: -34.9285, lng: 138.6007, radius: 5000 },
};

async function searchText(query, centre) {
  const body = {
    textQuery: query,
    locationBias: {
      circle: { center: { latitude: centre.lat, longitude: centre.lng }, radius: centre.radius },
    },
    maxResultCount: 20,
  };
  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.types',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Places searchText ${resp.status}: ${text}`);
  }
  const json = await resp.json();
  return json.places || [];
}

async function geocode(suburbName, state) {
  const q = encodeURIComponent(`${suburbName} ${state} Australia`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${process.env.GOOGLE_PLACES_API_KEY}&region=au`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const json = await resp.json();
  const result = json.results?.[0];
  if (!result) return null;
  const comps = result.address_components || [];
  const postcode = comps.find((c) => c.types.includes('postal_code'))?.long_name ?? null;
  return {
    lat: result.geometry?.location?.lat ?? null,
    lng: result.geometry?.location?.lng ?? null,
    postcode,
  };
}

function suburbFromPlace(place) {
  const comps = place.addressComponents || [];
  const find = (t) => comps.find((c) => (c.types || []).includes(t))?.longText;
  return find('locality') || find('sublocality') || find('sublocality_level_1');
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith('--region='));
  if (!arg) {
    console.error('Usage: node scripts/discover-suburbs.js --region=<slug>');
    process.exit(1);
  }
  const regionSlug = arg.split('=')[1];
  const centre = REGION_CENTRES[regionSlug];
  if (!centre) {
    console.error(`Unknown region: ${regionSlug}. Known: ${Object.keys(REGION_CENTRES).join(', ')}`);
    process.exit(1);
  }

  console.log(`📍 Discovering suburbs in ${centre.name}, ${centre.state}`);

  const pg = pgClient();
  await pg.connect();

  // Make sure the region row exists
  const reg = await pg.query(
    `INSERT INTO regions (name, state, slug) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, slug`,
    [centre.name, centre.state, regionSlug],
  );
  const regionId = reg.rows[0].id;

  const queries = [
    `hair salon in ${centre.name} ${centre.state}`,
    `barber in ${centre.name} ${centre.state}`,
    `hairdresser in ${centre.name} ${centre.state}`,
  ];

  const suburbSet = new Map(); // key: slug -> { name, state }
  let apiCalls = 0;
  for (const q of queries) {
    console.log(`  → searching: ${q}`);
    const places = await searchText(q, centre);
    apiCalls++;
    places.forEach((p) => {
      const s = suburbFromPlace(p);
      if (s) suburbSet.set(slugify(s), { name: s, state: centre.state });
    });
    await sleep(150);
  }

  console.log(`  → found ${suburbSet.size} unique suburbs from Places`);

  let inserted = 0;
  let skipped = 0;
  for (const [slug, info] of suburbSet) {
    const geo = await geocode(info.name, info.state);
    apiCalls++;
    await sleep(100);
    try {
      const { rowCount } = await pg.query(
        `INSERT INTO suburbs (name, region_id, state, slug, postcode, lat, lng)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET postcode = EXCLUDED.postcode, lat = EXCLUDED.lat, lng = EXCLUDED.lng
         WHERE suburbs.postcode IS NULL OR suburbs.lat IS NULL`,
        [info.name, regionId, info.state, slug, geo?.postcode, geo?.lat, geo?.lng],
      );
      if (rowCount > 0) {
        inserted++;
        console.log(`    + ${info.name} (${geo?.postcode ?? '—'})`);
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`    ✗ ${info.name}: ${err.message}`);
    }
  }

  console.log(
    `\n✅ Discovered ${suburbSet.size} suburbs (${inserted} new, ${skipped} already present). ${apiCalls} Google API calls.`,
  );

  await pg.end();
}

main().catch((err) => {
  console.error('❌ discover-suburbs failed:', err);
  process.exit(1);
});
