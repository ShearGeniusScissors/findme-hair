#!/usr/bin/env node
/**
 * Shear Genius run-sheet ingestion pipeline.
 *
 * Usage:
 *   node scripts/ingest-run-sheet.js <path-to-csv>
 *
 * CSV format — two sections separated by a blank line:
 *
 *   Section 1 — Run metadata (header row + 1 data row):
 *     operator,date,territory,source_doc
 *     Matt Grumley,2026-04-18,Geelong VIC,shear-genius-2026-04-18.csv
 *
 *   [blank line]
 *
 *   Section 2 — Stops (header row + data rows):
 *     business_name,address,suburb,postcode,outcome,type,notes,is_mobile
 *     Curl Up & Dye,123 Main St,Geelong,3220,ACTIVE,Hair Salon,Open and busy,false
 *
 * Outcomes: ACTIVE | NOT_HAIR | CANNOT_CONFIRM
 * Types:    Barber | Hair Salon | Both
 *
 * Idempotent: running the same CSV twice is safe — the field_run row is
 * matched on operator+date+territory+source_doc, and stops already logged
 * in verification_log for this run are skipped.
 */

'use strict';

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { pgClient, slugify, normaliseAddress, nameSimilarity } = require('./_pipeline-lib');

// ─── CSV parsing ─────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSVSection(lines) {
  if (lines.length < 2) return [];
  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const obj = {};
    header.forEach((h, i) => (obj[h] = vals[i] ?? ''));
    return obj;
  });
}

function parseRunSheet(raw) {
  // Split into sections on blank lines
  const allLines = raw.split(/\r?\n/);
  const sections = [];
  let current = [];
  for (const line of allLines) {
    if (line.trim() === '') {
      if (current.length > 0) { sections.push(current); current = []; }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push(current);

  if (sections.length < 2) {
    throw new Error(
      'CSV must have two sections separated by a blank line:\n' +
      '  Section 1: operator,date,territory,source_doc\n' +
      '  Section 2: business_name,address,suburb,postcode,outcome,type,notes,is_mobile'
    );
  }

  const metaRows = parseCSVSection(sections[0]);
  if (metaRows.length !== 1) throw new Error('Section 1 must have exactly one data row (the run metadata).');

  const meta = metaRows[0];
  const required = ['operator', 'date', 'territory', 'source_doc'];
  const missingMeta = required.filter((k) => !meta[k]);
  if (missingMeta.length) throw new Error(`Missing run metadata fields: ${missingMeta.join(', ')}`);

  const stops = parseCSVSection(sections[1]);
  const requiredStop = ['business_name', 'address', 'suburb', 'postcode', 'outcome', 'type'];
  if (stops.length > 0) {
    const firstStop = stops[0];
    const missingStop = requiredStop.filter((k) => !(k in firstStop));
    if (missingStop.length) throw new Error(`Missing stop columns: ${missingStop.join(', ')}`);
  }

  return { meta, stops };
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

const TYPE_MAP = {
  'barber': 'barber',
  'hair salon': 'hair_salon',
  'both': 'unisex',
};

function mapBusinessType(raw) {
  return TYPE_MAP[raw.toLowerCase().trim()] ?? 'hair_salon';
}

function extractState(territory) {
  // "Geelong VIC" → "VIC", "Melbourne CBD VIC" → "VIC"
  const m = territory.match(/\b(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\b/i);
  return m ? m[1].toUpperCase() : 'VIC';
}

// ─── Dedup logic ──────────────────────────────────────────────────────────────

function findMatch(businesses, stop) {
  const normAddr = normaliseAddress(stop.address);
  const suburbKey = (stop.suburb || '').toLowerCase().trim();

  // 1. Exact normalised address
  for (const b of businesses) {
    if (normaliseAddress(b.address_line1) === normAddr && normAddr.length > 3) {
      return { business: b, fuzzy: false };
    }
  }

  // 2. Fuzzy name + suburb (≥0.85 similarity within same suburb)
  for (const b of businesses) {
    if (b.suburb?.toLowerCase() === suburbKey) {
      const sim = nameSimilarity(b.name, stop.business_name);
      if (sim >= 0.85) return { business: b, fuzzy: true };
    }
  }

  // 3. Very high name similarity across all suburbs (≥0.95)
  for (const b of businesses) {
    const sim = nameSimilarity(b.name, stop.business_name);
    if (sim >= 0.95) return { business: b, fuzzy: true };
  }

  return null;
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: node scripts/ingest-run-sheet.js <path-to-csv>');
    process.exit(1);
  }
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const { meta, stops } = parseRunSheet(raw);

  console.log('\n══════════════════════════════════════════════════');
  console.log('  Shear Genius Run-Sheet Ingestion');
  console.log('══════════════════════════════════════════════════');
  console.log(`  Operator:    ${meta.operator}`);
  console.log(`  Date:        ${meta.date}`);
  console.log(`  Territory:   ${meta.territory}`);
  console.log(`  Source doc:  ${meta.source_doc}`);
  console.log(`  Stops:       ${stops.length}`);
  console.log('──────────────────────────────────────────────────\n');

  if (stops.length === 0) {
    console.log('No stops to process. Exiting.');
    return;
  }

  const pg = pgClient();
  await pg.connect();

  try {
    // ── Ensure schema columns exist (idempotent DDL) ──────────────────────────
    await pg.query(`
      ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS last_verified timestamptz,
        ADD COLUMN IF NOT EXISTS notes text,
        ADD COLUMN IF NOT EXISTS is_mobile boolean NOT NULL DEFAULT false;

      DO $$ BEGIN
        ALTER TYPE import_source ADD VALUE IF NOT EXISTS 'shear_genius';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS field_runs (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        operator        text NOT NULL,
        run_date        date NOT NULL,
        territory       text NOT NULL,
        state           text,
        source_document text,
        route_notes     text,
        created_at      timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE field_runs
        ADD COLUMN IF NOT EXISTS stops_total         int NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS stops_active        int NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS stops_not_hair      int NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS stops_cannot_confirm int NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS stops_new           int NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS stops_needs_review  int NOT NULL DEFAULT 0;

      ALTER TABLE verification_log
        ADD COLUMN IF NOT EXISTS field_run_id uuid REFERENCES field_runs(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS coordination_log (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        from_org    text NOT NULL,
        to_org      text NOT NULL,
        topic       text NOT NULL,
        logged_at   timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE coordination_log
        ADD COLUMN IF NOT EXISTS payload jsonb;
    `);

    // ── Ensure record_field_verification helper exists ─────────────────────────
    // Use DO block to avoid "cannot remove parameter defaults" error when the
    // function already exists from the FIN-7 migration with a different signature.
    await pg.query(`
      DO $outer$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.proname = 'record_field_verification'
        ) THEN
          EXECUTE $fn$
            CREATE FUNCTION record_field_verification(
              p_business_id  uuid,
              p_field_run_id uuid,
              p_verified_at  timestamptz,
              p_notes        text
            ) RETURNS void LANGUAGE plpgsql AS $body$
            BEGIN
              UPDATE businesses
              SET
                last_verified = p_verified_at,
                status        = CASE WHEN status = 'unverified' THEN 'active' ELSE status END,
                notes         = CASE
                                  WHEN p_notes IS NOT NULL AND p_notes <> ''
                                  THEN COALESCE(notes || E'\\n', '') || p_notes
                                  ELSE notes
                                END,
                updated_at    = now()
              WHERE id = p_business_id;

              INSERT INTO verification_log (business_id, field_run_id, check_type, result, checked_at)
              VALUES (p_business_id, p_field_run_id, 'field_visit', 'confirmed', p_verified_at);
            END;
            $body$
          $fn$;
        END IF;
      END $outer$;
    `);

    // ── Find or create the field_run row (idempotent) ─────────────────────────
    const runDate = meta.date;   // expected: YYYY-MM-DD
    const state   = extractState(meta.territory);

    let fieldRunId;
    const existingRun = await pg.query(
      `SELECT id FROM field_runs
       WHERE operator = $1 AND run_date = $2 AND territory = $3 AND source_document = $4
       LIMIT 1`,
      [meta.operator, runDate, meta.territory, meta.source_doc],
    );

    if (existingRun.rowCount > 0) {
      fieldRunId = existingRun.rows[0].id;
      console.log(`♻  Reusing existing field_run ${fieldRunId} (already imported — stop-level dedup active)`);
    } else {
      const insertRun = await pg.query(
        `INSERT INTO field_runs (operator, run_date, territory, state, source_document)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [meta.operator, runDate, meta.territory, state, meta.source_doc],
      );
      fieldRunId = insertRun.rows[0].id;
      console.log(`✔  Created field_run ${fieldRunId}`);
    }

    // ── Load all businesses for dedup ─────────────────────────────────────────
    const bizRes = await pg.query(
      `SELECT id, name, address_line1, suburb, state, status
       FROM businesses
       WHERE status NOT IN ('duplicate', 'excluded')`
    );
    const allBiz = bizRes.rows;
    console.log(`   Loaded ${allBiz.length} active/unverified businesses for dedup\n`);

    // ── Load already-processed stops for this run (idempotency) ───────────────
    const doneRes = await pg.query(
      `SELECT business_id FROM verification_log WHERE field_run_id = $1`,
      [fieldRunId],
    );
    const alreadyDone = new Set(doneRes.rows.map((r) => r.business_id));

    // ── Process each stop ─────────────────────────────────────────────────────
    const verifiedAt = new Date(runDate).toISOString();
    const counters = {
      matched: 0, created: 0, excluded: 0,
      cannot_confirm: 0, needs_review: 0, skipped_idempotent: 0,
    };

    for (const stop of stops) {
      const outcome = (stop.outcome || '').toUpperCase().trim();
      const bizName = (stop.business_name || '').trim();
      if (!bizName) continue;

      // CANNOT_CONFIRM — observe and skip
      if (outcome === 'CANNOT_CONFIRM') {
        console.log(`  ? CANNOT_CONFIRM  ${bizName}`);
        counters.cannot_confirm++;
        continue;
      }

      const matchResult = findMatch(allBiz, stop);

      // ── ACTIVE outcome ──────────────────────────────────────────────────────
      if (outcome === 'ACTIVE') {
        if (matchResult) {
          const { business: biz, fuzzy } = matchResult;

          // Idempotency: skip if already logged for this run
          if (alreadyDone.has(biz.id)) {
            console.log(`  ↷ Already processed  ${bizName}`);
            counters.skipped_idempotent++;
            continue;
          }

          const notes = stop.notes || null;
          await pg.query(
            `SELECT record_field_verification($1, $2, $3, $4)`,
            [biz.id, fieldRunId, verifiedAt, notes],
          );
          alreadyDone.add(biz.id);

          // Update type and is_mobile if provided
          if (stop.type) {
            const bizType = mapBusinessType(stop.type);
            const isMobile = (stop.is_mobile || '').toLowerCase() === 'true';
            await pg.query(
              `UPDATE businesses SET business_type = $1, is_mobile = $2, updated_at = now() WHERE id = $3`,
              [bizType, isMobile, biz.id],
            );
          }

          const tag = fuzzy ? ' [fuzzy match]' : '';
          console.log(`  ✔ Verified${tag}  ${bizName} → ${biz.id}`);
          counters.matched++;
        } else {
          // No match — insert new business
          const bizType = mapBusinessType(stop.type || 'Hair Salon');
          const isMobile = (stop.is_mobile || '').toLowerCase() === 'true';
          const bizSlug = slugify(`${bizName}-${stop.suburb}`);
          const notes = stop.notes || null;

          const insertRes = await pg.query(
            `INSERT INTO businesses (
               name, slug, business_type, address_line1, suburb, state, postcode,
               is_mobile, notes, status, last_verified, updated_at
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'unverified', $10, now())
             ON CONFLICT (slug) DO UPDATE
               SET name = EXCLUDED.name, updated_at = now()
             RETURNING id, (xmax = 0) AS inserted`,
            [
              bizName, bizSlug, bizType,
              stop.address, stop.suburb, state, stop.postcode || '',
              isMobile, notes, verifiedAt,
            ],
          );

          const newId = insertRes.rows[0].id;
          const wasInserted = insertRes.rows[0].inserted;

          // Record field verification for the new business
          if (!alreadyDone.has(newId)) {
            await pg.query(
              `SELECT record_field_verification($1, $2, $3, $4)`,
              [newId, fieldRunId, verifiedAt, notes],
            );
            alreadyDone.add(newId);
          }

          if (wasInserted) {
            // Add to in-memory list for intra-run dedup
            allBiz.push({ id: newId, name: bizName, address_line1: stop.address, suburb: stop.suburb, state, status: 'unverified' });
            console.log(`  + New listing       ${bizName} → ${newId} [needs_review]`);
            counters.created++;
            counters.needs_review++;
          } else {
            console.log(`  ↷ Slug conflict resolved  ${bizName} → ${newId}`);
            counters.skipped_idempotent++;
          }
        }
      }

      // ── NOT_HAIR outcome ────────────────────────────────────────────────────
      if (outcome === 'NOT_HAIR') {
        if (matchResult) {
          const { business: biz } = matchResult;
          await pg.query(
            `UPDATE businesses SET status = 'excluded', updated_at = now() WHERE id = $1`,
            [biz.id],
          );
          // Log the visit even for exclusions (audit trail)
          if (!alreadyDone.has(biz.id)) {
            await pg.query(
              `INSERT INTO verification_log (business_id, field_run_id, check_type, result, checked_at)
               VALUES ($1, $2, 'field_visit', 'not_hair', $3)`,
              [biz.id, fieldRunId, verifiedAt],
            );
            alreadyDone.add(biz.id);
          }
          console.log(`  ✗ NOT_HAIR excluded  ${bizName} → ${biz.id}`);
        } else {
          console.log(`  ✗ NOT_HAIR (no match, skip)  ${bizName}`);
        }
        counters.excluded++;
      }
    }

    // ── Update field_run stop counters ────────────────────────────────────────
    await pg.query(
      `UPDATE field_runs SET
         stops_total          = $1,
         stops_active         = $2,
         stops_not_hair       = $3,
         stops_cannot_confirm = $4,
         stops_new            = $5,
         stops_needs_review   = $6
       WHERE id = $7`,
      [
        stops.length,
        counters.matched + counters.created,
        counters.excluded,
        counters.cannot_confirm,
        counters.created,
        counters.needs_review,
        fieldRunId,
      ],
    );

    // ── Ingestion report ──────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════');
    console.log('  Ingestion Report');
    console.log('══════════════════════════════════════════════════');
    console.log(`  Run ID:               ${fieldRunId}`);
    console.log(`  Total stops:          ${stops.length}`);
    console.log(`  Matched & verified:   ${counters.matched}`);
    console.log(`  New listings created: ${counters.created}`);
    console.log(`    → needs_review:     ${counters.needs_review}`);
    console.log(`  NOT_HAIR excluded:    ${counters.excluded}`);
    console.log(`  CANNOT_CONFIRM:       ${counters.cannot_confirm}`);
    console.log(`  Already processed:    ${counters.skipped_idempotent}`);
    console.log('══════════════════════════════════════════════════\n');

    // ── Write coordination_log entry ──────────────────────────────────────────
    await pg.query(
      `INSERT INTO coordination_log (from_org, to_org, topic, message, payload)
       VALUES ('SG', 'FMH', 'run_sheet_ingest', $1, $2)`,
      [
        `Run sheet ingested: ${meta.operator} / ${meta.territory} / ${runDate} — ${stops.length} stops`,
        JSON.stringify({
          field_run_id:   fieldRunId,
          operator:       meta.operator,
          run_date:       runDate,
          territory:      meta.territory,
          source_doc:     meta.source_doc,
          stops_total:    stops.length,
          matched:        counters.matched,
          created:        counters.created,
          excluded:       counters.excluded,
          cannot_confirm: counters.cannot_confirm,
          needs_review:   counters.needs_review,
        }),
      ],
    );
    console.log('  coordination_log entry written (SG → FMH)');

    // Query needs_review listings for operator reference
    if (counters.needs_review > 0) {
      const reviewRes = await pg.query(
        `SELECT b.id, b.name, b.suburb, b.state
         FROM businesses b
         JOIN verification_log vl ON vl.business_id = b.id
         WHERE vl.field_run_id = $1
           AND b.status = 'unverified'
         ORDER BY b.name`,
        [fieldRunId],
      );
      if (reviewRes.rowCount > 0) {
        console.log('  Listings flagged for review:');
        for (const r of reviewRes.rows) {
          console.log(`    - ${r.name} (${r.suburb} ${r.state}) [${r.id}]`);
        }
        console.log('');
      }
    }

  } finally {
    await pg.end();
  }
}

main().catch((err) => {
  console.error('\n❌ Ingestion failed:', err.message);
  process.exit(1);
});
