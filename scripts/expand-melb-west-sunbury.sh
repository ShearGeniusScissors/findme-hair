#!/bin/bash
# Pipeline 1: Melbourne West missing suburbs
# Pipeline 2: Sunbury Run
# Run with: nohup bash scripts/expand-melb-west-sunbury.sh > /tmp/expansion-melb-west-sunbury.log 2>&1 &

set -e
cd /Users/mattgrumley/Projects/findme-hair

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  findme.hair — Melbourne West + Sunbury Run Expansion"
echo "  Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "═══════════════════════════════════════════════════════════"

# ─── PIPELINE 1: Melbourne West missing suburbs ───────────────

MELB_WEST_REGIONS=(bacchus-marsh melton caroline-springs deer-park laverton-north)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PIPELINE 1: Melbourne West Missing Suburbs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for REGION in "${MELB_WEST_REGIONS[@]}"; do
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "▶ ${REGION}   ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
  echo "───────────────────────────────────────────────────────────"

  # Step 1: Discover suburbs
  node scripts/discover-suburbs.js --region=${REGION} || {
    echo "❌ discover-suburbs failed for ${REGION}, continuing..."
    continue
  }

  # Step 2: Scrape businesses
  node scripts/scrape-region.js --region=${REGION} || {
    echo "❌ scrape-region failed for ${REGION}, continuing..."
    continue
  }

  # Step 3: Verify businesses
  node scripts/verify-businesses.js --region=${REGION} || {
    echo "⚠ verify-businesses failed for ${REGION}, continuing..."
  }

  echo "=== Done ${REGION} ==="
done

# Auto-approve Melbourne West missing suburbs
echo ""
echo "▶ Auto-approving Melbourne West missing suburbs..."
node -e "
  require('dotenv').config({ path: '.env.local' });
  const { pgClient } = require('./scripts/_pipeline-lib');
  (async () => {
    const pg = pgClient();
    await pg.connect();
    const res = await pg.query(
      \`UPDATE businesses SET status='active', updated_at=now()
       WHERE confidence_score >= 50
         AND state = 'VIC'
         AND status = 'unverified'
         AND suburb IN (
           'Bacchus Marsh','Maddingley','Darley',
           'Melton','Melton South','Melton West','Aintree',
           'Caroline Springs','Deer Park','Laverton North'
         )
       RETURNING id, suburb\`
    );
    console.log('✅ Auto-approved ' + res.rowCount + ' Melbourne West businesses');
    const subs = {};
    res.rows.forEach(r => subs[r.suburb] = (subs[r.suburb]||0)+1);
    Object.entries(subs).sort().forEach(([s,c]) => console.log('   ' + s + ': ' + c));
    await pg.end();
  })().catch(e => { console.error(e); process.exit(1); });
" || echo "⚠ auto-approve failed for Melbourne West"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PIPELINE 1 COMPLETE — Melbourne West"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── PIPELINE 2: Sunbury Run ──────────────────────────────────

SUNBURY_REGIONS=(sunbury gisborne woodend kyneton castlemaine daylesford maryborough-vic)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PIPELINE 2: Sunbury Run"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for REGION in "${SUNBURY_REGIONS[@]}"; do
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "▶ ${REGION}   ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
  echo "───────────────────────────────────────────────────────────"

  # Step 1: Discover suburbs
  node scripts/discover-suburbs.js --region=${REGION} || {
    echo "❌ discover-suburbs failed for ${REGION}, continuing..."
    continue
  }

  # Step 2: Scrape businesses
  node scripts/scrape-region.js --region=${REGION} || {
    echo "❌ scrape-region failed for ${REGION}, continuing..."
    continue
  }

  # Step 3: Verify businesses
  node scripts/verify-businesses.js --region=${REGION} || {
    echo "⚠ verify-businesses failed for ${REGION}, continuing..."
  }

  echo "=== Done ${REGION} ==="
done

# Auto-approve Sunbury Run
echo ""
echo "▶ Auto-approving Sunbury Run..."
node -e "
  require('dotenv').config({ path: '.env.local' });
  const { pgClient } = require('./scripts/_pipeline-lib');
  (async () => {
    const pg = pgClient();
    await pg.connect();
    const res = await pg.query(
      \`UPDATE businesses SET status='active', updated_at=now()
       WHERE confidence_score >= 50
         AND state = 'VIC'
         AND status = 'unverified'
         AND suburb IN (
           'Sunbury','Diggers Rest','Woodend','Kyneton','Malmsbury','Trentham',
           'Castlemaine','Chewton','Harcourt','Newstead',
           'Daylesford','Hepburn Springs','Hepburn','Creswick',
           'Maryborough','Dunolly','Avoca','Talbot',
           'Gisborne','New Gisborne','Riddells Creek','Macedon','Mount Macedon',
           'Romsey','Lancefield'
         )
       RETURNING id, suburb\`
    );
    console.log('✅ Auto-approved ' + res.rowCount + ' Sunbury Run businesses');
    const subs = {};
    res.rows.forEach(r => subs[r.suburb] = (subs[r.suburb]||0)+1);
    Object.entries(subs).sort().forEach(([s,c]) => console.log('   ' + s + ': ' + c));
    await pg.end();
  })().catch(e => { console.error(e); process.exit(1); });
" || echo "⚠ auto-approve failed for Sunbury Run"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PIPELINE 2 COMPLETE — Sunbury Run"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── FINAL REPORT ─────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ALL PIPELINES COMPLETE"
echo "═══════════════════════════════════════════════════════════"

node -e "
  require('dotenv').config({ path: '.env.local' });
  const { pgClient } = require('./scripts/_pipeline-lib');
  (async () => {
    const pg = pgClient();
    await pg.connect();

    // Melbourne West missing suburbs
    const mw = await pg.query(
      \`SELECT suburb, count(*)::int AS total,
              sum(case when status='active' then 1 else 0 end)::int AS active
       FROM businesses
       WHERE state = 'VIC'
         AND suburb IN ('Bacchus Marsh','Maddingley','Darley','Melton','Melton South','Melton West','Aintree','Caroline Springs','Deer Park','Laverton North')
       GROUP BY suburb ORDER BY suburb\`
    );
    console.log('');
    console.log('MELBOURNE WEST — NEW SUBURBS:');
    console.log('Suburb               Active  Total');
    let mwA = 0, mwT = 0;
    mw.rows.forEach(r => {
      console.log(r.suburb.padEnd(21) + String(r.active).padStart(6) + String(r.total).padStart(7));
      mwA += r.active; mwT += r.total;
    });
    console.log('─────────────────────────────────');
    console.log('TOTAL'.padEnd(21) + String(mwA).padStart(6) + String(mwT).padStart(7));

    // Sunbury Run
    const sr = await pg.query(
      \`SELECT suburb, count(*)::int AS total,
              sum(case when status='active' then 1 else 0 end)::int AS active
       FROM businesses
       WHERE state = 'VIC'
         AND suburb IN ('Sunbury','Diggers Rest','Woodend','Kyneton','Malmsbury','Trentham','Castlemaine','Chewton','Harcourt','Newstead','Daylesford','Hepburn Springs','Hepburn','Creswick','Maryborough','Dunolly','Avoca','Talbot','Gisborne','New Gisborne','Riddells Creek','Macedon','Mount Macedon','Romsey','Lancefield')
       GROUP BY suburb ORDER BY suburb\`
    );
    console.log('');
    console.log('SUNBURY RUN:');
    console.log('Suburb               Active  Total');
    let srA = 0, srT = 0;
    sr.rows.forEach(r => {
      console.log(r.suburb.padEnd(21) + String(r.active).padStart(6) + String(r.total).padStart(7));
      srA += r.active; srT += r.total;
    });
    console.log('─────────────────────────────────');
    console.log('TOTAL'.padEnd(21) + String(srA).padStart(6) + String(srT).padStart(7));

    console.log('');
    console.log('Finished: ' + new Date().toISOString());
    await pg.end();
  })().catch(console.error);
"

# ─── REBUILD CSV EXPORTS ──────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Rebuilding CSV exports..."
echo "═══════════════════════════════════════════════════════════"

node scripts/rebuild-melb-west-sunbury-csvs.js
