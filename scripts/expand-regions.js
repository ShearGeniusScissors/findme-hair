#!/usr/bin/env node
/**
 * Master Australia-wide expansion runner.
 *
 * For each region in the REGIONS list:
 *   1. discover suburbs (Google Places → suburbs table)
 *   2. scrape businesses (Google Places → businesses table, status=unverified)
 *   3. verify businesses (Google re-confirm + TrueLocal + Yellow Pages + website HEAD)
 *   4. auto-approve every business with confidence_score >= 75 (status=active)
 *
 * Continues on error — logs failures and moves to the next region.
 * Streams per-region progress to stdout for tailing.
 *
 * Usage:
 *   node scripts/expand-regions.js
 *   node scripts/expand-regions.js --from=melbourne-west        # resume
 *   node scripts/expand-regions.js --only=melbourne-west        # single
 *   node scripts/expand-regions.js --skip=darwin,perth-cbd      # skip
 */

require('dotenv').config({ path: '.env.local' });
const { spawn } = require('child_process');
const { pgClient } = require('./_pipeline-lib');

// Ordered by phase — Melbourne West first per user request, then the full AU sweep.
const REGIONS = [
  // Phase 1 — Melbourne metro
  'melbourne-west',
  'melbourne-cbd',
  'melbourne-inner-north',
  'melbourne-inner-south',
  'melbourne-east',
  'melbourne-north',
  'melbourne-south-east',
  'mornington-peninsula',
  'yarra-valley',
  // Phase 2 — Regional VIC
  'bendigo',
  'shepparton',
  'warrnambool',
  'mildura',
  // Phase 3 — Tasmania
  'hobart',
  'launceston',
  'devonport',
  'burnie',
  // Phase 4 — South Australia
  'adelaide-cbd',
  'adelaide-north',
  'adelaide-south',
  'adelaide-east',
  'adelaide-west',
  'barossa',
  'mount-gambier',
  // Phase 5 — NSW / QLD / WA / NT / ACT
  'sydney-cbd',
  'brisbane-cbd',
  'perth-cbd',
  'canberra',
  'gold-coast',
  'darwin',
];

function parseArgs() {
  const args = {};
  for (const a of process.argv.slice(2)) {
    const [k, v] = a.replace(/^--/, '').split('=');
    args[k] = v ?? true;
  }
  return args;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', cwd: process.cwd() });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exit ${code}`));
    });
  });
}

async function autoApprove(pg, regionSlug) {
  const result = await pg.query(
    `UPDATE businesses b
     SET status='active', updated_at=now()
     FROM regions r
     WHERE b.region_id = r.id
       AND r.slug = $1
       AND b.confidence_score >= 75
       AND b.status = 'unverified'
     RETURNING b.id`,
    [regionSlug],
  );
  return result.rowCount;
}

async function regionTally(pg, regionSlug) {
  const { rows } = await pg.query(
    `SELECT
       count(*)::int AS total,
       sum(case when status='active' then 1 else 0 end)::int AS active,
       sum(case when confidence_score >= 75 then 1 else 0 end)::int AS green,
       sum(case when confidence_score >= 50 and confidence_score < 75 then 1 else 0 end)::int AS amber,
       sum(case when confidence_score < 50 then 1 else 0 end)::int AS red
     FROM businesses b
     JOIN regions r ON b.region_id = r.id
     WHERE r.slug = $1`,
    [regionSlug],
  );
  return rows[0];
}

async function main() {
  const args = parseArgs();
  let list = REGIONS;
  if (args.only) list = args.only.split(',');
  else if (args.from) {
    const idx = REGIONS.indexOf(args.from);
    if (idx === -1) throw new Error(`--from=${args.from} not in region list`);
    list = REGIONS.slice(idx);
  }
  if (args.skip) {
    const skip = new Set(args.skip.split(','));
    list = list.filter((r) => !skip.has(r));
  }

  const pg = pgClient();
  await pg.connect();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  findme.hair — Australia expansion`);
  console.log(`  ${list.length} region(s): ${list.join(', ')}`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════');

  const summary = [];
  for (let i = 0; i < list.length; i++) {
    const slug = list[i];
    const start = Date.now();
    console.log('');
    console.log(`───────────────────────────────────────────────────────────`);
    console.log(`▶ [${i + 1}/${list.length}] ${slug.toUpperCase()}   (${new Date().toISOString()})`);
    console.log(`───────────────────────────────────────────────────────────`);

    const row = { slug, status: 'ok', imported: 0, approved: 0, error: null, seconds: 0 };
    try {
      await run('node', ['scripts/discover-suburbs.js', `--region=${slug}`]);
      await run('node', ['scripts/scrape-region.js', `--region=${slug}`]);
      await run('node', ['scripts/verify-businesses.js', `--region=${slug}`]);
      const approved = await autoApprove(pg, slug);
      const tally = await regionTally(pg, slug);
      row.imported = tally.total;
      row.approved = approved;
      row.tally = tally;
      console.log('');
      console.log(`✅ ${slug}: ${tally.total} imported, ${approved} auto-approved, ` +
        `${tally.green}🟢 / ${tally.amber}🟡 / ${tally.red}🔴`);
    } catch (err) {
      row.status = 'error';
      row.error = err.message;
      console.error('');
      console.error(`❌ ${slug} failed: ${err.message}`);
      console.error(`   continuing to next region...`);
    }
    row.seconds = Math.round((Date.now() - start) / 1000);
    summary.push(row);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  EXPANSION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  let totalImported = 0;
  let totalApproved = 0;
  summary.forEach((r) => {
    const pad = r.slug.padEnd(24);
    const mins = Math.floor(r.seconds / 60);
    const secs = r.seconds % 60;
    if (r.status === 'ok') {
      console.log(`  ${pad} ${String(r.imported).padStart(4)} imported   ${String(r.approved).padStart(4)} approved   ${mins}m${secs}s`);
      totalImported += r.imported;
      totalApproved += r.approved;
    } else {
      console.log(`  ${pad} ❌ ${r.error}`);
    }
  });
  console.log('  ────────────────────────────────────────────');
  console.log(`  TOTAL: ${totalImported} imported, ${totalApproved} auto-approved`);
  console.log(`  Finished: ${new Date().toISOString()}`);
  console.log('');

  await pg.end();
}

main().catch((err) => {
  console.error('❌ expand-regions fatal:', err);
  process.exit(1);
});
