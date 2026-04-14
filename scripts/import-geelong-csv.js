#!/usr/bin/env node
/**
 * Import the Geelong clean data CSV into the findme.hair database.
 *
 * For each row:
 *   1. Match against existing businesses by normalised address or name similarity
 *   2. If matched — update lat/lng/phone if the CSV has better data
 *   3. If new — insert with status='unverified', confidence_score=50
 *
 * Also ensures all suburbs referenced in the CSV exist in the suburbs table.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { pgClient, slugify, normaliseAddress, nameSimilarity } = require('./_pipeline-lib');

const CSV_PATH = '/Users/mattgrumley/Downloads/GEELONG CLEAN DATA .csv';

function parseCSV(text) {
  const lines = text.split('\n').filter(Boolean);
  const header = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const obj = {};
    header.forEach((h, i) => (obj[h.trim()] = (vals[i] || '').trim()));
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function classifyByName(name) {
  const n = name.toLowerCase();
  const isBarber = /\b(barber|shave|blade|fade)\b/i.test(n);
  const isHair = /\b(hair|salon|stylist|hairdress|coiffure|cuts|colour)\b/i.test(n);
  if (isBarber && !isHair) return 'barber';
  if (isHair && !isBarber) return 'hair_salon';
  if (isBarber && isHair) return 'unisex';
  return 'hair_salon'; // default
}

function extractSuburb(address) {
  // Try to extract suburb from "..., Suburb VIC XXXX" pattern
  const m = address.match(/,\s*([A-Za-z\s]+?)\s+VIC\s+\d{4}/);
  if (m) return m[1].trim();
  // Fallback
  const parts = address.split(',');
  if (parts.length >= 2) {
    const last = parts[parts.length - 1].trim().replace(/\s*VIC\s*\d*.*$/, '').trim();
    if (last) return last;
  }
  return 'Geelong';
}

function formatPhone(raw) {
  if (!raw) return null;
  // CSV phones look like 61352824240.0 — strip .0, format as 0X XXXX XXXX
  let digits = raw.replace(/\.0$/, '').replace(/\D/g, '');
  if (digits.startsWith('61')) digits = '0' + digits.slice(2);
  if (!digits.startsWith('0')) digits = '0' + digits;
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return digits;
}

async function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(raw);
  console.log(`📄 Parsed ${rows.length} rows from CSV`);

  const pg = pgClient();
  await pg.connect();

  // Get geelong region
  const regionRes = await pg.query("SELECT id, name, state FROM regions WHERE slug='geelong'");
  if (regionRes.rowCount === 0) {
    console.error('Region "geelong" not found');
    process.exit(1);
  }
  const region = regionRes.rows[0];
  console.log(`📍 Region: ${region.name} (${region.state}), id=${region.id}`);

  // Load existing suburbs for this region
  const suburbRes = await pg.query('SELECT id, name, slug FROM suburbs WHERE region_id=$1', [region.id]);
  const suburbMap = new Map();
  for (const s of suburbRes.rows) suburbMap.set(s.name.toLowerCase(), s);
  console.log(`   ${suburbMap.size} existing suburbs`);

  // Load existing businesses for this region
  const bizRes = await pg.query(
    `SELECT id, name, address_line1, suburb, lat, lng, phone, slug, status, confidence_score
     FROM businesses WHERE region_id=$1`,
    [region.id],
  );
  console.log(`   ${bizRes.rowCount} existing businesses`);

  // Build lookup indexes
  const bizByNormAddr = new Map();
  const bizByName = [];
  for (const b of bizRes.rows) {
    const norm = normaliseAddress(b.address_line1);
    if (norm) bizByNormAddr.set(norm, b);
    bizByName.push(b);
  }

  let updated = 0;
  let inserted = 0;
  let skipped = 0;
  let suburbsCreated = 0;

  for (const row of rows) {
    const name = row['Business Name'];
    const address = row['Address'] || '';
    const lat = parseFloat(row['Latitude']);
    const lng = parseFloat(row['Longitude']);
    const phone = formatPhone(row['Phone']);
    const suburb = extractSuburb(address);

    if (!name) { skipped++; continue; }

    // Ensure suburb exists
    const subKey = suburb.toLowerCase();
    let suburbRow = suburbMap.get(subKey);
    if (!suburbRow) {
      const subSlug = slugify(`geelong-${suburb}`);
      try {
        const ins = await pg.query(
          `INSERT INTO suburbs (name, slug, state, region_id, lat, lng)
           VALUES ($1, $2, 'VIC', $3, $4, $5)
           ON CONFLICT (slug) DO NOTHING
           RETURNING id, name, slug`,
          [suburb, subSlug, region.id, lat, lng],
        );
        if (ins.rowCount > 0) {
          suburbRow = ins.rows[0];
          suburbMap.set(subKey, suburbRow);
          suburbsCreated++;
          console.log(`  + suburb: ${suburb}`);
        } else {
          // Slug conflict from another region — try fetch
          const existing = await pg.query('SELECT id, name, slug FROM suburbs WHERE slug=$1', [subSlug]);
          if (existing.rowCount > 0) suburbRow = existing.rows[0];
          suburbMap.set(subKey, suburbRow);
        }
      } catch (err) {
        console.error(`  ✗ suburb ${suburb}: ${err.message}`);
      }
    }

    // Extract street address (first part before suburb)
    const addrLine1 = address.split(',')[0] || address;

    // Try to match by normalised address
    const normAddr = normaliseAddress(address);
    let match = bizByNormAddr.get(normAddr);

    // If no address match, try name similarity within same suburb
    if (!match) {
      for (const b of bizByName) {
        if (b.suburb?.toLowerCase() === subKey && nameSimilarity(b.name, name) >= 0.85) {
          match = b;
          break;
        }
      }
    }

    // Also try name match across all businesses (high threshold)
    if (!match) {
      for (const b of bizByName) {
        if (nameSimilarity(b.name, name) >= 0.95) {
          match = b;
          break;
        }
      }
    }

    if (match) {
      // Update if we have better data
      const updates = [];
      const vals = [];
      let idx = 1;

      if (lat && !isNaN(lat) && (!match.lat || Math.abs(match.lat - lat) > 0.001)) {
        updates.push(`lat=$${idx++}`);
        vals.push(lat);
      }
      if (lng && !isNaN(lng) && (!match.lng || Math.abs(match.lng - lng) > 0.001)) {
        updates.push(`lng=$${idx++}`);
        vals.push(lng);
      }
      if (phone && !match.phone) {
        updates.push(`phone=$${idx++}`);
        vals.push(phone);
      }
      if (suburbRow && suburbRow.id) {
        updates.push(`suburb_id=$${idx++}`);
        vals.push(suburbRow.id);
      }

      if (updates.length > 0) {
        updates.push(`updated_at=now()`);
        vals.push(match.id);
        await pg.query(
          `UPDATE businesses SET ${updates.join(', ')} WHERE id=$${idx}`,
          vals,
        );
        updated++;
        console.log(`  ↻ ${name} (updated ${updates.length - 1} field(s))`);
      } else {
        skipped++;
      }
    } else {
      // Insert new business
      const bizType = classifyByName(name);
      const bizSlug = slugify(`${name}-${suburb}`);
      const postMatch = address.match(/\b(\d{4})\b/);
      const postcode = postMatch ? postMatch[1] : '';

      try {
        await pg.query(
          `INSERT INTO businesses (
            name, slug, business_type, address_line1, suburb, state, postcode,
            lat, lng, phone, region_id, suburb_id, status, confidence_score
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'unverified',50)
          ON CONFLICT (slug) DO NOTHING`,
          [
            name, bizSlug, bizType, addrLine1, suburb, 'VIC', postcode,
            isNaN(lat) ? null : lat,
            isNaN(lng) ? null : lng,
            phone, region.id, suburbRow?.id ?? null,
          ],
        );
        inserted++;
        console.log(`  + ${name} [${bizType}] — ${suburb}`);
      } catch (err) {
        if (/duplicate key.*slug/i.test(err.message)) {
          // Retry with suffix
          try {
            await pg.query(
              `INSERT INTO businesses (
                name, slug, business_type, address_line1, suburb, state, postcode,
                lat, lng, phone, region_id, suburb_id, status, confidence_score
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'unverified',50)
              ON CONFLICT (slug) DO NOTHING`,
              [
                name, `${bizSlug}-2`, bizType, addrLine1, suburb, 'VIC', postcode,
                isNaN(lat) ? null : lat, isNaN(lng) ? null : lng,
                phone, region.id, suburbRow?.id ?? null,
              ],
            );
            inserted++;
            console.log(`  + ${name} [${bizType}] — ${suburb} (slug suffixed)`);
          } catch (err2) {
            console.error(`  ✗ ${name}: ${err2.message}`);
            skipped++;
          }
        } else {
          console.error(`  ✗ ${name}: ${err.message}`);
          skipped++;
        }
      }
    }
  }

  // Final tally
  const finalRes = await pg.query(
    `SELECT count(*)::int AS total,
            sum(case when status='active' then 1 else 0 end)::int AS active
     FROM businesses WHERE region_id=$1`,
    [region.id],
  );
  const tally = finalRes.rows[0];

  console.log('\n═══════════════════════════════════════');
  console.log('Geelong CSV Import Complete');
  console.log('═══════════════════════════════════════');
  console.log(`  CSV rows:         ${rows.length}`);
  console.log(`  New suburbs:      ${suburbsCreated}`);
  console.log(`  Updated:          ${updated}`);
  console.log(`  Inserted:         ${inserted}`);
  console.log(`  Skipped/matched:  ${skipped}`);
  console.log(`  Total businesses: ${tally.total}`);
  console.log(`  Active:           ${tally.active}`);

  await pg.end();
}

main().catch((err) => {
  console.error('❌ import failed:', err);
  process.exit(1);
});
