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

// Region definitions.
//
// Regions with a `suburbs` array use EXPLICIT suburb lists — discovery
// geocodes each entry directly instead of letting Google Places text search
// pick suburbs. This is required for "Melbourne West" / "Adelaide North"
// style regions where the phrase also happens to be a real suburb name and
// Places returns the wrong geographic area (e.g. "Melbourne West VIC" matches
// the suburb "West Melbourne" in the CBD, not Werribee/Altona/Williamstown).
//
// Regions without `suburbs` use the Places text search discovery path —
// works well for distinct place names like Ballarat, Hobart, Bendigo.
const REGION_CENTRES = {
  // Phase 0 — regional VIC (pilot territories, already done)
  ballarat: { name: 'Ballarat', state: 'VIC', lat: -37.5622, lng: 143.8503, radius: 25000 },
  geelong: { name: 'Geelong', state: 'VIC', lat: -38.1499, lng: 144.3617, radius: 30000 },

  // Phase 1 — Melbourne metro (explicit suburb lists)
  'melbourne-west': {
    name: 'Melbourne West', state: 'VIC', lat: -37.85, lng: 144.76, radius: 18000,
    suburbs: [
      'Werribee', 'Point Cook', 'Altona', 'Altona North', 'Altona Meadows',
      'Williamstown', 'Newport', 'Yarraville', 'Seddon', 'Spotswood',
      'Footscray', 'West Footscray', 'Sunshine', 'Sunshine North', 'Sunshine West',
      'Hoppers Crossing', 'Tarneit', 'Wyndham Vale', 'Truganina', 'Laverton',
      'Maidstone', 'Braybrook', 'Kingsville', 'Maribyrnong',
    ],
  },
  'melbourne-cbd': {
    name: 'Melbourne CBD', state: 'VIC', lat: -37.8136, lng: 144.9631, radius: 5000,
    suburbs: ['Melbourne', 'Docklands', 'Southbank', 'South Wharf', 'West Melbourne', 'East Melbourne'],
  },
  'melbourne-inner-north': {
    name: 'Melbourne Inner North', state: 'VIC', lat: -37.78, lng: 144.98, radius: 6000,
    suburbs: [
      'Fitzroy', 'Fitzroy North', 'Collingwood', 'Abbotsford', 'Brunswick',
      'Brunswick East', 'Brunswick West', 'Northcote', 'Thornbury', 'Carlton',
      'Carlton North', 'North Melbourne', 'Parkville', 'Clifton Hill', 'Princes Hill',
    ],
  },
  'melbourne-inner-south': {
    name: 'Melbourne Inner South', state: 'VIC', lat: -37.84, lng: 144.99, radius: 5000,
    suburbs: [
      'St Kilda', 'St Kilda East', 'St Kilda West', 'Balaclava', 'South Yarra',
      'Prahran', 'Windsor', 'Richmond', 'Cremorne', 'Albert Park', 'Middle Park',
      'South Melbourne', 'Port Melbourne', 'Elwood', 'Toorak',
    ],
  },
  'melbourne-east': {
    name: 'Melbourne East', state: 'VIC', lat: -37.82, lng: 145.12, radius: 15000,
    suburbs: [
      'Box Hill', 'Doncaster', 'Ringwood', 'Croydon', 'Mitcham', 'Blackburn',
      'Nunawading', 'Balwyn', 'Camberwell', 'Hawthorn', 'Kew', 'Glen Iris',
      'Burwood', 'Forest Hill', 'Vermont', 'Bulleen', 'Templestowe', 'Malvern',
    ],
  },
  'melbourne-north': {
    name: 'Melbourne North', state: 'VIC', lat: -37.73, lng: 145.05, radius: 15000,
    suburbs: [
      'Heidelberg', 'Preston', 'Reservoir', 'Epping', 'Bundoora', 'Coburg',
      'Pascoe Vale', 'Fawkner', 'Broadmeadows', 'Craigieburn', 'Glenroy',
      'Thomastown', 'Greensborough', 'Eltham', 'Ivanhoe', 'Mill Park', 'South Morang',
    ],
  },
  'melbourne-south-east': {
    name: 'Melbourne South East', state: 'VIC', lat: -37.98, lng: 145.22, radius: 20000,
    suburbs: [
      'Dandenong', 'Dandenong North', 'Frankston', 'Frankston South', 'Cranbourne',
      'Pakenham', 'Berwick', 'Narre Warren', 'Clayton', 'Oakleigh', 'Springvale',
      'Chelsea', 'Mentone', 'Cheltenham', 'Moorabbin', 'Bentleigh', 'Caulfield',
      'Glen Waverley', 'Mount Waverley', 'Carnegie', 'Mulgrave', 'Keysborough',
    ],
  },
  'mornington-peninsula': {
    name: 'Mornington Peninsula', state: 'VIC', lat: -38.22, lng: 145.05, radius: 20000,
    suburbs: [
      'Mornington', 'Rosebud', 'Sorrento', 'Rye', 'Hastings', 'Dromana',
      'Mount Martha', 'Portsea', 'Balnarring', 'Somerville', 'Mount Eliza',
      'Tyabb', 'Red Hill', 'Crib Point',
    ],
  },
  'yarra-valley': {
    name: 'Yarra Valley', state: 'VIC', lat: -37.65, lng: 145.52, radius: 20000,
    suburbs: [
      'Healesville', 'Lilydale', 'Yarra Glen', 'Warburton', 'Yarra Junction',
      'Coldstream', 'Chirnside Park', 'Mooroolbark', 'Seville', 'Woori Yallock',
      'Monbulk', 'Olinda',
    ],
  },

  // Phase 2 — Regional VIC (text-search discovery, distinct place names)
  bendigo: { name: 'Bendigo', state: 'VIC', lat: -36.7570, lng: 144.2794, radius: 20000 },
  shepparton: { name: 'Shepparton', state: 'VIC', lat: -36.3833, lng: 145.4000, radius: 15000 },
  warrnambool: { name: 'Warrnambool', state: 'VIC', lat: -38.3817, lng: 142.4856, radius: 15000 },
  mildura: { name: 'Mildura', state: 'VIC', lat: -34.1871, lng: 142.1586, radius: 15000 },

  // Phase 2b — Extended regional VIC towns
  colac: { name: 'Colac', state: 'VIC', lat: -38.3377, lng: 143.5853, radius: 12000 },
  portland: { name: 'Portland', state: 'VIC', lat: -38.3440, lng: 141.6040, radius: 12000 },
  horsham: { name: 'Horsham', state: 'VIC', lat: -36.7104, lng: 142.1999, radius: 12000 },
  hamilton: { name: 'Hamilton', state: 'VIC', lat: -37.7440, lng: 142.0199, radius: 12000 },
  ararat: { name: 'Ararat', state: 'VIC', lat: -37.2832, lng: 142.9285, radius: 10000 },
  stawell: { name: 'Stawell', state: 'VIC', lat: -37.0566, lng: 142.7766, radius: 10000 },
  wodonga: { name: 'Wodonga', state: 'VIC', lat: -36.1213, lng: 146.8880, radius: 15000 },
  wangaratta: { name: 'Wangaratta', state: 'VIC', lat: -36.3579, lng: 146.3076, radius: 12000 },
  traralgon: { name: 'Traralgon', state: 'VIC', lat: -38.1954, lng: 146.5401, radius: 15000 },
  sale: { name: 'Sale', state: 'VIC', lat: -38.1077, lng: 147.0658, radius: 12000 },
  bairnsdale: { name: 'Bairnsdale', state: 'VIC', lat: -37.8440, lng: 147.6077, radius: 12000 },
  echuca: { name: 'Echuca', state: 'VIC', lat: -36.1432, lng: 144.7517, radius: 12000 },
  'swan-hill': { name: 'Swan Hill', state: 'VIC', lat: -35.3378, lng: 143.5544, radius: 10000 },
  kerang: { name: 'Kerang', state: 'VIC', lat: -35.7237, lng: 143.9197, radius: 8000 },
  donald: { name: 'Donald', state: 'VIC', lat: -36.3667, lng: 142.9833, radius: 8000 },
  'ballarat-surrounds': { name: 'Ballarat Surrounds', state: 'VIC', lat: -37.7000, lng: 143.5000, radius: 20000 },
  'geelong-surrounds': { name: 'Geelong Surrounds', state: 'VIC', lat: -38.2000, lng: 144.0000, radius: 20000 },
  'apollo-bay': { name: 'Apollo Bay', state: 'VIC', lat: -38.7599, lng: 143.6715, radius: 10000 },
  'lakes-entrance': { name: 'Lakes Entrance', state: 'VIC', lat: -37.8811, lng: 147.9810, radius: 10000 },
  omeo: { name: 'Omeo', state: 'VIC', lat: -37.1001, lng: 147.5999, radius: 8000 },
  cobram: { name: 'Cobram', state: 'VIC', lat: -35.9222, lng: 145.6479, radius: 8000 },
  yarrawonga: { name: 'Yarrawonga', state: 'VIC', lat: -36.0224, lng: 145.9988, radius: 8000 },
  korumburra: { name: 'Korumburra', state: 'VIC', lat: -38.4333, lng: 145.8167, radius: 8000 },
  leongatha: { name: 'Leongatha', state: 'VIC', lat: -38.4742, lng: 145.9485, radius: 8000 },
  wonthaggi: { name: 'Wonthaggi', state: 'VIC', lat: -38.6024, lng: 145.5930, radius: 8000 },
  drouin: { name: 'Drouin', state: 'VIC', lat: -38.1333, lng: 145.8500, radius: 8000 },
  warragul: { name: 'Warragul', state: 'VIC', lat: -38.1636, lng: 145.9285, radius: 10000 },
  trafalgar: { name: 'Trafalgar', state: 'VIC', lat: -38.2167, lng: 146.1667, radius: 8000 },
  foster: { name: 'Foster', state: 'VIC', lat: -38.6500, lng: 146.1833, radius: 8000 },

  // Phase 3 — Tasmania (text-search discovery)
  hobart: { name: 'Hobart', state: 'TAS', lat: -42.8821, lng: 147.3272, radius: 20000 },
  launceston: { name: 'Launceston', state: 'TAS', lat: -41.4332, lng: 147.1441, radius: 20000 },
  devonport: { name: 'Devonport', state: 'TAS', lat: -41.1806, lng: 146.3479, radius: 15000 },
  burnie: { name: 'Burnie', state: 'TAS', lat: -41.0654, lng: 145.9048, radius: 15000 },

  // Phase 4 — South Australia (explicit suburb lists for the 4 quadrants)
  'adelaide-cbd': {
    name: 'Adelaide CBD', state: 'SA', lat: -34.9285, lng: 138.6007, radius: 5000,
    suburbs: ['Adelaide', 'North Adelaide'],
  },
  'adelaide-north': {
    name: 'Adelaide North', state: 'SA', lat: -34.75, lng: 138.62, radius: 15000,
    suburbs: [
      'Salisbury', 'Elizabeth', 'Tea Tree Gully', 'Modbury', 'Golden Grove',
      'Mawson Lakes', 'Parafield Gardens', 'Paralowie', 'Ingle Farm',
    ],
  },
  'adelaide-south': {
    name: 'Adelaide South', state: 'SA', lat: -35.13, lng: 138.51, radius: 15000,
    suburbs: [
      'Morphett Vale', 'Noarlunga Centre', 'Christies Beach', 'Seaford',
      'Aldinga Beach', 'Brighton', 'Marion', 'Hallett Cove',
    ],
  },
  'adelaide-east': {
    name: 'Adelaide East', state: 'SA', lat: -34.92, lng: 138.68, radius: 10000,
    suburbs: ['Norwood', 'Campbelltown', 'Burnside', 'Magill', 'Stepney', 'Kensington', 'Payneham'],
  },
  'adelaide-west': {
    name: 'Adelaide West', state: 'SA', lat: -34.92, lng: 138.52, radius: 10000,
    suburbs: ['Glenelg', 'West Lakes', 'Henley Beach', 'Semaphore', 'Port Adelaide', 'Findon', 'West Beach'],
  },
  barossa: { name: 'Barossa Valley', state: 'SA', lat: -34.52, lng: 138.94, radius: 20000 },
  'mount-gambier': { name: 'Mount Gambier', state: 'SA', lat: -37.83, lng: 140.78, radius: 15000 },

  // Phase 5 — NSW / QLD / WA / NT / ACT major cities
  'sydney-cbd': { name: 'Sydney CBD', state: 'NSW', lat: -33.8688, lng: 151.2093, radius: 5000 },
  'brisbane-cbd': { name: 'Brisbane CBD', state: 'QLD', lat: -27.4698, lng: 153.0251, radius: 5000 },
  'perth-cbd': { name: 'Perth CBD', state: 'WA', lat: -31.9505, lng: 115.8605, radius: 5000 },
  canberra: { name: 'Canberra', state: 'ACT', lat: -35.2809, lng: 149.1300, radius: 15000 },
  'gold-coast': { name: 'Gold Coast', state: 'QLD', lat: -28.0167, lng: 153.4000, radius: 20000 },
  darwin: { name: 'Darwin', state: 'NT', lat: -12.4634, lng: 130.8456, radius: 15000 },
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

  const suburbSet = new Map(); // key: region-scoped slug -> { name, state }
  let apiCalls = 0;

  if (Array.isArray(centre.suburbs) && centre.suburbs.length > 0) {
    // Explicit suburb list — skip Places text discovery, go straight to geocoding
    console.log(`  → using explicit suburb list (${centre.suburbs.length} suburbs)`);
    for (const name of centre.suburbs) {
      const suburbSlug = slugify(`${regionSlug}-${name}`);
      suburbSet.set(suburbSlug, { name, state: centre.state });
    }
  } else {
    // Discovery via Google Places text search
    const queries = [
      `hair salon in ${centre.name} ${centre.state}`,
      `barber in ${centre.name} ${centre.state}`,
      `hairdresser in ${centre.name} ${centre.state}`,
    ];
    for (const q of queries) {
      console.log(`  → searching: ${q}`);
      const places = await searchText(q, centre);
      apiCalls++;
      places.forEach((p) => {
        const s = suburbFromPlace(p);
        if (s) {
          // Prefix with regionSlug so Richmond in Melbourne and Richmond in Tassie
          // don't collide on the globally-unique suburbs.slug column.
          const suburbSlug = slugify(`${regionSlug}-${s}`);
          suburbSet.set(suburbSlug, { name: s, state: centre.state });
        }
      });
      await sleep(150);
    }
  }

  console.log(`  → found ${suburbSet.size} unique suburbs`);

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
