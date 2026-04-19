#!/usr/bin/env node
/**
 * backfill-places-details.js — Fetch Google Places details for new imports
 *
 * Fills in: google_rating, google_review_count, google_hours, suburb_id
 * for businesses that have a google_place_id but are missing these fields.
 *
 * Usage:
 *   node scripts/backfill-places-details.js          # Run for all missing
 *   node scripts/backfill-places-details.js --dry     # Dry run
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DRY_RUN = process.argv.includes('--dry');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Load suburb lookup ──
let suburbsByRegion = {}; // region_id -> [{ id, name, slug }]

async function loadSuburbs() {
  const { data, error } = await supabase
    .from('suburbs')
    .select('id, name, slug, region_id');

  if (error) throw new Error(`Failed to load suburbs: ${error.message}`);

  for (const s of data) {
    if (!suburbsByRegion[s.region_id]) suburbsByRegion[s.region_id] = [];
    suburbsByRegion[s.region_id].push(s);
  }
  console.log(`Loaded ${data.length} suburbs across ${Object.keys(suburbsByRegion).length} regions`);
}

function findSuburbId(businessSuburb, regionId) {
  const suburbs = suburbsByRegion[regionId] || [];
  const target = businessSuburb.toLowerCase().trim();

  // Exact match
  const exact = suburbs.find(s => s.name.toLowerCase() === target);
  if (exact) return exact.id;

  // Partial match
  const partial = suburbs.find(s =>
    target.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(target)
  );
  if (partial) return partial.id;

  // If no match, create the suburb
  return null;
}

// ── Google Places API (New) — Place Details ──

async function getPlaceDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'rating,userRatingCount,regularOpeningHours,businessStatus',
    },
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  Places detail error for ${placeId}: ${response.status}`);
    return null;
  }

  return await response.json();
}

function formatHours(regularOpeningHours) {
  if (!regularOpeningHours?.periods) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = {};

  for (const period of regularOpeningHours.periods) {
    const day = dayNames[period.open?.day] || 'Unknown';
    const openTime = period.open ?
      `${String(period.open.hour).padStart(2, '0')}:${String(period.open.minute || 0).padStart(2, '0')}` : '';
    const closeTime = period.close ?
      `${String(period.close.hour).padStart(2, '0')}:${String(period.close.minute || 0).padStart(2, '0')}` : '';

    hours[day] = `${openTime}-${closeTime}`;
  }

  return hours;
}

// ── Create missing suburbs ──

async function createSuburb(name, regionId, businessState) {
  // Get region slug for the suburb slug prefix
  const { data: region } = await supabase
    .from('regions')
    .select('slug')
    .eq('id', regionId)
    .single();

  const slug = `${region?.slug || 'unknown'}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  const { data, error } = await supabase
    .from('suburbs')
    .upsert({ name, slug, region_id: regionId, state: businessState }, { onConflict: 'slug', ignoreDuplicates: true })
    .select('id')
    .single();

  if (error) {
    console.error(`  Failed to create suburb "${name}": ${error.message}`);
    return null;
  }

  // Add to cache
  if (!suburbsByRegion[regionId]) suburbsByRegion[regionId] = [];
  suburbsByRegion[regionId].push({ id: data.id, name, slug });

  return data.id;
}

// ── Main ──

async function main() {
  console.log('═'.repeat(60));
  console.log('findme.hair — Backfill Google Places Details');
  console.log('═'.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log();

  await loadSuburbs();

  // Get businesses missing details
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, suburb, state, google_place_id, region_id, google_rating, google_hours, suburb_id')
    .eq('status', 'active')
    .is('ai_description', null)
    .not('google_place_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load businesses: ${error.message}`);

  console.log(`Found ${businesses.length} businesses to backfill\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let suburbsCreated = 0;

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    console.log(`[${i + 1}/${businesses.length}] ${biz.name} (${biz.suburb})`);

    // Get place details from Google
    const details = await getPlaceDetails(biz.google_place_id);

    if (!details) {
      errors++;
      continue;
    }

    // Build update object
    const update = {};

    // Rating
    if (details.rating != null) {
      update.google_rating = details.rating;
      update.google_review_count = details.userRatingCount || 0;
    }

    // Hours
    if (details.regularOpeningHours) {
      update.google_hours = formatHours(details.regularOpeningHours);
    }

    // Business status
    if (details.businessStatus) {
      update.google_business_status = details.businessStatus;
    }

    // Suburb ID
    if (!biz.suburb_id && biz.suburb && biz.region_id) {
      let suburbId = findSuburbId(biz.suburb, biz.region_id);
      if (!suburbId) {
        // Create the suburb
        if (!DRY_RUN) {
          suburbId = await createSuburb(biz.suburb, biz.region_id, biz.state);
          if (suburbId) suburbsCreated++;
        } else {
          console.log(`  Would create suburb: ${biz.suburb}`);
        }
      }
      if (suburbId) update.suburb_id = suburbId;
    }

    // Last checked timestamp
    update.google_last_checked = new Date().toISOString();

    if (Object.keys(update).length <= 1) { // only google_last_checked
      console.log(`  No new data available`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  Would update: rating=${update.google_rating}, reviews=${update.google_review_count}, hours=${update.google_hours ? 'yes' : 'no'}, suburb_id=${update.suburb_id || 'no'}`);
      updated++;
    } else {
      const { error: updateErr } = await supabase
        .from('businesses')
        .update(update)
        .eq('id', biz.id);

      if (updateErr) {
        console.error(`  Update failed: ${updateErr.message}`);
        errors++;
      } else {
        console.log(`  ✓ rating=${update.google_rating || '-'}, reviews=${update.google_review_count || '-'}, hours=${update.google_hours ? 'yes' : 'no'}`);
        updated++;
      }
    }

    // Rate limit: ~5 req/sec
    await sleep(200);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('BACKFILL COMPLETE');
  console.log('═'.repeat(60));
  console.log(`  Updated:         ${updated}`);
  console.log(`  Skipped:         ${skipped}`);
  console.log(`  Errors:          ${errors}`);
  console.log(`  Suburbs created: ${suburbsCreated}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
