#!/usr/bin/env node
/**
 * Seed Ballarat hair salons and barbers from Google Places.
 *
 * Requires the following env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   GOOGLE_PLACES_API_KEY
 *
 * Usage:
 *   node scripts/seed-ballarat.js
 *
 * Listing rules (from FINDME_HAIR_PROJECT.md §2):
 *   - hair / barber / unisex only
 *   - one listing per physical address (dedupe via google_place_id)
 *   - all imports start as status='unverified' — they require admin approval
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
if (!GOOGLE_PLACES_API_KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY — cannot fetch from Places API');
  console.error('Set it in .env.local, then re-run');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// Ballarat city centre — used for nearby search radius
const BALLARAT = { lat: -37.5622, lng: 143.8503 };
const SEARCH_RADIUS_M = 8000; // 8 km covers the whole LGA

// Phrases we search for. Google Places returns up to 20 per query, with paging.
const QUERIES = ['hair salon', 'barber shop', 'hairdresser'];

// Business-type classifier — see listing rules
function classify(place) {
  const types = new Set(place.types ?? []);
  const name = (place.displayName?.text ?? place.name ?? '').toLowerCase();
  const isHair = types.has('hair_salon') || types.has('hair_care') || /hair|salon/.test(name);
  const isBarber = types.has('barber_shop') || /barber/.test(name);
  if (isBarber && !isHair) return 'barber';
  if (isHair && !isBarber) return 'hair_salon';
  if (isHair && isBarber) return 'unisex';
  // Reject anything that is not clearly hair/barber
  return null;
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function searchText(query) {
  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.types,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount',
    },
    body: JSON.stringify({
      textQuery: `${query} in Ballarat VIC Australia`,
      locationBias: {
        circle: { center: BALLARAT, radius: SEARCH_RADIUS_M },
      },
      maxResultCount: 20,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Places API error ${resp.status}: ${text}`);
  }
  const json = await resp.json();
  return json.places ?? [];
}

function addressBits(place) {
  const comps = place.addressComponents ?? [];
  const find = (type) => comps.find((c) => (c.types ?? []).includes(type))?.longText;
  const streetNumber = find('street_number');
  const route = find('route');
  const suburb = find('locality') ?? find('sublocality') ?? 'Ballarat';
  const state = find('administrative_area_level_1') ?? 'VIC';
  const postcode = find('postal_code') ?? '3350';
  const line1 = [streetNumber, route].filter(Boolean).join(' ') || place.formattedAddress || '';
  return { line1, suburb, state, postcode };
}

async function main() {
  console.log('🪞 Seeding Ballarat hair/barber listings…');
  const seen = new Map(); // place_id -> row
  for (const q of QUERIES) {
    console.log(`  → query: ${q}`);
    const places = await searchText(q);
    for (const p of places) {
      if (!p.id || seen.has(p.id)) continue;
      const category = classify(p);
      if (!category) continue;
      const { line1, suburb, state, postcode } = addressBits(p);
      const name = p.displayName?.text ?? 'Unknown';
      const row = {
        name,
        slug: slugify(`${name}-${suburb}`),
        business_type: category,
        address_line1: line1,
        suburb,
        state,
        postcode,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        phone: p.nationalPhoneNumber ?? null,
        website_url: p.websiteUri ?? null,
        google_place_id: p.id,
        google_rating: p.rating ?? null,
        google_review_count: p.userRatingCount ?? null,
        status: 'unverified',
      };
      seen.set(p.id, row);
    }
  }

  const rows = Array.from(seen.values());
  console.log(`✅ Collected ${rows.length} unique hair/barber listings`);

  // Upsert on google_place_id (unique)
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('google_place_id', row.google_place_id)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from('businesses').insert(row);
    if (error) {
      console.error(`  ✗ ${row.name}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log('Done. Review the "unverified" tab in /admin to approve.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
