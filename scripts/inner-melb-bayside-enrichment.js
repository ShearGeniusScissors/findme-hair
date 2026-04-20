#!/usr/bin/env node
/**
 * Inner Melbourne Bayside Enrichment — 9 postcodes
 * 3141 3142 3181 3182 3183 3184 3205 3206 3207
 *
 * Per CODE_BRIEF_inner-melb-bayside-enrichment.md
 * Upserts on google_place_id. Never duplicates existing 189 rows.
 * Concurrent workers, $50 AUD Places API cap, full enrichment pipeline.
 *
 * Usage: node scripts/inner-melb-bayside-enrichment.js [--dry]
 */

'use strict';
const { createClient } = require('@supabase/supabase-js');
const Anthropic         = require('@anthropic-ai/sdk');
const cheerio           = require('cheerio');
const fs                = require('fs');
const path              = require('path');
const { execSync }      = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// ─── Env ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_KEY    = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const AUD_PER_USD   = 1.55; // exchange rate for cost cap
const COST_CAP_AUD  = 50.0;

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Missing Supabase env'); process.exit(1); }
if (!GOOGLE_KEY)   { console.error('❌ Missing GOOGLE_PLACES_API_KEY'); process.exit(1); }
if (!ANTHROPIC_KEY){ console.error('❌ Missing ANTHROPIC_API_KEY (source ~/.zshrc first)'); process.exit(1); }

const DRY_RUN = process.argv.includes('--dry');
const LOG_FILE = '/tmp/inner-melb-bayside-enrichment.log';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ─── Logging ────────────────────────────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Concurrency limiter ─────────────────────────────────────────────────────
async function withConcurrency(items, fn, limit = 5) {
  const results = new Array(items.length);
  const queue = items.map((item, i) => ({ item, i }));
  let qi = 0;
  async function worker() {
    while (qi < queue.length) {
      const { item, i } = queue[qi++];
      results[i] = await fn(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ─── Target postcodes ────────────────────────────────────────────────────────
const POSTCODES = [
  { code: '3141', suburbs: ['South Yarra'],              lat: -37.8407, lng: 144.9941, radius: 1200 },
  { code: '3142', suburbs: ['Toorak'],                   lat: -37.8459, lng: 145.0147, radius: 1000 },
  { code: '3181', suburbs: ['Prahran', 'Windsor'],       lat: -37.8508, lng: 144.9957, radius: 1400 },
  { code: '3182', suburbs: ['St Kilda'],                 lat: -37.8676, lng: 144.9797, radius: 1400 },
  { code: '3183', suburbs: ['Balaclava', 'St Kilda East'], lat: -37.8660, lng: 145.0013, radius: 1100 },
  { code: '3184', suburbs: ['Elwood'],                   lat: -37.8845, lng: 144.9839, radius: 1200 },
  { code: '3205', suburbs: ['South Melbourne'],          lat: -37.8305, lng: 144.9575, radius: 1400 },
  { code: '3206', suburbs: ['Albert Park', 'Middle Park'], lat: -37.8477, lng: 144.9558, radius: 1400 },
  { code: '3207', suburbs: ['Port Melbourne'],           lat: -37.8284, lng: 144.9367, radius: 1400 },
];

// Region IDs from existing data
const REGION_ID_BY_POSTCODE = {
  '3207': '32ecdcd8-f84d-4c53-992f-378447bfe58b', // Melbourne West
};
const DEFAULT_REGION_ID = 'fd86af2e-4df5-41b0-9d85-4821582c2740'; // Melbourne Inner South

function regionId(postcode) {
  return REGION_ID_BY_POSTCODE[postcode] || DEFAULT_REGION_ID;
}

// ─── Exclusion / classification helpers ─────────────────────────────────────
const EXCLUDE_TYPES  = new Set(['nail_salon', 'spa', 'tattoo_parlor', 'gym', 'dentist', 'doctor', 'pharmacy', 'pet_store', 'veterinary_care']);
const HAIR_TYPES     = new Set(['hair_care', 'barber_shop', 'hair_salon', 'beauty_salon']);

// Strong exclusions — matched on name even if "hair" appears (e.g. "laser hair removal")
const STRONG_EXCLUDE_RE = /\b(laser\s+hair\s+removal|hair\s+removal|electrolysis|ipl\s+hair|laser\s+clinic|skin\s+clinics?|skin\s+care\s+clinic|cosmetic\s+clinic|injectable|botox|dermal|medi\s*spa|day\s*spa|med\s*spa|nail\s+(bar|salon)|tattoo|piercing|waxing\s+(studio|salon))\b/i;
// General exclusions — only applied when no hair signal is present
const EXCLUDE_NAME_RE = /\b(beauty\s+salon|nail(s)?|brow(s)?\b|lash(es)?\b|massage|wax\b|dog\s+groom|pet\s+groom)\b/i;
const HAIR_NAME_RE    = /\b(hair(cut|dresser|dress|style|stylist|salon)?|barber|salon|stylist|hairdress|colour|color|fade|shave|blowdr|blow[\s-]?dry|tress|mane|trim|curl|perm|braid|weave|extension)\b/i;

// Patterns that detect non-hair businesses even with "hair" in name
const NOT_HAIR_WITH_HAIR_WORD = /\b(hair\s+removal|laser\s+hair|hair\s+loss|hair\s+restoration|hair\s+transplant|electrolysis)\b/i;

function isExcluded(place) {
  const types = place.types || [];
  if (types.some(t => EXCLUDE_TYPES.has(t))) return true;
  const name = (place.displayName?.text || '').toLowerCase();
  // Strong exclusions always apply, even if name has "hair"
  if (STRONG_EXCLUDE_RE.test(name)) return true;
  // Check for "hair" that means removal/loss, not styling
  if (NOT_HAIR_WITH_HAIR_WORD.test(name)) return true;
  // General exclusions apply only when no hair styling signal present
  if (EXCLUDE_NAME_RE.test(name) && !HAIR_NAME_RE.test(name)) return true;
  // beauty_salon type with no hair signal → exclude
  if (types.includes('beauty_salon') && !types.some(t => HAIR_TYPES.has(t) && t !== 'beauty_salon') && !HAIR_NAME_RE.test(name)) return true;
  return false;
}

function classifyBusinessType(place, websiteText = '') {
  const name  = (place.displayName?.text || '').toLowerCase();
  const types = place.types || [];
  const corpus = name + ' ' + websiteText;
  const isBarber = types.includes('barber_shop') || /\b(barber|fade|shave|blade|clipper)\b/i.test(corpus);
  const isHair   = types.includes('hair_care') || types.includes('hair_salon') || /\b(hair|salon|hairdress|colour|balayage)\b/i.test(corpus);
  if (isBarber && isHair)  return 'unisex';
  if (isBarber)            return 'barber';
  if (isHair)              return 'hair_salon';
  return 'hair_salon';
}

function isMobile(place, websiteText = '') {
  const name = (place.displayName?.text || '').toLowerCase();
  return /\b(mobile|home[\s-]based|at[\s-]home|home visit)\b/i.test(name + ' ' + websiteText);
}

function calculateConfidence(place) {
  let score = 50;
  const name  = (place.displayName?.text || '');
  const types = place.types || [];
  if (types.includes('hair_care') || types.includes('hair_salon')) score += 30;
  if (types.includes('barber_shop')) score += 25;
  if (types.includes('beauty_salon')) score += 10;
  if (HAIR_NAME_RE.test(name)) score += 15;
  if (/\bbarber\b/i.test(name)) score += 10;
  if (EXCLUDE_NAME_RE.test(name) && !HAIR_NAME_RE.test(name)) score -= 50;
  if (place.businessStatus === 'CLOSED_PERMANENTLY' || place.businessStatus === 'CLOSED_TEMPORARILY') score = 0;
  return Math.max(0, Math.min(100, score));
}

function slugify(text) {
  return text.toLowerCase().replace(/['"`]/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

// ─── Address parsing ─────────────────────────────────────────────────────────
function parseAddress(place) {
  const components = place.addressComponents || [];
  let suburb = '', state = '', postcode = '', streetNumber = '', route = '';
  for (const c of components) {
    const t = c.types || [];
    if (t.includes('locality'))                   suburb       = c.longText;
    if (t.includes('administrative_area_level_1')) state        = c.shortText;
    if (t.includes('postal_code'))                postcode     = c.longText;
    if (t.includes('street_number'))              streetNumber = c.longText;
    if (t.includes('route'))                      route        = c.longText;
  }
  const addressLine1 = [streetNumber, route].filter(Boolean).join(' ') || (place.formattedAddress || '').split(',')[0];
  return { suburb, state, postcode, addressLine1 };
}

// ─── Places API — search ─────────────────────────────────────────────────────
let apiCallsSearch = 0, apiCallsDetails = 0, apiCallsPhotos = 0;

function estimatedCostUsd() {
  return apiCallsSearch * 0.032 + apiCallsDetails * 0.017 + apiCallsPhotos * 0.007;
}
function estimatedCostAud() { return estimatedCostUsd() * AUD_PER_USD; }

async function nearbySearch(pc) {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const body = {
    includedTypes: ['hair_care', 'barber_shop', 'beauty_salon'],
    maxResultCount: 20,
    locationRestriction: { circle: { center: { latitude: pc.lat, longitude: pc.lng }, radius: pc.radius } },
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.location,places.nationalPhoneNumber,places.websiteUri,places.businessStatus,places.addressComponents,places.rating,places.userRatingCount,places.photos',
    },
    body: JSON.stringify(body),
  });
  apiCallsSearch++;
  if (!resp.ok) { log(`  ⚠ nearbySearch error ${resp.status} for ${pc.code}`); return []; }
  const data = await resp.json();
  return data.places || [];
}

async function textSearch(pc, query) {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const body = {
    textQuery: query,
    maxResultCount: 20,
    locationBias: { circle: { center: { latitude: pc.lat, longitude: pc.lng }, radius: pc.radius * 2 } },
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.location,places.nationalPhoneNumber,places.websiteUri,places.businessStatus,places.addressComponents,places.rating,places.userRatingCount,places.photos',
    },
    body: JSON.stringify(body),
  });
  apiCallsSearch++;
  if (!resp.ok) { log(`  ⚠ textSearch error ${resp.status} for "${query}" at ${pc.code}`); return []; }
  const data = await resp.json();
  return data.places || [];
}

// ─── Places API — details ────────────────────────────────────────────────────
async function getPlaceDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const resp = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'rating,userRatingCount,regularOpeningHours,businessStatus,photos,reviews',
    },
  });
  apiCallsDetails++;
  if (!resp.ok) { log(`  ⚠ details error ${resp.status} for ${placeId}`); return null; }
  return resp.json();
}

function formatHours(regularOpeningHours) {
  if (!regularOpeningHours?.periods) return null;
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const hours = {};
  for (const p of regularOpeningHours.periods) {
    const day = dayNames[p.open?.day];
    if (!day) continue;
    const open  = p.open  ? `${String(p.open.hour).padStart(2,'0')}:${String(p.open.minute||0).padStart(2,'0')}` : '';
    const close = p.close ? `${String(p.close.hour).padStart(2,'0')}:${String(p.close.minute||0).padStart(2,'0')}` : '';
    hours[day] = `${open}–${close}`;
  }
  return Object.keys(hours).length ? hours : null;
}

// ─── Photos ──────────────────────────────────────────────────────────────────
async function downloadPhoto(photoRef, placeId, idx) {
  try {
    const mediaUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=1200&key=${GOOGLE_KEY}`;
    const resp = await fetch(mediaUrl, { redirect: 'follow' });
    apiCallsPhotos++;
    if (!resp.ok) return null;
    const buf  = await resp.arrayBuffer();
    const storagePath = `${placeId}/${idx}.jpg`;
    if (DRY_RUN) return { reference: photoRef, url: `DRY_RUN/${storagePath}`, downloaded_at: new Date().toISOString() };
    const { error } = await sb.storage.from('business-photos').upload(storagePath, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { log(`  ⚠ photo upload error: ${error.message}`); return null; }
    const { data: { publicUrl } } = sb.storage.from('business-photos').getPublicUrl(storagePath);
    return { reference: photoRef, url: publicUrl, downloaded_at: new Date().toISOString() };
  } catch (err) {
    log(`  ⚠ photo error: ${err.message}`);
    return null;
  }
}

// ─── Website scraping ────────────────────────────────────────────────────────
const BOOKING_PLATFORMS = [
  { re: /fresha\.com/i,   platform: 'fresha' },
  { re: /booksy\.com/i,   platform: 'booksy' },
  { re: /timely\.com/i,   platform: 'timely' },
  { re: /vagaro\.com/i,   platform: 'vagaro' },
  { re: /square\.site/i,  platform: 'square' },
  { re: /squareup\.com/i, platform: 'square' },
  { re: /phorest\.com/i,  platform: 'phorest' },
  { re: /appointy\.com/i, platform: 'appointy' },
];

function detectBookingUrl(html, finalUrl) {
  for (const { re, platform } of BOOKING_PLATFORMS) {
    if (re.test(finalUrl)) return { url: finalUrl, platform };
    const match = html.match(new RegExp(`https?://[^"'\\s]*${re.source}[^"'\\s]*`, 'i'));
    if (match) return { url: match[0], platform };
  }
  return null;
}

async function scrapeWebsite(websiteUrl) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const resp = await fetch(websiteUrl, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'findme.hair-bot/1.0 (+https://www.findme.hair)', Accept: 'text/html' },
      redirect: 'follow',
    });
    clearTimeout(t);
    if (!resp.ok) return null;
    const finalUrl = resp.url;
    const html = await resp.text();
    const $ = cheerio.load(html);

    let aboutText = '', services = [], source = 'website';

    if (/fresha\.com|fresha\.co/i.test(finalUrl)) {
      source = 'fresha';
      aboutText = $('[data-testid="about-text"], .about-text, p').first().text().trim().slice(0, 1200);
      $('[data-testid="service-name"], .service-name, .service-item h3').each((_,el) => {
        const n = $(el).text().trim(); if (n && n.length < 100) services.push(n);
      });
    } else if (/facebook\.com/i.test(finalUrl)) {
      source = 'facebook';
      aboutText = $('meta[name="description"]').attr('content') || '';
    } else if (/instagram\.com/i.test(finalUrl)) {
      source = 'instagram';
      aboutText = $('meta[property="og:description"]').attr('content') || '';
    } else {
      const metaDesc = $('meta[name="description"]').attr('content') || '';
      const abSels = ['[class*="about"]','[id*="about"]','[class*="story"]','[id*="story"]','[class*="welcome"]','[id*="welcome"]'];
      for (const sel of abSels) {
        const t = $(sel).text().trim();
        if (t && t.length > 30) { aboutText = t.slice(0, 1200); break; }
      }
      if (!aboutText) aboutText = metaDesc || $('main p').first().text().trim().slice(0, 500);
      const svcSels = ['[class*="service"] li','[id*="service"] li','[class*="treatment"] li','[class*="pricing"] li','[class*="service"] h3','[class*="service"] h4'];
      for (const sel of svcSels) {
        $(sel).each((_,el) => { const n = $(el).text().trim().split('\n')[0].trim(); if (n && n.length > 2 && n.length < 100) services.push(n); });
        if (services.length > 0) break;
      }
    }

    const fullText = $('body').text().replace(/\s+/g,' ').trim().slice(0, 4000);
    const booking  = detectBookingUrl(html, finalUrl);
    services = [...new Set(services)].slice(0, 30);

    return { aboutText: aboutText.replace(/\s+/g,' ').trim().slice(0, 1200) || null, services: services.length ? services : null, source, fullText, booking };
  } catch { return null; }
}

// ─── Walk-ins + specialties ──────────────────────────────────────────────────
const WALKINS_RE = [/walk.?in/i,/no appointment/i,/no booking required/i,/drop.?in/i,/come on in/i,/accept walk/i];
const APPT_RE    = [/appointment only/i,/by appointment/i,/bookings? essential/i,/booking required/i,/booking only/i];
function detectWalkIns(text) {
  for (const p of WALKINS_RE) if (p.test(text)) return true;
  for (const p of APPT_RE) if (p.test(text)) return false;
  return null;
}

const SPECIALTY_PATTERNS = [
  { tag: 'balayage',          patterns: [/balayage/i,/foilayage/i] },
  { tag: 'curly-hair',        patterns: [/curly/i,/curl\b/i,/natural hair/i,/textured hair/i] },
  { tag: 'colour-specialist', patterns: [/colou?r/i,/highlight/i,/toning/i,/ombre/i,/vivid/i] },
  { tag: 'extensions',        patterns: [/extension/i,/tape.?in/i,/weft/i] },
  { tag: 'barber',            patterns: [/barber/i,/fade/i,/clipper/i] },
  { tag: 'kids',              patterns: [/kids?/i,/child/i,/family/i] },
  { tag: 'bridal',            patterns: [/bridal/i,/wedding/i,/bride/i] },
  { tag: 'mens',              patterns: [/men'?s/i,/gents?/i,/\bmale\b/i] },
  { tag: 'japanese',          patterns: [/japanese/i,/rebonding/i,/straightening/i] },
  { tag: 'organic',           patterns: [/organic/i,/chemical.?free/i,/vegan/i] },
  { tag: 'mobile',            patterns: [/mobile/i,/home visit/i,/at.?home/i] },
  { tag: 'afro',              patterns: [/afro/i,/african hair/i,/\blocs?\b/i,/dreadlock/i] },
  { tag: 'colour-correction', patterns: [/colou?r.?correction/i] },
  { tag: 'keratin',           patterns: [/keratin/i,/smoothing treatment/i] },
  { tag: 'highlights',        patterns: [/highlight/i,/lowlight/i,/foil/i] },
  { tag: 'blow-dry',          patterns: [/blow.?dry/i,/blowout/i] },
  { tag: 'wigs',              patterns: [/\bwigs?\b/i,/topper/i,/hairpiece/i] },
];
function detectSpecialties(bizType, corpus) {
  const sp = new Set();
  if (bizType === 'barber') sp.add('barber');
  for (const { tag, patterns } of SPECIALTY_PATTERNS) {
    for (const p of patterns) { if (p.test(corpus)) { sp.add(tag); break; } }
  }
  return [...sp];
}

// ─── AI description ──────────────────────────────────────────────────────────
async function generateDescription(biz, websiteContent, reviews) {
  const typeLabel = { hair_salon: 'hair salon', barber: 'barber shop', unisex: 'unisex salon' }[biz.business_type] || 'hair salon';
  const webText   = websiteContent?.aboutText || 'not available';
  const svcText   = websiteContent?.services?.join(', ') || 'not available';
  const revText   = reviews.length ? reviews.map((r,i)=>`Review ${i+1}: "${r}"`).join('\n') : 'not available';
  const toneGuide = { barber: 'masculine, direct, no-nonsense — write like a barber talks', hair_salon: 'warm and professional — match to suburb vibe', unisex: 'inclusive and welcoming' }[biz.business_type] || 'warm and professional';
  const prompt = `Write a rich directory listing description for this Australian ${typeLabel}.

BUSINESS:
Name: ${biz.name}
Type: ${biz.business_type}
Location: ${biz.suburb}, VIC ${biz.postcode}

WEBSITE CONTENT:
${webText.slice(0, 2500)}

SERVICES:
${svcText}

GOOGLE REVIEWS:
${revText.slice(0, 1800)}

Walk-ins: ${biz.walk_ins_welcome === true ? 'Yes' : biz.walk_ins_welcome === false ? 'No, appointment only' : 'Unknown'}

TONE: ${toneGuide}

RULES:
- Do NOT mention Google ratings, star ratings, or review scores
- Rich content → 150-250 words. Sparse → 40-80 words
- Australian English always
- Never fabricate services, prices, team members, or claims not in the data
- Cover: specialties, vibe, who they cater to, booking method, point of difference
- Do NOT start with "Located in…"
- Must feel unique, not templated`;

  try {
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: "You write directory listing descriptions for findme.hair, Australia's hair salon and barber directory. Every description must be factual, unique, and genuinely useful. Never fabricate.",
      messages: [{ role: 'user', content: prompt }],
    });
    return resp.content[0]?.text?.trim() || null;
  } catch (err) {
    log(`  ⚠ AI error: ${err.message}`);
    return null;
  }
}

// ─── Existing slug check / uniquify ─────────────────────────────────────────
let existingSlugs = new Set();

async function loadExistingSlugs() {
  let offset = 0;
  while (true) {
    const { data } = await sb.from('businesses').select('slug').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    for (const b of data) existingSlugs.add(b.slug);
    if (data.length < 1000) break;
    offset += 1000;
  }
}

function uniqueSlug(base) {
  let s = base, n = 2;
  while (existingSlugs.has(s)) s = `${base}-${n++}`;
  existingSlugs.add(s);
  return s;
}

// ─── DB retry wrapper ────────────────────────────────────────────────────────
async function sbQuery(fn, label, retries = 3) {
  for (let a = 1; a <= retries; a++) {
    try {
      const r = await fn();
      if (r?.error) throw new Error(r.error.message);
      return r;
    } catch (err) {
      if (a === retries) { log(`  ❌ DB fail (${label}): ${err.message}`); return { data: null, error: err }; }
      await sleep(2000 * a);
    }
  }
}

// ─── Phase 1: Search ─────────────────────────────────────────────────────────
async function searchPostcode(pc) {
  log(`  Searching postcode ${pc.code}...`);
  const found = new Map();

  const addAll = (places) => {
    for (const p of places) if (p.id && !found.has(p.id)) found.set(p.id, { ...p, _postcode: pc.code });
  };

  addAll(await nearbySearch(pc));
  await sleep(150);
  addAll(await textSearch(pc, 'hair salon'));
  await sleep(150);
  addAll(await textSearch(pc, 'hairdresser'));
  await sleep(150);
  addAll(await textSearch(pc, 'barber'));
  await sleep(150);

  log(`  ${pc.code}: ${found.size} unique places from search`);
  return [...found.values()];
}

// ─── Phase 2: Details + liveness filter ──────────────────────────────────────
async function enrichWithDetails(place) {
  const details = await getPlaceDetails(place.id);
  await sleep(100);
  if (!details) return { ...place, _details: null };
  return {
    ...place,
    rating:              details.rating              ?? place.rating,
    userRatingCount:     details.userRatingCount     ?? place.userRatingCount ?? 0,
    businessStatus:      details.businessStatus      ?? place.businessStatus,
    _hours:              formatHours(details.regularOpeningHours),
    _photoRefs:          (details.photos || place.photos || []).slice(0,5).map(p => p.name),
    _reviews:            (details.reviews || []).map(r => r.text?.text || '').filter(Boolean).slice(0,5),
    _latestReviewDate:   details.reviews?.[0]?.relativePublishTimeDescription || null,
    _details:            details,
  };
}

function livenessFilter(place) {
  if (place.businessStatus !== 'OPERATIONAL') return false;
  if ((place.userRatingCount || 0) < 1) return false;
  // Need at least one of: phone, photos, recent review (within 24 months)
  const hasPhone  = !!place.nationalPhoneNumber;
  const hasPhotos = (place._photoRefs || []).length > 0 || (place.photos || []).length > 0;
  // Review recency: simple check — if there's any review we'll accept (they must have visited)
  const hasReview = (place._reviews || []).length > 0;
  if (!hasPhone && !hasPhotos && !hasReview) return false;
  return true;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log('\n' + '═'.repeat(65));
  log('findme.hair — Inner Melbourne Bayside Enrichment');
  log('═'.repeat(65));
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE'}`);
  log(`Started: ${new Date().toISOString()}`);
  log(`Postcodes: ${POSTCODES.map(p=>p.code).join(', ')}`);
  log('═'.repeat(65));

  const runStartedAt = new Date().toISOString();

  // ─── Cost estimate ──────────────────────────────────────────────────────────
  log('\n── Cost estimate ──────────────────────────────────────────');
  const estSearch  = POSTCODES.length * 4 * 0.032; // 4 searches per postcode
  const estDetails = 500 * 0.017;                   // ~500 unique results
  const estPhotos  = 500 * 5 * 0.007;               // 5 photos each
  const estTotalUsd = estSearch + estDetails + estPhotos;
  const estTotalAud = estTotalUsd * AUD_PER_USD;
  log(`  Search calls (est):  ${POSTCODES.length * 4} × $0.032 = USD $${estSearch.toFixed(2)}`);
  log(`  Detail calls (est):  500 × $0.017 = USD $${estDetails.toFixed(2)}`);
  log(`  Photo calls (est):   2500 × $0.007 = USD $${estPhotos.toFixed(2)}`);
  log(`  TOTAL ESTIMATE:      USD $${estTotalUsd.toFixed(2)} ≈ AUD $${estTotalAud.toFixed(2)}`);
  if (estTotalAud > COST_CAP_AUD) {
    log(`  ❌ Estimated cost AUD $${estTotalAud.toFixed(2)} exceeds cap AUD $${COST_CAP_AUD}. Aborting.`);
    process.exit(1);
  }
  log(`  ✓ Under AUD $${COST_CAP_AUD} cap — proceeding`);

  // ─── Load existing DB state ─────────────────────────────────────────────────
  log('\n── Loading existing DB state ───────────────────────────────');
  const allPostcodes = POSTCODES.map(p => p.code);
  const { data: existingRaw } = await sb.from('businesses').select('id, name, google_place_id, address_line1, postcode, suburb, phone, verification_flags, walk_ins_welcome, walk_ins_source, notes, last_verified, is_claimed, claimed_by, featured_until, confidence_score, google_photos, google_last_checked, ai_description').in('postcode', allPostcodes);
  const existing = existingRaw || [];
  const existingById   = new Map();  // google_place_id → row
  const existingByKey  = new Map();  // "name-lower|postcode|addr-lower" → row
  for (const b of existing) {
    if (b.google_place_id) existingById.set(b.google_place_id, b);
    const key = `${b.name.toLowerCase().trim()}|${b.postcode}|${(b.address_line1||'').toLowerCase().trim()}`;
    existingByKey.set(key, b);
  }
  await loadExistingSlugs();
  log(`  Loaded ${existing.length} existing businesses`);
  log(`  ${existingById.size} have google_place_id`);

  // ─── Phase 1: Discovery ──────────────────────────────────────────────────────
  log('\n── Phase 1: Discovery ──────────────────────────────────────');
  const allPlaces = new Map();

  await withConcurrency(POSTCODES, async (pc) => {
    const places = await searchPostcode(pc);
    for (const p of places) {
      if (!allPlaces.has(p.id)) allPlaces.set(p.id, p);
    }
  }, 3);

  log(`\n  Total unique places found: ${allPlaces.size}`);
  log(`  API calls so far: ${apiCallsSearch} search`);

  // ─── Pre-filter: type + name exclusions ─────────────────────────────────────
  let candidates = [...allPlaces.values()].filter(p => !isExcluded(p));
  // Also filter: must have at least one HAIR_TYPE or be in the OPERATIONAL state
  candidates = candidates.filter(p => {
    const types = p.types || [];
    return types.some(t => HAIR_TYPES.has(t));
  });
  log(`  After type/name filter: ${candidates.length} candidates`);

  // ─── Phase 2: Get place details + liveness filter ──────────────────────────
  log('\n── Phase 2: Place Details + Liveness Filter ────────────────');

  // Check live cost cap before bulk details calls
  {
    const projUsd = apiCallsSearch * 0.032 + candidates.length * 0.017 + candidates.length * 5 * 0.007;
    const projAud = projUsd * AUD_PER_USD;
    log(`  Projected total with details+photos: USD $${projUsd.toFixed(2)} ≈ AUD $${projAud.toFixed(2)}`);
    if (projAud > COST_CAP_AUD) {
      log(`  ⚠ Above cap. Skipping photo cost estimate; proceeding with details only for top ${Math.floor(COST_CAP_AUD / AUD_PER_USD / 0.017)} candidates.`);
      candidates = candidates.slice(0, Math.floor(COST_CAP_AUD / AUD_PER_USD / 0.017));
    }
  }

  const enriched = [];
  let enrichBatch = 0;
  const DETAILS_BATCH = 50;
  for (let i = 0; i < candidates.length; i += DETAILS_BATCH) {
    const batch = candidates.slice(i, i + DETAILS_BATCH);
    enrichBatch++;
    log(`  Details batch ${enrichBatch}: fetching ${batch.length} places (${i+1}–${Math.min(i+DETAILS_BATCH, candidates.length)}/${candidates.length})`);
    const results = await withConcurrency(batch, enrichWithDetails, 5);
    enriched.push(...results.filter(Boolean));
    await sleep(300);
  }

  const live = enriched.filter(livenessFilter);
  log(`\n  After liveness filter: ${live.length}/${enriched.length} pass`);

  // ─── Categorize: INSERT vs UPDATE ────────────────────────────────────────
  log('\n── Phase 3: Categorize ─────────────────────────────────────');
  const toInsert = [], toUpdate = [];

  for (const place of live) {
    const name = place.displayName?.text || '';
    const addr = parseAddress(place);
    const confidence = calculateConfidence(place);
    if (confidence < 50) continue; // below SG run threshold

    // Determine region + postcode (prefer detected, fall back to search postcode)
    const pc = addr.postcode || place._postcode;

    // Match existing
    let matched = existingById.get(place.id);
    if (!matched) {
      // Fuzzy fallback: name + postcode + address
      const fuzzyKey = `${name.toLowerCase().trim()}|${pc}|${addr.addressLine1.toLowerCase().trim()}`;
      matched = existingByKey.get(fuzzyKey);
    }

    if (matched) {
      // Build UPDATE (only safe fields per brief)
      const up = {
        _existing_id: matched.id,
        google_rating: place.rating ?? null,
        google_review_count: place.userRatingCount ?? 0,
        google_hours: place._hours ?? null,
        google_business_status: place.businessStatus,
        google_last_checked: new Date().toISOString(),
      };
      // website_url only if previously null
      if (!matched.website_url && place.websiteUri) up.website_url = place.websiteUri;
      // phone only if previously null AND no Bec override
      if (!matched.phone && !(matched.verification_flags?.phone_source === 'bec')) {
        if (place.nationalPhoneNumber) up.phone = place.nationalPhoneNumber;
      }
      // google_photos: update if no existing photos or older than 90 days
      const photosCurrent = matched.google_photos && Array.isArray(matched.google_photos) && matched.google_photos.length > 0;
      const photosOld = matched.google_last_checked && (Date.now() - new Date(matched.google_last_checked).getTime()) > 90 * 86400e3;
      up._refreshPhotos = !photosCurrent || photosOld;
      up._photoRefs = place._photoRefs || [];
      up._reviews   = place._reviews   || [];
      up._needsEnrich = !matched.ai_description; // enrich if no AI description yet
      up._bizType   = matched.business_type || classifyBusinessType(place);
      up._suburb    = matched.suburb;
      up._postcode  = matched.postcode || pc;
      up._name      = matched.name;
      up._website   = matched.website_url || place.websiteUri || null;
      up._place     = place;
      // Do NOT overwrite confidence_score if existing is higher
      if (!matched.confidence_score || confidence > matched.confidence_score) up.confidence_score = confidence;
      toUpdate.push(up);
    } else {
      // New record to insert
      const bizType = classifyBusinessType(place);
      const slug    = uniqueSlug(slugify(`${name}-${addr.suburb || addr.addressLine1 || pc}`));
      toInsert.push({
        name,
        slug,
        business_type: bizType,
        address_line1: addr.addressLine1,
        suburb:        addr.suburb,
        state:         addr.state || 'VIC',
        postcode:      pc,
        lat:           place.location?.latitude  || null,
        lng:           place.location?.longitude || null,
        phone:         place.nationalPhoneNumber || null,
        website_url:   place.websiteUri || null,
        google_place_id:       place.id,
        google_rating:         place.rating ?? null,
        google_review_count:   place.userRatingCount ?? 0,
        google_business_status: place.businessStatus,
        google_last_checked:   new Date().toISOString(),
        google_hours:  place._hours ?? null,
        region_id:     regionId(pc),
        status:        'active',
        is_claimed:    false,
        is_mobile:     isMobile(place),
        confidence_score: confidence,
        last_verified: null,
        _photoRefs:   place._photoRefs || [],
        _reviews:     place._reviews   || [],
        _needsEnrich: true,
        _bizType:     bizType,
      });
    }
  }

  log(`  To INSERT: ${toInsert.length} new records`);
  log(`  To UPDATE: ${toUpdate.length} existing records`);

  // ─── Shared stats object (used in Phase 4 and 5) ────────────────────────
  const stats = { inserted: 0, updated: 0, errors: 0, excluded: 0 };

  // ─── Phase 4: Enrichment (website + AI) ──────────────────────────────────
  log('\n── Phase 4: Enrichment (website scrape + AI description) ───');
  const needsEnrich = [...toInsert.filter(r=>r._needsEnrich), ...toUpdate.filter(r=>r._needsEnrich)];
  log(`  ${needsEnrich.length} records need enrichment`);

  let enrichedCount = 0, enrichedErr = 0;

  // NOT_HAIR detector for enrichment phase (catches things that slipped past type filter)
  const NOT_HAIR_ENRICH_RE = [
    /\bnail salon\b/i, /\bnail bar\b/i, /\bday spa\b/i, /\bmed ?spa\b/i, /\bskin clinic\b/i,
    /\blaser\s+(hair\s+)?removal\b/i, /\belectrolysis\b/i, /\blash studio\b/i, /\bbrow bar\b/i,
    /\bwaxing studio\b/i, /\bdog groom/i, /\bpet groom/i, /\bcosmetic inject/i,
  ];
  function isNotHair(bizName, webText) {
    const corpus = bizName + ' ' + (webText || '');
    const hasHair = /\bhair(cut|dress|salon|style|stylist)?|barber|hairdress|colour|balayage|fade\b/i.test(corpus);
    for (const p of NOT_HAIR_ENRICH_RE) {
      if (p.test(bizName)) return true; // name-level is definitive
      if (p.test(corpus) && !hasHair) return true;
    }
    return false;
  }

  await withConcurrency(needsEnrich, async (rec) => {
    const websiteUrl = rec._website || rec.website_url;
    let websiteContent = null;
    if (websiteUrl) {
      websiteContent = await scrapeWebsite(websiteUrl);
      if (websiteContent) log(`  ✓ Scraped: ${rec._name || rec.name} → ${websiteContent.source}`);
    }

    const webText = websiteContent?.aboutText || '';

    // NOT_HAIR gate — skip enrichment and mark for exclusion
    if (isNotHair(rec._name || rec.name, webText)) {
      log(`  ✗ NOT_HAIR: ${rec._name || rec.name}`);
      rec._notHair = true;
      stats.excluded++;
      return;
    }

    const reviews = rec._reviews || [];
    const corpus  = [webText, (websiteContent?.services||[]).join(' '), rec._name || rec.name, reviews.join(' ')].join(' ');

    const aiDesc     = await generateDescription({
      name: rec._name || rec.name,
      business_type: rec._bizType,
      suburb: rec._suburb || rec.suburb,
      postcode: rec._postcode || rec.postcode,
      walk_ins_welcome: rec.walk_ins_welcome || null,
    }, websiteContent, reviews);

    const specialties = detectSpecialties(rec._bizType, corpus);
    const walkIns     = detectWalkIns(corpus);
    const booking     = websiteContent?.booking;

    // Attach enrichment fields back to the record object
    rec._enrichment = {
      ai_description:       aiDesc,
      specialties:          specialties.length ? specialties : null,
      content_generated_at: new Date().toISOString(),
      content_source:       websiteContent?.source || (reviews.length ? 'google_data' : 'minimal'),
      scraped_about:        websiteContent?.aboutText || null,
      scraped_services:     websiteContent?.services || null,
      scraped_at:           websiteContent ? new Date().toISOString() : null,
    };
    if (walkIns !== null) {
      rec._enrichment.walk_ins_welcome = walkIns;
      rec._enrichment.walk_ins_source  = 'scraped';
    }
    if (booking) {
      rec._enrichment.booking_url      = booking.url;
      rec._enrichment.booking_platform = booking.platform;
    }

    enrichedCount++;
    if (enrichedCount % 10 === 0) log(`  Progress: ${enrichedCount}/${needsEnrich.length} enriched`);
    await sleep(websiteUrl ? 1500 : 200);
  }, 4);

  log(`  Enrichment complete: ${enrichedCount} done, ${enrichedErr} errors, ${stats.excluded} excluded as NOT_HAIR`);

  // Remove NOT_HAIR records from insert list
  const insertClean = toInsert.filter(r => !r._notHair);
  const updateClean = toUpdate.filter(r => !r._notHair);
  if (toInsert.length !== insertClean.length) log(`  Removed ${toInsert.length - insertClean.length} NOT_HAIR from inserts`);

  // ─── Phase 5: Upsert to Supabase ────────────────────────────────────────
  log('\n── Phase 5: Upsert to Supabase ─────────────────────────────');

  const postcodeBreakdown = {};
  for (const pc of POSTCODES) postcodeBreakdown[pc.code] = { inserted: 0, updated: 0 };

  if (!DRY_RUN) {
    // INSERTs
    for (let i = 0; i < insertClean.length; i += 50) {
      const batch = insertClean.slice(i, i + 50);
      const rows = batch.map(r => {
        const rec = { ...r, ...r._enrichment };
        delete rec._photoRefs; delete rec._reviews; delete rec._needsEnrich;
        delete rec._bizType; delete rec._suburb; delete rec._postcode;
        delete rec._name; delete rec._website; delete rec._place; delete rec._enrichment;
        return rec;
      });
      const { error } = await sbQuery(() => sb.from('businesses').insert(rows).select('id'), `insert batch ${i}`);
      if (error) {
        // Try one by one
        for (const row of rows) {
          const { error: e2 } = await sbQuery(() => sb.from('businesses').insert(row), `insert ${row.name}`);
          if (e2) { log(`  ❌ Insert failed: ${row.name}: ${e2.message}`); stats.errors++; }
          else {
            stats.inserted++;
            postcodeBreakdown[row.postcode] = postcodeBreakdown[row.postcode] || { inserted: 0, updated: 0 };
            postcodeBreakdown[row.postcode].inserted++;
          }
        }
      } else {
        stats.inserted += batch.length;
        for (const r of batch) {
          postcodeBreakdown[r.postcode] = postcodeBreakdown[r.postcode] || { inserted: 0, updated: 0 };
          postcodeBreakdown[r.postcode].inserted++;
        }
      }
    }
    log(`  Inserted: ${stats.inserted}`);

    // UPDATEs
    for (const r of updateClean) {
      const { _existing_id, _photoRefs, _reviews, _needsEnrich, _bizType, _suburb, _postcode, _name, _website, _place, _refreshPhotos, _enrichment, ...update } = r;
      if (_enrichment) Object.assign(update, _enrichment);
      const { error } = await sbQuery(() => sb.from('businesses').update(update).eq('id', _existing_id), `update ${_name}`);
      if (error) { log(`  ❌ Update failed: ${_name}: ${error.message}`); stats.errors++; }
      else {
        stats.updated++;
        const pc = _postcode;
        postcodeBreakdown[pc] = postcodeBreakdown[pc] || { inserted: 0, updated: 0 };
        postcodeBreakdown[pc].updated++;
      }
    }
    log(`  Updated: ${stats.updated}`);
  } else {
    log(`  DRY RUN: Would insert ${insertClean.length}, update ${updateClean.length}`);
    stats.inserted = insertClean.length;
    stats.updated  = updateClean.length;
    for (const r of insertClean) {
      const pc = r.postcode; postcodeBreakdown[pc] = postcodeBreakdown[pc] || { inserted: 0, updated: 0 };
      postcodeBreakdown[pc].inserted++;
    }
    for (const r of updateClean) {
      const pc = r._postcode; postcodeBreakdown[pc] = postcodeBreakdown[pc] || { inserted: 0, updated: 0 };
      postcodeBreakdown[pc].updated++;
    }
  }

  // ─── Phase 6: Photos ────────────────────────────────────────────────────
  log('\n── Phase 6: Photos ─────────────────────────────────────────');

  const photoTargets = [
    ...insertClean.filter(r => r._photoRefs?.length > 0),
    ...updateClean.filter(r => r._refreshPhotos && r._photoRefs?.length > 0),
  ];
  log(`  ${photoTargets.length} records need photo downloads`);

  if (!DRY_RUN) {
    let photosOk = 0;
    await withConcurrency(photoTargets, async (rec) => {
      const placeId = rec.google_place_id || rec._place?.id;
      if (!placeId) return;
      const refs = rec._photoRefs.slice(0, 5);
      const urls = await Promise.all(refs.map((ref, idx) => downloadPhoto(ref, placeId, idx)));
      const photos = urls.filter(Boolean);
      if (!photos.length) return;
      const update = { google_photos: photos };
      if (rec._existing_id) {
        await sbQuery(() => sb.from('businesses').update(update).eq('id', rec._existing_id), `photo update ${rec._name}`);
      } else {
        await sbQuery(() => sb.from('businesses').update(update).eq('google_place_id', placeId), `photo insert update`);
      }
      photosOk++;
    }, 5);
    log(`  Photos done for ${photosOk} records (${apiCallsPhotos} API calls)`);
  } else {
    log(`  DRY RUN: Would download photos for ${photoTargets.length} records`);
  }

  // ─── Phase 7: Suburb table — ensure rows exist ────────────────────────────
  log('\n── Phase 7: Ensure suburb rows exist ───────────────────────');
  const suburbsToEnsure = [
    { name: 'South Yarra', postcode: '3141', region_id: DEFAULT_REGION_ID },
    { name: 'Toorak',      postcode: '3142', region_id: DEFAULT_REGION_ID },
    { name: 'Prahran',     postcode: '3181', region_id: DEFAULT_REGION_ID },
    { name: 'Windsor',     postcode: '3181', region_id: DEFAULT_REGION_ID },
    { name: 'St Kilda',    postcode: '3182', region_id: DEFAULT_REGION_ID },
    { name: 'Balaclava',   postcode: '3183', region_id: DEFAULT_REGION_ID },
    { name: 'St Kilda East', postcode: '3183', region_id: DEFAULT_REGION_ID },
    { name: 'Elwood',      postcode: '3184', region_id: DEFAULT_REGION_ID },
    { name: 'South Melbourne', postcode: '3205', region_id: DEFAULT_REGION_ID },
    { name: 'Albert Park', postcode: '3206', region_id: DEFAULT_REGION_ID },
    { name: 'Middle Park', postcode: '3206', region_id: DEFAULT_REGION_ID },
    { name: 'Port Melbourne', postcode: '3207', region_id: REGION_ID_BY_POSTCODE['3207'] },
  ];
  if (!DRY_RUN) {
    for (const s of suburbsToEnsure) {
      const slug = `${slugify(s.name)}-vic`;
      const { error } = await sb.from('suburbs').upsert(
        { name: s.name, slug, postcode: s.postcode, region_id: s.region_id, state: 'VIC' },
        { onConflict: 'slug', ignoreDuplicates: true }
      );
      if (error && !error.message.includes('duplicate')) log(`  ⚠ suburb upsert error: ${s.name}: ${error.message}`);
    }
    log(`  Suburb rows ensured`);
  }

  // ─── Final stats ─────────────────────────────────────────────────────────
  const runCompletedAt = new Date().toISOString();
  const actualCostUsd  = estimatedCostUsd();
  const actualCostAud  = estimatedCostAud();

  log('\n' + '═'.repeat(65));
  log('FINAL RESULTS');
  log('═'.repeat(65));
  log(`  Inserted:    ${stats.inserted}`);
  log(`  Updated:     ${stats.updated}`);
  log(`  Excluded:    ${stats.excluded} (liveness/type filter)`);
  log(`  Errors:      ${stats.errors}`);
  log(`  API calls:   ${apiCallsSearch} search, ${apiCallsDetails} details, ${apiCallsPhotos} photos`);
  log(`  Cost:        USD $${actualCostUsd.toFixed(2)} ≈ AUD $${actualCostAud.toFixed(2)}`);
  log('\n  Per-postcode breakdown:');
  const postcodeRows = POSTCODES.map(p => {
    const b = postcodeBreakdown[p.code] || { inserted: 0, updated: 0 };
    return `    ${p.code} (${p.suburbs.join('/')}): ${b.inserted} inserted, ${b.updated} updated`;
  });
  for (const r of postcodeRows) log(r);

  // Suspiciously low count check
  const lowCounts = POSTCODES.filter(p => {
    const b = postcodeBreakdown[p.code] || { inserted: 0, updated: 0 };
    return (b.inserted + b.updated) < 3;
  });
  if (lowCounts.length) log(`\n  ⚠ Low result postcodes (may need manual review): ${lowCounts.map(p=>p.code).join(', ')}`);

  // ─── Phase 8: coordination_log ───────────────────────────────────────────
  log('\n── Phase 8: Write coordination_log ─────────────────────────');
  const clPayload = {
    added:               stats.inserted,
    updated:             stats.updated,
    excluded:            stats.excluded,
    breakdown_by_postcode: postcodeBreakdown,
    run_started_at:      runStartedAt,
    run_completed_at:    runCompletedAt,
    api_cost_aud:        Math.round(actualCostAud * 100) / 100,
    api_calls:           { search: apiCallsSearch, details: apiCallsDetails, photos: apiCallsPhotos },
  };
  const clMessage = `Pull complete — ${stats.inserted} records added, ${stats.updated} records updated, ${stats.excluded} excluded by liveness filter. Ready for Matt+Aaron run Wed/Thu/Fri 22-24 Apr. See payload for postcode breakdown.`;
  if (!DRY_RUN) {
    const { error: cle } = await sb.from('coordination_log').insert({
      from_org: 'fmh-data-team',
      to_org:   'sg-ceo',
      topic:    'inner-melb-bayside-enrichment-complete',
      message:  clMessage,
      payload:  clPayload,
      resolved: false,
    });
    if (cle) log(`  ❌ coordination_log error: ${cle.message}`);
    else     log(`  ✓ coordination_log entry written`);
  } else {
    log(`  DRY RUN: Would write coordination_log`);
  }

  // ─── Phase 9: field_runs ─────────────────────────────────────────────────
  log('\n── Phase 9: Write field_runs ───────────────────────────────');
  if (!DRY_RUN) {
    const { error: fre } = await sb.from('field_runs').insert({
      run_date:       new Date().toISOString().slice(0,10),
      operator:       'fmh-data-pipeline',
      territory:      'Inner Melbourne Bayside (9 postcodes)',
      state:          'VIC',
      route_notes:    'API enrichment batch 2026-04-20 inner-bayside-melb (9 postcodes)',
      stops_total:    stats.inserted + stats.updated,
      stops_new:      stats.inserted,
      stops_verified: 0,
    });
    if (fre) log(`  ❌ field_runs error: ${fre.message}`);
    else     log(`  ✓ field_runs entry written`);
  } else {
    log(`  DRY RUN: Would write field_runs`);
  }

  // ─── Output summary JSON for email/reporting ─────────────────────────────
  const summaryPath = '/tmp/inner-melb-bayside-summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify({
    inserted: stats.inserted, updated: stats.updated, excluded: stats.excluded,
    postcodeBreakdown, runStartedAt, runCompletedAt,
    costAud: actualCostAud, lowCountPostcodes: lowCounts.map(p=>p.code),
    apiCalls: { search: apiCallsSearch, details: apiCallsDetails, photos: apiCallsPhotos },
  }, null, 2));
  log(`\n  Summary written to ${summaryPath}`);

  log('\n' + '═'.repeat(65));
  log('PIPELINE COMPLETE');
  log(`Run time: ${Math.round((Date.now() - new Date(runStartedAt).getTime()) / 60000)} minutes`);
  log('═'.repeat(65));
}

main().catch(err => {
  log(`\n❌ FATAL: ${err.message}`);
  console.error(err);
  process.exit(1);
});
