#!/usr/bin/env node
/**
 * import-places.js — Import new salon/barber listings from Google Places API
 *
 * Searches for hair salons and barbers in underrepresented regions,
 * deduplicates against existing DB listings, and inserts new ones
 * with an 80%+ confidence filter.
 *
 * Usage:
 *   node scripts/import-places.js SA          # Import for one state
 *   node scripts/import-places.js ALL         # Import for all target states
 *   node scripts/import-places.js SA --dry    # Dry run (no DB writes)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DRY_RUN = process.argv.includes('--dry');
const TARGET_STATE = process.argv[2]?.toUpperCase();

if (!TARGET_STATE) {
  console.error('Usage: node scripts/import-places.js <STATE|ALL> [--dry]');
  process.exit(1);
}

// ── Target states and their search locations ──
// Each location is a lat/lng center point with a radius to search
// We use multiple points per region to get good coverage
const SEARCH_LOCATIONS = {
  SA: [
    // Adelaide metro - spread across suburbs we're thin on
    { lat: -34.9285, lng: 138.6007, radius: 5000, label: 'Adelaide CBD' },
    { lat: -34.8688, lng: 138.6460, radius: 8000, label: 'Adelaide North (Prospect/Enfield)' },
    { lat: -34.8230, lng: 138.6390, radius: 8000, label: 'Adelaide Far North (Salisbury)' },
    { lat: -34.7770, lng: 138.6650, radius: 8000, label: 'Adelaide Far North (Elizabeth)' },
    { lat: -34.9800, lng: 138.5500, radius: 8000, label: 'Adelaide South (Marion)' },
    { lat: -35.0200, lng: 138.5700, radius: 8000, label: 'Adelaide Far South (Hallett Cove)' },
    { lat: -34.9500, lng: 138.5000, radius: 6000, label: 'Adelaide West (Glenelg)' },
    { lat: -34.9200, lng: 138.7200, radius: 8000, label: 'Adelaide East (Norwood/Burnside)' },
    { lat: -34.8500, lng: 138.7300, radius: 8000, label: 'Adelaide Hills (Tea Tree Gully)' },
    // Regional SA
    { lat: -34.5500, lng: 138.9500, radius: 15000, label: 'Barossa Valley' },
    { lat: -37.8310, lng: 140.7830, radius: 10000, label: 'Mount Gambier' },
    { lat: -34.1900, lng: 138.0100, radius: 10000, label: 'Port Augusta' },
    { lat: -33.1900, lng: 138.0100, radius: 10000, label: 'Port Pirie' },
    { lat: -35.8300, lng: 137.6200, radius: 10000, label: 'Victor Harbor' },
    { lat: -34.7300, lng: 135.8600, radius: 10000, label: 'Whyalla' },
    { lat: -35.1200, lng: 138.5200, radius: 8000, label: 'Morphett Vale / Reynella' },
  ],
  ACT: [
    // Canberra spread - lots of separate town centres
    { lat: -35.2809, lng: 149.1300, radius: 5000, label: 'Canberra City' },
    { lat: -35.2400, lng: 149.0700, radius: 6000, label: 'Belconnen' },
    { lat: -35.2400, lng: 149.1600, radius: 6000, label: 'Gungahlin' },
    { lat: -35.3400, lng: 149.0900, radius: 6000, label: 'Woden' },
    { lat: -35.3900, lng: 149.0900, radius: 6000, label: 'Tuggeranong' },
    { lat: -35.2500, lng: 149.1200, radius: 5000, label: 'Dickson/Braddon' },
    { lat: -35.3100, lng: 149.1400, radius: 5000, label: 'Kingston/Manuka' },
    { lat: -35.3500, lng: 149.1700, radius: 6000, label: 'Queanbeyan (border)' },
    { lat: -35.1900, lng: 149.1300, radius: 6000, label: 'Mitchell/Casey' },
  ],
  NSW: [
    // Regional NSW gaps — Sydney metro is well covered
    { lat: -32.9300, lng: 151.7800, radius: 10000, label: 'Newcastle wider' },
    { lat: -33.4200, lng: 151.3400, radius: 10000, label: 'Central Coast wider' },
    { lat: -34.4400, lng: 150.8800, radius: 8000, label: 'Wollongong wider' },
    { lat: -35.1100, lng: 147.3700, radius: 10000, label: 'Wagga wider' },
    { lat: -30.5000, lng: 151.6500, radius: 10000, label: 'Armidale' },
    { lat: -32.2400, lng: 148.6100, radius: 10000, label: 'Mudgee' },
    { lat: -31.0900, lng: 150.9300, radius: 10000, label: 'Tamworth wider' },
    { lat: -28.8100, lng: 153.2800, radius: 8000, label: 'Ballina wider' },
    { lat: -29.4400, lng: 153.3500, radius: 8000, label: 'Grafton' },
    { lat: -33.7600, lng: 150.6900, radius: 8000, label: 'Penrith/Blue Mountains' },
    { lat: -34.0500, lng: 150.6900, radius: 8000, label: 'Campbelltown wider' },
    { lat: -33.8400, lng: 151.2100, radius: 5000, label: 'Sydney CBD fill' },
    { lat: -32.7500, lng: 152.0400, radius: 8000, label: 'Maitland/Cessnock' },
    { lat: -31.4300, lng: 152.9100, radius: 8000, label: 'Port Macquarie wider' },
    { lat: -30.2900, lng: 153.1100, radius: 8000, label: 'Coffs Harbour wider' },
  ],
  TAS: [
    // Broader coverage of existing regions
    { lat: -42.8821, lng: 147.3272, radius: 10000, label: 'Hobart wider' },
    { lat: -42.8500, lng: 147.2500, radius: 8000, label: 'Hobart West (Glenorchy)' },
    { lat: -42.9700, lng: 147.3300, radius: 8000, label: 'Hobart South (Kingston)' },
    { lat: -41.4332, lng: 147.1441, radius: 10000, label: 'Launceston wider' },
    { lat: -41.1800, lng: 146.3600, radius: 10000, label: 'Devonport wider' },
    { lat: -41.0500, lng: 145.9100, radius: 10000, label: 'Burnie wider' },
    { lat: -42.1500, lng: 146.2500, radius: 10000, label: 'Queenstown area' },
  ],
  NT: [
    { lat: -12.4634, lng: 130.8456, radius: 10000, label: 'Darwin wider' },
    { lat: -12.4300, lng: 130.8700, radius: 8000, label: 'Darwin North (Casuarina)' },
    { lat: -12.5000, lng: 130.9800, radius: 8000, label: 'Palmerston' },
    { lat: -23.6980, lng: 133.8807, radius: 10000, label: 'Alice Springs' },
    { lat: -14.4600, lng: 132.2600, radius: 10000, label: 'Katherine' },
  ],
};

// ── Confidence scoring ──

// Google Places types that strongly indicate hair/barber
const HIGH_CONFIDENCE_TYPES = ['hair_care', 'barber_shop'];
// Generic beauty types that need name validation
const MEDIUM_CONFIDENCE_TYPES = ['beauty_salon'];
// Types that indicate NOT hair
const REJECT_TYPES = ['spa', 'nail_salon', 'tattoo_parlor', 'pet_store', 'veterinary_care'];

// Keywords that boost confidence
const HAIR_KEYWORDS = /\b(hair|barber|salon|stylist|hairdress|cuts?\b|colour|color|fade|shave|blowdr|blow.?dry|tress|locks|mane|trim|clip|curl|perm|braid|weave|extension)/i;
const BARBER_KEYWORDS = /\b(barber|barbershop|fade|shave|mens?\s+hair|groom|chop\s*shop|clip\s*joint)/i;

// Keywords that reduce confidence
const NOT_HAIR_KEYWORDS = /\b(nail|spa|massage|wax|laser|tattoo|piercing|pet\s+groom|dog\s+groom|dental|physio|chiro|medical|vet|florist|auto|mechanic)/i;
const NOT_HAIR_PRIMARY = /^(nail|spa|massage|wax|laser|tattoo|pet|dog)/i;

function calculateConfidence(place) {
  let score = 50; // baseline
  const name = place.displayName?.text || '';
  const types = place.types || [];

  // Type-based scoring
  if (types.some(t => HIGH_CONFIDENCE_TYPES.includes(t))) {
    score += 30;
  }
  if (types.some(t => MEDIUM_CONFIDENCE_TYPES.includes(t))) {
    score += 10;
  }
  if (types.some(t => REJECT_TYPES.includes(t))) {
    score -= 40;
  }

  // Name-based scoring
  if (HAIR_KEYWORDS.test(name)) score += 20;
  if (BARBER_KEYWORDS.test(name)) score += 15;
  if (NOT_HAIR_KEYWORDS.test(name)) score -= 30;
  if (NOT_HAIR_PRIMARY.test(name)) score -= 50;

  // Business status
  if (place.businessStatus === 'CLOSED_TEMPORARILY' || place.businessStatus === 'CLOSED_PERMANENTLY') {
    score = 0;
  }

  return Math.max(0, Math.min(100, score));
}

function classifyBusinessType(place) {
  const name = (place.displayName?.text || '').toLowerCase();
  const types = place.types || [];

  if (types.includes('barber_shop') || BARBER_KEYWORDS.test(name)) {
    return 'barber';
  }
  if (/\bunisex\b/i.test(name) || /\bmen.*women\b/i.test(name) || /\beveryone\b/i.test(name)) {
    return 'unisex';
  }
  return 'hair_salon';
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Google Places API (New) ──

async function searchPlaces(location, query) {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  const body = {
    includedTypes: ['hair_care', 'beauty_salon', 'barber_shop'],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: location.lat, longitude: location.lng },
        radius: location.radius,
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.location,places.nationalPhoneNumber,places.websiteUri,places.businessStatus,places.addressComponents',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  Places API error for ${location.label}: ${response.status} ${err}`);
    return [];
  }

  const data = await response.json();
  return data.places || [];
}

// Also search with text query for broader coverage
async function textSearchPlaces(location, query) {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const body = {
    textQuery: query,
    maxResultCount: 20,
    locationBias: {
      circle: {
        center: { latitude: location.lat, longitude: location.lng },
        radius: location.radius,
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.location,places.nationalPhoneNumber,places.websiteUri,places.businessStatus,places.addressComponents',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  Text search error for ${query} at ${location.label}: ${response.status} ${err}`);
    return [];
  }

  const data = await response.json();
  return data.places || [];
}

// ── Region matching ──

// Map postcodes to regions (loaded from DB)
let regionMap = {}; // state -> [{ id, name, slug, suburbs: [{ name, postcode }] }]
let existingPlaceIds = new Set();
let existingNameSuburbs = new Set(); // "name|suburb" for fuzzy dedup

async function loadExistingData(states) {
  console.log('Loading existing businesses and regions...');

  // Load all regions for target states
  const { data: regions } = await supabase
    .from('regions')
    .select('id, name, slug, state')
    .in('state', states);

  for (const r of regions) {
    if (!regionMap[r.state]) regionMap[r.state] = [];
    regionMap[r.state].push(r);
  }

  // Load existing google_place_ids and name+suburb combos for dedup
  for (const state of states) {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('google_place_id, name, suburb')
      .eq('state', state);

    for (const b of businesses) {
      if (b.google_place_id) existingPlaceIds.add(b.google_place_id);
      existingNameSuburbs.add(`${b.name.toLowerCase().trim()}|${b.suburb.toLowerCase().trim()}`);
    }
  }

  console.log(`  Loaded ${Object.values(regionMap).flat().length} regions`);
  console.log(`  Loaded ${existingPlaceIds.size} existing place IDs`);
  console.log(`  Loaded ${existingNameSuburbs.size} existing name|suburb combos`);
}

function extractAddressComponents(place) {
  const components = place.addressComponents || [];
  let suburb = '';
  let state = '';
  let postcode = '';
  let streetNumber = '';
  let route = '';

  for (const c of components) {
    const types = c.types || [];
    if (types.includes('locality')) suburb = c.longText;
    if (types.includes('administrative_area_level_1')) state = c.shortText;
    if (types.includes('postal_code')) postcode = c.longText;
    if (types.includes('street_number')) streetNumber = c.longText;
    if (types.includes('route')) route = c.longText;
  }

  const addressLine1 = [streetNumber, route].filter(Boolean).join(' ') ||
    (place.formattedAddress?.split(',')[0] || '');

  return { suburb, state, postcode, addressLine1 };
}

// Map state abbreviation from Google (e.g., "SA") to our DB state values
function normalizeState(googleState) {
  const map = {
    'SA': 'SA', 'NSW': 'NSW', 'VIC': 'VIC', 'QLD': 'QLD',
    'WA': 'WA', 'TAS': 'TAS', 'ACT': 'ACT', 'NT': 'NT',
  };
  return map[googleState] || googleState;
}

function findRegion(state, suburb) {
  const regions = regionMap[state] || [];
  if (regions.length === 1) return regions[0];

  // For ACT and NT there's only one region each
  if (state === 'ACT') return regions.find(r => r.slug === 'canberra');
  if (state === 'NT') return regions.find(r => r.slug === 'darwin');

  // For SA, match by region name heuristics
  if (state === 'SA') {
    const s = suburb.toLowerCase();
    // Adelaide CBD postcodes / names
    if (['adelaide', 'north adelaide'].includes(s)) {
      return regions.find(r => r.slug === 'adelaide-cbd');
    }
    // Mount Gambier area
    if (['mount gambier', 'mt gambier', 'millicent', 'penola', 'naracoorte'].includes(s)) {
      return regions.find(r => r.slug === 'mount-gambier');
    }
    // Barossa
    if (['tanunda', 'nuriootpa', 'angaston', 'lyndoch', 'barossa', 'gawler', 'williamstown'].includes(s)) {
      return regions.find(r => r.slug === 'barossa');
    }
    // North/South/East/West Adelaide — use lat-based heuristic (caller can override)
    // Default: check if suburb name matches any region pattern
    if (/north|salisbury|elizabeth|tea tree|modbury|golden grove|mawson|parafield|gilles plains|ingle farm|para hills/i.test(s)) {
      return regions.find(r => r.slug === 'adelaide-north');
    }
    if (/south|marion|hallett|reynella|morphett|christies|happy valley|aberfoyle|flagstaff/i.test(s)) {
      return regions.find(r => r.slug === 'adelaide-south');
    }
    if (/east|norwood|burnside|magill|campbelltown|newton|rostrevor|paradise|athelstone|glen osmond/i.test(s)) {
      return regions.find(r => r.slug === 'adelaide-east');
    }
    if (/west|henley|glenelg|findon|port adelaide|semaphore|largs|west beach|mile end|torrensville/i.test(s)) {
      return regions.find(r => r.slug === 'adelaide-west');
    }
    // Default to CBD
    return regions.find(r => r.slug === 'adelaide-cbd');
  }

  // For TAS
  if (state === 'TAS') {
    const s = suburb.toLowerCase();
    if (/hobart|sandy bay|kingston|glenorchy|moonah|claremont|bridgewater|sorell|rosny|howrah|bellerive/i.test(s)) {
      return regions.find(r => r.slug === 'hobart');
    }
    if (/launceston|invermay|mowbray|ravenswood|newnham|prospect|kings meadows|riverside/i.test(s)) {
      return regions.find(r => r.slug === 'launceston');
    }
    if (/devonport|spreyton|east devonport|latrobe/i.test(s)) {
      return regions.find(r => r.slug === 'devonport');
    }
    if (/burnie|cooee|somerset|wynyard|ulverstone/i.test(s)) {
      return regions.find(r => r.slug === 'burnie');
    }
    return regions.find(r => r.slug === 'hobart'); // default
  }

  // For NSW — match by region slug patterns
  if (state === 'NSW') {
    const s = suburb.toLowerCase();
    // Major Sydney regions are well-mapped by existing data
    // Regional NSW
    if (/newcastle|charlestown|wallsend|lambton|hamilton|maitland|cessnock|raymond terrace/i.test(s)) {
      return regions.find(r => r.slug === 'newcastle');
    }
    if (/gosford|terrigal|erina|tuggerah|wyong|the entrance|bateau bay|woy woy/i.test(s)) {
      return regions.find(r => r.slug === 'central-coast');
    }
    if (/wollongong|corrimal|fairy meadow|dapto|shellharbour|thirroul|bulli/i.test(s)) {
      return regions.find(r => r.slug === 'wollongong');
    }
    if (/wagga|forest hill|kooringal|turvey park/i.test(s)) {
      return regions.find(r => r.slug === 'wagga-wagga');
    }
    if (/tamworth|calala|oxley vale|west tamworth/i.test(s)) {
      return regions.find(r => r.slug === 'tamworth');
    }
    if (/port macquarie|wauchope/i.test(s)) {
      return regions.find(r => r.slug === 'port-macquarie');
    }
    if (/coffs harbour|woolgoolga|sawtell|toormina/i.test(s)) {
      return regions.find(r => r.slug === 'coffs-harbour');
    }
    if (/ballina|lennox head|alstonville/i.test(s)) {
      return regions.find(r => r.slug === 'ballina');
    }
    if (/tweed|coolangatta|murwillumbah|kingscliff/i.test(s)) {
      return regions.find(r => r.slug === 'tweed-heads');
    }
    if (/lismore|goonellabah|casino/i.test(s)) {
      return regions.find(r => r.slug === 'lismore');
    }
    if (/dubbo|wellington/i.test(s)) {
      return regions.find(r => r.slug === 'dubbo');
    }
    if (/orange|blayney/i.test(s)) {
      return regions.find(r => r.slug === 'orange');
    }
    if (/bathurst|kelso/i.test(s)) {
      return regions.find(r => r.slug === 'bathurst');
    }
    if (/byron|mullumbimb|brunswick/i.test(s)) {
      return regions.find(r => r.slug === 'byron-bay');
    }
    if (/albury|lavington|thurgoona/i.test(s)) {
      return regions.find(r => r.slug === 'albury');
    }
    if (/griffith|leeton/i.test(s)) {
      return regions.find(r => r.slug === 'griffith');
    }
    // Sydney suburbs — try to match existing regions
    if (/parramatta|blacktown|castle hill|baulkham|seven hills|rouse hill|penrith|blue mountain|katoomba|springwood/i.test(s)) {
      return regions.find(r => r.slug === 'sydney-west');
    }
    if (/campbelltown|liverpool|bankstown|fairfield|cabramatta|ingleburn|macarthur/i.test(s)) {
      return regions.find(r => r.slug === 'sydney-south-west');
    }
    if (/manly|dee why|mona vale|avalon|narrabeen|freshwater|brookvale|warriewood/i.test(s)) {
      return regions.find(r => r.slug === 'sydney-northern-beaches');
    }
    if (/chatswood|north sydney|st leonards|lane cove|hornsby|turramurra|pymble|gordon|willoughby/i.test(s)) {
      return regions.find(r => r.slug === 'sydney-north-shore');
    }
    if (/bondi|randwick|double bay|coogee|maroubra|rose bay|bronte|vaucluse/i.test(s)) {
      return regions.find(r => r.slug === 'sydney-eastern-suburbs');
    }
    if (/marrickville|newtown|ashfield|burwood|strathfield|five dock|leichhardt|balmain|annandale/i.test(s)) {
      return regions.find(r => r.slug === 'sydney-inner-west');
    }
    if (/hurstville|kogarah|sutherland|cronulla|miranda|rockdale|sans souci/i.test(s)) {
      return regions.find(r => r.slug === 'sydney-inner-south');
    }
    if (/sydney|haymarket|surry hills|darlinghurst|potts point|pyrmont|ultimo|redfern|chippendale/i.test(s)) {
      return regions.find(r => r.slug === 'sydney-cbd');
    }
    // Default for NSW — Sydney CBD
    return regions.find(r => r.slug === 'sydney-cbd');
  }

  // Fallback: first region for that state
  return regions[0];
}

// ── Main import logic ──

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function importForState(state) {
  const locations = SEARCH_LOCATIONS[state];
  if (!locations) {
    console.log(`No search locations configured for ${state}`);
    return { imported: 0, skipped: 0, lowConfidence: 0 };
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`STATE: ${state} — ${locations.length} search locations`);
  console.log('═'.repeat(60));

  const allPlaces = new Map(); // place_id -> place data
  let apiCalls = 0;

  // Search each location with both nearby and text search
  for (const loc of locations) {
    console.log(`\n  Searching: ${loc.label}...`);

    // Nearby search (type-filtered)
    const nearby = await searchPlaces(loc);
    apiCalls++;
    for (const p of nearby) {
      if (p.id && !allPlaces.has(p.id)) allPlaces.set(p.id, p);
    }
    console.log(`    Nearby: ${nearby.length} results`);

    await sleep(200);

    // Text search for "hairdresser" (catches ones not typed as hair_care)
    const textResults = await textSearchPlaces(loc, 'hairdresser');
    apiCalls++;
    let newFromText = 0;
    for (const p of textResults) {
      if (p.id && !allPlaces.has(p.id)) {
        allPlaces.set(p.id, p);
        newFromText++;
      }
    }
    console.log(`    Text "hairdresser": ${textResults.length} results (${newFromText} new)`);

    await sleep(200);

    // Text search for "barber"
    const barberResults = await textSearchPlaces(loc, 'barber');
    apiCalls++;
    let newFromBarber = 0;
    for (const p of barberResults) {
      if (p.id && !allPlaces.has(p.id)) {
        allPlaces.set(p.id, p);
        newFromBarber++;
      }
    }
    console.log(`    Text "barber": ${barberResults.length} results (${newFromBarber} new)`);

    await sleep(200);
  }

  console.log(`\n  Total unique places found: ${allPlaces.size} (${apiCalls} API calls)`);

  // Filter and process
  let imported = 0;
  let skipped = 0;
  let lowConfidence = 0;
  let duplicates = 0;
  const toInsert = [];

  for (const [placeId, place] of allPlaces) {
    const name = place.displayName?.text || '';
    const addr = extractAddressComponents(place);

    // Skip if wrong state
    const placeState = normalizeState(addr.state);
    if (placeState !== state && state !== 'ALL') {
      skipped++;
      continue;
    }

    // Dedup against existing
    if (existingPlaceIds.has(placeId)) {
      duplicates++;
      continue;
    }
    const nameSuburbKey = `${name.toLowerCase().trim()}|${addr.suburb.toLowerCase().trim()}`;
    if (existingNameSuburbs.has(nameSuburbKey)) {
      duplicates++;
      continue;
    }

    // Confidence check
    const confidence = calculateConfidence(place);
    if (confidence < 80) {
      lowConfidence++;
      if (confidence >= 60) {
        console.log(`    SKIP (${confidence}%): ${name} — ${addr.suburb} [${(place.types || []).join(', ')}]`);
      }
      continue;
    }

    // Find region
    const region = findRegion(placeState, addr.suburb);
    if (!region) {
      console.log(`    SKIP: no region for ${name} in ${addr.suburb}, ${placeState}`);
      skipped++;
      continue;
    }

    const businessType = classifyBusinessType(place);
    const slug = slugify(`${name}-${addr.suburb}`);

    toInsert.push({
      name,
      slug,
      business_type: businessType,
      address_line1: addr.addressLine1,
      suburb: addr.suburb,
      state: placeState,
      postcode: addr.postcode,
      lat: place.location?.latitude || null,
      lng: place.location?.longitude || null,
      phone: place.nationalPhoneNumber || null,
      website_url: place.websiteUri || null,
      google_place_id: placeId,
      google_business_status: place.businessStatus || 'OPERATIONAL',
      region_id: region.id,
      status: 'active',
      is_claimed: false,
      is_mobile: false,
      confidence_score: confidence,
    });

    // Track for dedup within this run
    existingPlaceIds.add(placeId);
    existingNameSuburbs.add(nameSuburbKey);
  }

  console.log(`\n  Results for ${state}:`);
  console.log(`    New to import: ${toInsert.length}`);
  console.log(`    Duplicates:    ${duplicates}`);
  console.log(`    Low confidence: ${lowConfidence}`);
  console.log(`    Wrong state:   ${skipped}`);

  // Insert in batches of 50
  if (!DRY_RUN && toInsert.length > 0) {
    console.log(`\n  Inserting ${toInsert.length} businesses...`);
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50);
      const { data, error } = await supabase
        .from('businesses')
        .upsert(batch, { onConflict: 'slug', ignoreDuplicates: true })
        .select('id');

      if (error) {
        console.error(`    Insert error (batch ${i}): ${error.message}`);
        // Try one by one
        for (const biz of batch) {
          const { error: singleErr } = await supabase
            .from('businesses')
            .upsert(biz, { onConflict: 'slug', ignoreDuplicates: true });
          if (singleErr) {
            console.error(`    Skip ${biz.name}: ${singleErr.message}`);
          } else {
            imported++;
          }
        }
      } else {
        imported += batch.length;
        console.log(`    Inserted batch ${Math.floor(i/50)+1}: ${batch.length} businesses`);
      }
    }
  } else if (DRY_RUN) {
    console.log('\n  DRY RUN — no DB writes');
    for (const b of toInsert.slice(0, 10)) {
      console.log(`    Would insert: ${b.name} (${b.suburb}) — ${b.business_type} [${b.confidence_score}%]`);
    }
    if (toInsert.length > 10) console.log(`    ... and ${toInsert.length - 10} more`);
    imported = toInsert.length;
  }

  return { imported, skipped, lowConfidence, duplicates };
}

// ── Entry point ──

async function main() {
  console.log('═'.repeat(60));
  console.log('findme.hair — Google Places Import');
  console.log('═'.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Target: ${TARGET_STATE}`);
  console.log();

  const states = TARGET_STATE === 'ALL'
    ? Object.keys(SEARCH_LOCATIONS)
    : [TARGET_STATE];

  if (!SEARCH_LOCATIONS[states[0]] && TARGET_STATE !== 'ALL') {
    console.error(`No search locations configured for ${TARGET_STATE}`);
    console.error(`Available: ${Object.keys(SEARCH_LOCATIONS).join(', ')}`);
    process.exit(1);
  }

  await loadExistingData(states);

  const totals = { imported: 0, skipped: 0, lowConfidence: 0, duplicates: 0 };

  for (const state of states) {
    const result = await importForState(state);
    totals.imported += result.imported;
    totals.skipped += result.skipped || 0;
    totals.lowConfidence += result.lowConfidence;
    totals.duplicates += result.duplicates || 0;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('═'.repeat(60));
  console.log(`  Total imported:      ${totals.imported}`);
  console.log(`  Total duplicates:    ${totals.duplicates}`);
  console.log(`  Total low confidence: ${totals.lowConfidence}`);
  console.log(`  Total skipped:       ${totals.skipped}`);

  if (!DRY_RUN && totals.imported > 0) {
    console.log('\n  Next step: run enrichment on new listings');
    console.log('  node scripts/enrich-national.js --resume');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
