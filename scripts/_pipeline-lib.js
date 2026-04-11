/**
 * Shared helpers for the data pipeline scripts.
 */

const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const POOLER_HOST = 'aws-1-ap-southeast-2.pooler.supabase.com';
const POOLER_PORT = 6543;

function requireEnv(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`\n❌ Missing required env vars in .env.local: ${missing.join(', ')}\n`);
    if (missing.includes('GOOGLE_PLACES_API_KEY')) {
      console.error(
        'Add your Google Places API key to .env.local as GOOGLE_PLACES_API_KEY=YOUR_KEY_HERE',
      );
      console.error('Get one at: https://console.cloud.google.com/apis/credentials');
      console.error('Enable: Places API (New) + Maps JavaScript API\n');
    }
    process.exit(1);
  }
}

function pgClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!url || !password) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD must be set in .env.local');
  }
  const ref = new URL(url).hostname.split('.')[0];
  return new Client({
    connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(
      password,
    )}@${POOLER_HOST}:${POOLER_PORT}/postgres`,
    ssl: { rejectUnauthorized: false },
  });
}

function supabaseService() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normaliseAddress(addr) {
  return (addr || '')
    .toLowerCase()
    .replace(/^(shop|unit|suite|ste|level|lvl)\s*[\w-]+[,/\s]+/i, '')
    .replace(/,?\s*(vic|victoria)\b.*$/i, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nameSimilarity(a, b) {
  const normA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;
  if (normA.includes(normB) || normB.includes(normA)) return 0.9;
  const sa = new Set(normA.split(''));
  const sb = new Set(normB.split(''));
  const overlap = [...sa].filter((c) => sb.has(c)).length;
  return overlap / Math.max(sa.size, sb.size);
}

/**
 * Classify a Google Place into one of: hair_salon, barber, unisex, or null.
 * Returns null if the place should be excluded entirely.
 */
function classifyPlace(place) {
  const types = new Set(place.types || []);
  const name = (place.displayName?.text || place.name || '').toLowerCase();

  const excludedTypes = [
    'nail_salon',
    'spa',
    'tattoo_parlor',
    'gym',
    'pharmacy',
    'dentist',
    'doctor',
  ];
  if (excludedTypes.some((t) => types.has(t))) return null;

  const excludedKeywords = [
    'nail',
    'beauty',
    'wax',
    'lash',
    'brow',
    'tattoo',
    'ink',
    'massage',
    'physio',
    'chiro',
    'dental',
    'pharmacy',
    'chemist',
    'medical',
    'spa',
  ];
  const hasExcludedKeyword = excludedKeywords.some((kw) => {
    // "hair & beauty" is ok — only reject if the word is NOT alongside "hair"
    if (kw === 'beauty' && /hair/.test(name)) return false;
    return new RegExp(`\\b${kw}`, 'i').test(name);
  });
  if (hasExcludedKeyword && !/barber|hair|stylist/i.test(name)) return null;

  const includedTypes = ['hair_salon', 'barber_shop', 'hair_care', 'beauty_salon'];
  if (!includedTypes.some((t) => types.has(t)) && !/barber|hair|stylist|salon/i.test(name)) {
    return null;
  }

  const isBarber = types.has('barber_shop') || /\b(barber|shave|blade|fade)\b/i.test(name);
  const isHair = types.has('hair_salon') || types.has('hair_care') || /hair|salon/i.test(name);

  if (isBarber && !isHair) return 'barber';
  if (isHair && !isBarber) return 'hair_salon';
  if (isBarber && isHair) return 'unisex';
  return 'unisex';
}

module.exports = {
  POOLER_HOST,
  POOLER_PORT,
  requireEnv,
  pgClient,
  supabaseService,
  slugify,
  normaliseAddress,
  sleep,
  nameSimilarity,
  classifyPlace,
};
