#!/usr/bin/env node
/**
 * Prints the post-pipeline import report for all regions.
 *
 * Usage:
 *   node scripts/pipeline-report.js
 */

require('dotenv').config({ path: '.env.local' });
const { requireEnv, pgClient } = require('./_pipeline-lib');

requireEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_DB_PASSWORD']);

async function regionReport(pg, region) {
  const total = await pg.query(
    'SELECT count(*)::int FROM businesses WHERE region_id=$1',
    [region.id],
  );
  const accepted = await pg.query(
    "SELECT count(*)::int FROM import_log WHERE import_decision='accepted' AND google_place_id IN (SELECT google_place_id FROM businesses WHERE region_id=$1)",
    [region.id],
  );
  const rejCat = await pg.query(
    "SELECT count(*)::int FROM import_log WHERE import_decision='rejected_category' AND imported_at >= now() - interval '7 days'",
  );
  const rejDup = await pg.query(
    "SELECT count(*)::int FROM import_log WHERE import_decision='rejected_duplicate' AND imported_at >= now() - interval '7 days'",
  );
  const byScore = await pg.query(
    `SELECT
       sum(case when confidence_score >= 75 then 1 else 0 end)::int AS green,
       sum(case when confidence_score >= 50 and confidence_score < 75 then 1 else 0 end)::int AS amber,
       sum(case when confidence_score < 50 then 1 else 0 end)::int AS red
     FROM businesses WHERE region_id=$1`,
    [region.id],
  );
  const flags = await pg.query(
    `SELECT flag, count(*)::int AS n
     FROM (
       SELECT jsonb_array_elements_text(verification_flags) AS flag
       FROM businesses WHERE region_id=$1
     ) s
     GROUP BY flag
     ORDER BY n DESC`,
    [region.id],
  );
  const suburbs = await pg.query(
    'SELECT count(*)::int FROM suburbs WHERE region_id=$1',
    [region.id],
  );

  console.log(`\n${region.name.toUpperCase()}`);
  console.log(`  Suburbs discovered:     ${suburbs.rows[0].count}`);
  console.log(`  Raw businesses scraped: ${total.rows[0].count}`);
  console.log(`  Rejected (category):    ${rejCat.rows[0].count}`);
  console.log(`  Rejected (duplicate):   ${rejDup.rows[0].count}`);
  console.log(`  Imported to Supabase:   ${accepted.rows[0].count}`);
  console.log('\n  Verification breakdown:');
  console.log(`    🟢 Confidence 75-100: ${byScore.rows[0].green ?? 0} (approve these first)`);
  console.log(`    🟡 Confidence 50-74:  ${byScore.rows[0].amber ?? 0}`);
  console.log(`    🔴 Confidence 0-49:   ${byScore.rows[0].red ?? 0}`);
  if (flags.rowCount > 0) {
    console.log('\n  Flags:');
    flags.rows.forEach((f) => console.log(`    ${f.flag.padEnd(22)} ${f.n}`));
  }
  return total.rows[0].count ?? 0;
}

async function main() {
  const pg = pgClient();
  await pg.connect();

  console.log('═══════════════════════════════════════');
  console.log('findme.hair — Import Report');
  console.log('═══════════════════════════════════════');

  const { rows: regions } = await pg.query('SELECT id, name FROM regions ORDER BY name');
  let grand = 0;
  for (const r of regions) {
    grand += await regionReport(pg, r);
  }

  console.log('\nTOTAL');
  console.log(`  Total businesses ready for review: ${grand}`);
  console.log(`  At 30 sec/listing: ~${Math.ceil((grand * 30) / 60)} minutes to approve all`);
  console.log('\nNext step: go to /admin and approve listings.');
  console.log('═══════════════════════════════════════\n');

  await pg.end();
}

main().catch((err) => {
  console.error('❌ pipeline-report failed:', err);
  process.exit(1);
});
