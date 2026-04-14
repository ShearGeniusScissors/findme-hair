#!/usr/bin/env node
/**
 * Rebuild Melbourne West - MATTS RUN and Sunbury Run CSV exports
 * after new suburbs have been scraped and approved.
 */

require('dotenv').config({ path: '.env.local' });
const { pgClient } = require('./_pipeline-lib');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function esc(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function extractStreetSort(addr) {
  if (!addr) return { street: 'zzz', num: 99999 };
  const m = addr.match(/^(\d+[a-zA-Z]?)\s+(.+)/);
  if (m) return { num: parseInt(m[1]), street: m[2].toLowerCase() };
  const m2 = addr.match(/^(?:shop|unit|suite|level|lot)\s*\S+[,\/\s]+(?:(\d+)\s+)?(.+)/i);
  if (m2) return { num: parseInt(m2[1]) || 0, street: (m2[2] || addr).toLowerCase() };
  return { street: addr.toLowerCase(), num: 0 };
}

function sortBySuburbOrder(businesses, order) {
  const idx = (s) => {
    const i = order.findIndex(x => x.toLowerCase() === (s || '').toLowerCase());
    return i >= 0 ? i : 999;
  };
  return businesses.sort((a, b) => {
    const oa = idx(a.suburb), ob = idx(b.suburb);
    if (oa !== ob) return oa - ob;
    const sa = extractStreetSort(a.address_line1);
    const sb = extractStreetSort(b.address_line1);
    if (sa.street !== sb.street) return sa.street.localeCompare(sb.street);
    return sa.num - sb.num;
  });
}

function getDay(suburb, dayMap) {
  const s = (suburb || '').toLowerCase();
  for (const [day, subs] of Object.entries(dayMap)) {
    if (subs.some(x => x.toLowerCase() === s)) return day;
  }
  return 'Day 1';
}

function writeMaster(filePath, businesses) {
  let csv = 'status,name,address_line1,suburb,postcode,state,lat,lng,phone,website_url,business_type,google_rating,google_review_count,confidence_score,booking_platform,business_id\n';
  for (const b of businesses) {
    csv += [b.status, b.name, b.address_line1, b.suburb, b.postcode, b.state,
      b.lat, b.lng, b.phone, b.website_url, b.business_type,
      b.google_rating, b.google_review_count, b.confidence_score, '', b.id
    ].map(esc).join(',') + '\n';
  }
  fs.writeFileSync(filePath, csv);
}

function writeVisits(filePath, businesses, dayMap) {
  let csv = 'day,suburb,name,address_line1,phone,business_type,google_rating,google_review_count,status,confidence_score,visited,still_open,claimed_listing,scissors_interest,sale_amount,notes,business_id\n';
  for (const b of businesses) {
    const day = getDay(b.suburb, dayMap);
    csv += [day, b.suburb, b.name, b.address_line1, b.phone, b.business_type,
      b.google_rating, b.google_review_count, b.status, b.confidence_score,
      '', '', '', '', '', '', b.id
    ].map(esc).join(',') + '\n';
  }
  fs.writeFileSync(filePath, csv);
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════

async function main() {
  const pg = pgClient();
  await pg.connect();

  // ─── MELBOURNE WEST — MATTS RUN ───────────────────────────

  const MW_SUBURBS = [
    'Bacchus Marsh', 'Maddingley', 'Darley', 'Melton', 'Melton South', 'Melton West',
    'Aintree', 'Caroline Springs', 'Derrimut', 'Deer Park', 'Tarneit', 'Truganina',
    'Wyndham Vale', 'Manor Lakes', 'Werribee', 'Hoppers Crossing', 'Williams Landing',
    'Point Cook', 'Laverton', 'Laverton North', 'Altona Meadows', 'Altona North',
    'Altona', 'Williamstown', 'Newport'
  ];

  const MW_DAYS = {
    'Day 1': ['Bacchus Marsh', 'Maddingley', 'Darley', 'Melton', 'Melton South', 'Melton West',
      'Aintree', 'Caroline Springs', 'Derrimut', 'Deer Park'],
    'Day 2': ['Tarneit', 'Truganina', 'Wyndham Vale', 'Manor Lakes', 'Werribee', 'Hoppers Crossing',
      'Williams Landing', 'Point Cook', 'Laverton', 'Laverton North', 'Altona Meadows',
      'Altona North', 'Altona', 'Williamstown', 'Newport'],
  };

  const mwPlaceholders = MW_SUBURBS.map((_, i) => '$' + (i + 1)).join(',');
  const mwRes = await pg.query(
    `SELECT id, name, address_line1, suburb, postcode, state, lat, lng, phone,
            website_url, business_type, google_rating, google_review_count,
            confidence_score, status
     FROM businesses
     WHERE state = 'VIC' AND status IN ('active', 'unverified')
       AND suburb IN (${mwPlaceholders})`,
    MW_SUBURBS
  );

  const mwSorted = sortBySuburbOrder(mwRes.rows, MW_SUBURBS);
  const mwDir = '/Users/mattgrumley/Downloads/Findme.hair Data/VIC/Melbourne West - MATTS RUN';
  fs.mkdirSync(mwDir, { recursive: true });
  writeMaster(path.join(mwDir, 'Melbourne West-MASTER.csv'), mwSorted);
  writeVisits(path.join(mwDir, 'Melbourne West-VISITS.csv'), mwSorted, MW_DAYS);

  // ─── SUNBURY RUN — MATTS RUN ──────────────────────────────

  const SR_SUBURBS = [
    'Daylesford', 'Hepburn Springs', 'Hepburn', 'Creswick',
    'Castlemaine', 'Chewton', 'Harcourt', 'Newstead',
    'Maryborough', 'Dunolly', 'Avoca', 'Talbot',
    'Kyneton', 'Malmsbury', 'Trentham',
    'Woodend', 'Romsey', 'Lancefield',
    'Gisborne', 'New Gisborne', 'Riddells Creek', 'Macedon', 'Mount Macedon',
    'Sunbury', 'Diggers Rest'
  ];

  const SR_DAYS = {
    'Day 1': ['Daylesford', 'Hepburn Springs', 'Hepburn', 'Creswick',
      'Castlemaine', 'Chewton', 'Harcourt', 'Newstead',
      'Maryborough', 'Dunolly', 'Avoca', 'Talbot'],
    'Day 2': ['Kyneton', 'Malmsbury', 'Trentham',
      'Woodend', 'Romsey', 'Lancefield',
      'Gisborne', 'New Gisborne', 'Riddells Creek', 'Macedon', 'Mount Macedon',
      'Sunbury', 'Diggers Rest'],
  };

  const srPlaceholders = SR_SUBURBS.map((_, i) => '$' + (i + 1)).join(',');
  const srRes = await pg.query(
    `SELECT id, name, address_line1, suburb, postcode, state, lat, lng, phone,
            website_url, business_type, google_rating, google_review_count,
            confidence_score, status
     FROM businesses
     WHERE state = 'VIC' AND status IN ('active', 'unverified')
       AND suburb IN (${srPlaceholders})`,
    SR_SUBURBS
  );

  const srSorted = sortBySuburbOrder(srRes.rows, SR_SUBURBS);
  const srDir = '/Users/mattgrumley/Downloads/Findme.hair Data/VIC/Sunbury Run - MATTS RUN';
  fs.mkdirSync(srDir, { recursive: true });
  writeMaster(path.join(srDir, 'Sunbury Run-MASTER.csv'), srSorted);
  writeVisits(path.join(srDir, 'Sunbury Run-VISITS.csv'), srSorted, SR_DAYS);

  // ─── SUMMARY ──────────────────────────────────────────────

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CSV REBUILD COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');

  // Melbourne West
  console.log('');
  console.log('  MELBOURNE WEST — MATTS RUN: ' + mwSorted.length + ' businesses');
  const mwSubs = {};
  mwSorted.forEach(b => mwSubs[b.suburb] = (mwSubs[b.suburb] || 0) + 1);
  MW_SUBURBS.forEach(s => {
    const c = mwSubs[s] || 0;
    console.log('    ' + s.padEnd(22) + (c > 0 ? String(c).padStart(4) : '   0  (none found)'));
  });
  let d1 = 0, d2 = 0;
  mwSorted.forEach(b => { if (getDay(b.suburb, MW_DAYS) === 'Day 1') d1++; else d2++; });
  console.log('    Day 1: ' + d1 + '  |  Day 2: ' + d2);

  // Sunbury Run
  console.log('');
  console.log('  SUNBURY RUN — MATTS RUN: ' + srSorted.length + ' businesses');
  const srSubs = {};
  srSorted.forEach(b => srSubs[b.suburb] = (srSubs[b.suburb] || 0) + 1);
  SR_SUBURBS.forEach(s => {
    const c = srSubs[s] || 0;
    console.log('    ' + s.padEnd(22) + (c > 0 ? String(c).padStart(4) : '   0  (none found)'));
  });
  let sd1 = 0, sd2 = 0;
  srSorted.forEach(b => { if (getDay(b.suburb, SR_DAYS) === 'Day 1') sd1++; else sd2++; });
  console.log('    Day 1: ' + sd1 + '  |  Day 2: ' + sd2);

  // Zero suburbs
  const zeroMW = MW_SUBURBS.filter(s => !(mwSubs[s]));
  const zeroSR = SR_SUBURBS.filter(s => !(srSubs[s]));
  if (zeroMW.length + zeroSR.length > 0) {
    console.log('');
    console.log('  SUBURBS WITH 0 RESULTS:');
    zeroMW.forEach(s => console.log('    ⚠ Melbourne West: ' + s));
    zeroSR.forEach(s => console.log('    ⚠ Sunbury Run: ' + s));
  }

  console.log('');
  console.log('  Files written:');
  console.log('    ~/Downloads/Findme.hair Data/VIC/Melbourne West - MATTS RUN/');
  console.log('      Melbourne West-MASTER.csv');
  console.log('      Melbourne West-VISITS.csv');
  console.log('    ~/Downloads/Findme.hair Data/VIC/Sunbury Run - MATTS RUN/');
  console.log('      Sunbury Run-MASTER.csv');
  console.log('      Sunbury Run-VISITS.csv');
  console.log('═══════════════════════════════════════════════════════════');

  await pg.end();
}

main().catch(err => {
  console.error('❌ fatal:', err);
  process.exit(1);
});
