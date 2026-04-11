#!/usr/bin/env node
/**
 * Scrape every hair salon, barber, and unisex salon in a region via the
 * Google Places (New) API, apply the listing rules, dedupe on
 * google_place_id + normalised address, and insert into Supabase with
 * status='unverified'.
 *
 * Usage:
 *   node scripts/scrape-region.js --region=ballarat
 *   node scripts/scrape-region.js --region=geelong
 *
 * Rate limited to ~10 req/s. Retries on 429 with 30s back-off.
 */

require('dotenv').config({ path: '.env.local' });
const {
  requireEnv,
  pgClient,
  slugify,
  normaliseAddress,
  classifyPlace,
  sleep,
} = require('./_pipeline-lib');

requireEnv([
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_DB_PASSWORD',
  'GOOGLE_PLACES_API_KEY',
]);

const SEARCH_TERMS = [
  'hair salon',
  'hairdresser',
  'barber',
  'hair stylist',
  'unisex hair salon',
];

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
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

async function placesSearchText(query, centre, retries = 3) {
  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: centre.lat, longitude: centre.lng },
        radius: centre.radius,
      },
    },
    maxResultCount: 20,
  };
  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  if (resp.status === 429 && retries > 0) {
    console.log('  ⚠ 429 rate limit — sleeping 30s');
    await sleep(30000);
    return placesSearchText(query, centre, retries - 1);
  }
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Places searchText ${resp.status}: ${text}`);
  }
  const json = await resp.json();
  return json.places || [];
}

function addressBits(place, fallbackSuburb, fallbackState) {
  const comps = place.addressComponents || [];
  const find = (t) => comps.find((c) => (c.types || []).includes(t))?.longText;
  const line1 = [find('street_number'), find('route')].filter(Boolean).join(' ') ||
    (place.formattedAddress || '').split(',')[0] ||
    '';
  return {
    line1,
    suburb: find('locality') || find('sublocality') || fallbackSuburb,
    state: find('administrative_area_level_1') || fallbackState,
    postcode: find('postal_code') || '',
  };
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

async function logDecision(pg, row, decision, reason, placeId) {
  await pg.query(
    `INSERT INTO import_log (business_id, source, raw_name, raw_address, raw_category, google_place_id, import_decision, rejection_reason)
     VALUES (NULL, 'google_places', $1, $2, $3, $4, $5, $6)`,
    [row?.name ?? null, row?.address_line1 ?? null, row?.business_type ?? null, placeId, decision, reason],
  );
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith('--region='));
  if (!arg) {
    console.error('Usage: node scripts/scrape-region.js --region=<slug>');
    process.exit(1);
  }
  const regionSlug = arg.split('=')[1];

  const pg = pgClient();
  await pg.connect();

  const regionRow = await pg.query('SELECT id, name, state FROM regions WHERE slug=$1', [regionSlug]);
  if (regionRow.rowCount === 0) {
    console.error(`Region "${regionSlug}" not found. Run discover-suburbs first.`);
    process.exit(1);
  }
  const region = regionRow.rows[0];

  const suburbRows = await pg.query(
    'SELECT id, name, slug, state, postcode, lat, lng FROM suburbs WHERE region_id=$1 ORDER BY name',
    [region.id],
  );
  if (suburbRows.rowCount === 0) {
    console.error(`No suburbs for ${region.name}. Run discover-suburbs --region=${regionSlug} first.`);
    process.exit(1);
  }

  console.log(`🔍 Scraping ${region.name} (${region.state}) across ${suburbRows.rowCount} suburbs`);

  const counters = {
    raw: 0,
    accepted: 0,
    rejectedCategory: 0,
    rejectedDuplicate: 0,
    rejectedClosed: 0,
    apiCalls: 0,
  };

  const seenPlaceIds = new Set();

  for (const suburb of suburbRows.rows) {
    const centre = {
      lat: suburb.lat ?? -37.5622,
      lng: suburb.lng ?? 143.8503,
      radius: 3000,
    };

    for (const term of SEARCH_TERMS) {
      const q = `${term} in ${suburb.name} ${suburb.state}`;
      let places = [];
      try {
        places = await placesSearchText(q, centre);
        counters.apiCalls++;
      } catch (err) {
        console.error(`  ✗ ${q}: ${err.message}`);
        continue;
      }
      await sleep(110);

      for (const place of places) {
        counters.raw++;
        if (!place.id || seenPlaceIds.has(place.id)) continue;
        seenPlaceIds.add(place.id);

        // Reject closed
        if (place.businessStatus === 'CLOSED_PERMANENTLY') {
          counters.rejectedClosed++;
          await logDecision(pg, null, 'rejected_category', 'closed_permanently', place.id);
          continue;
        }

        // Classify and reject non-hair categories
        const category = classifyPlace(place);
        if (!category) {
          counters.rejectedCategory++;
          await logDecision(
            pg,
            { name: place.displayName?.text },
            'rejected_category',
            `types=${(place.types || []).join(',')}`,
            place.id,
          );
          continue;
        }

        const bits = addressBits(place, suburb.name, region.state);
        const name = place.displayName?.text || 'Unknown';
        const normAddr = normaliseAddress(place.formattedAddress || bits.line1);

        // Dedupe: google_place_id
        const dupPlace = await pg.query('SELECT id FROM businesses WHERE google_place_id=$1', [place.id]);
        if (dupPlace.rowCount > 0) {
          counters.rejectedDuplicate++;
          continue;
        }
        // Dedupe: normalised address
        const dupAddr = await pg.query('SELECT id FROM address_dedup WHERE normalised_address=$1', [normAddr]);
        if (dupAddr.rowCount > 0) {
          counters.rejectedDuplicate++;
          await logDecision(pg, { name, address_line1: bits.line1 }, 'rejected_duplicate', 'address already exists', place.id);
          continue;
        }

        const row = {
          name,
          slug: slugify(`${name}-${bits.suburb}`),
          business_type: category,
          address_line1: bits.line1,
          suburb: bits.suburb,
          state: bits.state,
          postcode: bits.postcode,
          lat: place.location?.latitude ?? null,
          lng: place.location?.longitude ?? null,
          phone: place.nationalPhoneNumber ?? null,
          website_url: place.websiteUri ?? null,
          google_place_id: place.id,
          google_rating: place.rating ?? null,
          google_review_count: place.userRatingCount ?? null,
          google_business_status: place.businessStatus ?? null,
          google_photos: extractPhotos(place),
          google_hours: extractHours(place),
          region_id: region.id,
          suburb_id: suburb.id,
          status: 'unverified',
        };

        try {
          const ins = await pg.query(
            `INSERT INTO businesses (
              name, slug, business_type, address_line1, suburb, state, postcode,
              lat, lng, phone, website_url, google_place_id, google_rating,
              google_review_count, google_business_status, google_photos, google_hours,
              region_id, suburb_id, status
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
              $15, $16, $17, $18, $19, $20
            )
            ON CONFLICT (google_place_id) DO NOTHING
            RETURNING id`,
            [
              row.name,
              row.slug,
              row.business_type,
              row.address_line1,
              row.suburb,
              row.state,
              row.postcode,
              row.lat,
              row.lng,
              row.phone,
              row.website_url,
              row.google_place_id,
              row.google_rating,
              row.google_review_count,
              row.google_business_status,
              row.google_photos ? JSON.stringify(row.google_photos) : null,
              row.google_hours ? JSON.stringify(row.google_hours) : null,
              row.region_id,
              row.suburb_id,
              row.status,
            ],
          );
          if (ins.rowCount > 0) {
            counters.accepted++;
            await pg.query(
              `INSERT INTO address_dedup (normalised_address, google_place_id, canonical_business_id, duplicate_count)
               VALUES ($1, $2, $3, 1)
               ON CONFLICT (normalised_address) DO NOTHING`,
              [normAddr, place.id, ins.rows[0].id],
            );
            await logDecision(pg, row, 'accepted', null, place.id);
            console.log(`    + [${suburb.name}] ${row.name} (${row.business_type})`);
          } else {
            counters.rejectedDuplicate++;
          }
        } catch (err) {
          // Slug collisions can happen across suburbs — retry with place-id suffix
          if (/duplicate key.*slug/i.test(err.message)) {
            try {
              row.slug = `${row.slug}-${place.id.slice(-6)}`;
              const ins2 = await pg.query(
                `INSERT INTO businesses (
                  name, slug, business_type, address_line1, suburb, state, postcode,
                  lat, lng, phone, website_url, google_place_id, google_rating,
                  google_review_count, google_business_status, google_photos, google_hours,
                  region_id, suburb_id, status
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                  $15, $16, $17, $18, $19, $20
                )
                ON CONFLICT (google_place_id) DO NOTHING
                RETURNING id`,
                [
                  row.name, row.slug, row.business_type, row.address_line1, row.suburb,
                  row.state, row.postcode, row.lat, row.lng, row.phone, row.website_url,
                  row.google_place_id, row.google_rating, row.google_review_count,
                  row.google_business_status,
                  row.google_photos ? JSON.stringify(row.google_photos) : null,
                  row.google_hours ? JSON.stringify(row.google_hours) : null,
                  row.region_id, row.suburb_id, row.status,
                ],
              );
              if (ins2.rowCount > 0) counters.accepted++;
            } catch (err2) {
              console.error(`    ✗ ${row.name}: ${err2.message}`);
            }
          } else {
            console.error(`    ✗ ${row.name}: ${err.message}`);
          }
        }
      }
    }
  }

  // Update territory counters
  await pg.query(
    `UPDATE territories
     SET raw_count = $1, last_imported_at = now(), import_status = 'imported'
     WHERE name = $2 AND state = $3`,
    [counters.accepted, region.name, region.state],
  );

  console.log('\n═══════════════════════════════════════');
  console.log(`${region.name} scrape complete`);
  console.log('═══════════════════════════════════════');
  console.log(`  Raw results scanned:    ${counters.raw}`);
  console.log(`  Accepted:               ${counters.accepted}`);
  console.log(`  Rejected (category):    ${counters.rejectedCategory}`);
  console.log(`  Rejected (closed):      ${counters.rejectedClosed}`);
  console.log(`  Rejected (duplicate):   ${counters.rejectedDuplicate}`);
  console.log(`  Google API calls:       ${counters.apiCalls}`);
  console.log(`  Estimated cost:         $${(counters.apiCalls * 0.032).toFixed(2)} USD`);

  await pg.end();
}

main().catch(async (err) => {
  console.error('❌ scrape-region failed:', err);
  process.exit(1);
});
