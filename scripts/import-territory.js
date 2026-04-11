#!/usr/bin/env node
/**
 * Generic territory importer. Usage:
 *   node scripts/import-territory.js "Geelong" VIC
 *
 * Same rules as seed-ballarat.js but accepts a city + state arg so you can
 * import any Australian locality. Logs every import decision to import_log.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const [, , cityArg, stateArg] = process.argv;
if (!cityArg || !stateArg) {
  console.error('Usage: node scripts/import-territory.js "<City>" <STATE>');
  console.error('Example: node scripts/import-territory.js "Geelong" VIC');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GOOGLE_PLACES_API_KEY) {
  console.error('Missing env vars — check .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

function classify(place) {
  const types = new Set(place.types ?? []);
  const name = (place.displayName?.text ?? '').toLowerCase();
  const isHair = types.has('hair_salon') || types.has('hair_care') || /hair|salon/.test(name);
  const isBarber = types.has('barber_shop') || /barber/.test(name);
  if (isBarber && !isHair) return 'barber';
  if (isHair && !isBarber) return 'hair_salon';
  if (isHair && isBarber) return 'unisex';
  return null;
}

function slugify(v) {
  return v.toLowerCase().trim().replace(/['"`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function searchText(query) {
  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.types,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 20 }),
  });
  if (!resp.ok) throw new Error(`Places API ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  return json.places ?? [];
}

function addressBits(place, fallbackSuburb, fallbackState) {
  const comps = place.addressComponents ?? [];
  const find = (t) => comps.find((c) => (c.types ?? []).includes(t))?.longText;
  const line1 = [find('street_number'), find('route')].filter(Boolean).join(' ') || place.formattedAddress || '';
  return {
    line1,
    suburb: find('locality') ?? find('sublocality') ?? fallbackSuburb,
    state: find('administrative_area_level_1') ?? fallbackState,
    postcode: find('postal_code') ?? '',
  };
}

async function logDecision(row, decision, reason, placeId) {
  await supabase.from('import_log').insert({
    source: 'google_places',
    raw_name: row?.name ?? null,
    raw_address: row?.address_line1 ?? null,
    google_place_id: placeId,
    import_decision: decision,
    rejection_reason: reason,
  });
}

async function main() {
  console.log(`📍 Importing ${cityArg}, ${stateArg}`);
  const queries = [
    `hair salon in ${cityArg} ${stateArg} Australia`,
    `barber shop in ${cityArg} ${stateArg} Australia`,
    `hairdresser in ${cityArg} ${stateArg} Australia`,
  ];

  const seen = new Map();
  for (const q of queries) {
    console.log(`  → ${q}`);
    const places = await searchText(q);
    for (const p of places) {
      if (!p.id || seen.has(p.id)) continue;
      const cat = classify(p);
      if (!cat) {
        await logDecision(null, 'rejected_category', `Type mismatch: ${(p.types ?? []).join(',')}`, p.id);
        continue;
      }
      const a = addressBits(p, cityArg, stateArg);
      const name = p.displayName?.text ?? 'Unknown';
      seen.set(p.id, {
        name,
        slug: slugify(`${name}-${a.suburb}`),
        business_type: cat,
        address_line1: a.line1,
        suburb: a.suburb,
        state: a.state,
        postcode: a.postcode,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        phone: p.nationalPhoneNumber ?? null,
        website_url: p.websiteUri ?? null,
        google_place_id: p.id,
        google_rating: p.rating ?? null,
        google_review_count: p.userRatingCount ?? null,
        status: 'unverified',
      });
    }
  }

  const rows = Array.from(seen.values());
  console.log(`✅ ${rows.length} unique candidates`);

  let inserted = 0;
  let dup = 0;
  for (const row of rows) {
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('google_place_id', row.google_place_id)
      .maybeSingle();
    if (existing) {
      dup++;
      await logDecision(row, 'rejected_duplicate', 'google_place_id already exists', row.google_place_id);
      continue;
    }
    const { error } = await supabase.from('businesses').insert(row);
    if (error) {
      console.error(`  ✗ ${row.name}: ${error.message}`);
    } else {
      inserted++;
      await logDecision(row, 'accepted', null, row.google_place_id);
    }
  }

  console.log(`Inserted ${inserted}, duplicates ${dup}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
