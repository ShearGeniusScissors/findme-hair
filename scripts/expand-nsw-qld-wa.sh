#!/bin/bash
# Full expansion pipeline for NSW, QLD, WA — discover, scrape, verify, auto-approve.
# Run with: nohup bash scripts/expand-nsw-qld-wa.sh > /tmp/expansion-nsw-qld-wa.log 2>&1 &

set -e
cd /Users/mattgrumley/Projects/findme-hair

REGIONS=(
  # NSW — Sydney metro
  sydney-cbd
  sydney-inner-west
  sydney-eastern-suburbs
  sydney-north-shore
  sydney-northern-beaches
  sydney-west
  sydney-south-west
  sydney-inner-south
  # NSW — Regional
  newcastle
  wollongong
  central-coast
  albury
  wagga-wagga
  orange
  dubbo
  tamworth
  port-macquarie
  coffs-harbour
  lismore
  ballina
  byron-bay
  tweed-heads
  griffith
  bathurst
  # QLD — Brisbane metro
  brisbane-cbd
  brisbane-inner-south
  brisbane-north
  brisbane-east
  # QLD — Major
  gold-coast
  sunshine-coast
  # QLD — Regional
  townsville
  cairns
  toowoomba
  mackay
  rockhampton
  bundaberg
  hervey-bay
  gladstone
  # WA — Perth metro
  perth-cbd
  perth-north
  perth-south
  perth-east
  perth-west
  # WA — Regional
  bunbury
  geraldton
  kalgoorlie
  albany
  busselton
  margaret-river
  broome
  port-hedland
  karratha
)

TOTAL=${#REGIONS[@]}
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  findme.hair — NSW / QLD / WA Expansion"
echo "  ${TOTAL} regions"
echo "  Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "═══════════════════════════════════════════════════════════"

for i in "${!REGIONS[@]}"; do
  REGION=${REGIONS[$i]}
  NUM=$((i + 1))
  echo ""
  echo "───────────────────────────────────────────────────────────"
  echo "▶ [${NUM}/${TOTAL}] ${REGION}   ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
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
    echo "⚠ verify-businesses failed for ${REGION}, continuing with approve..."
  }

  # Step 4: Auto-approve confidence >= 50 (ground-truth threshold)
  node -e "
    require('dotenv').config({ path: '.env.local' });
    const { pgClient } = require('./scripts/_pipeline-lib');
    (async () => {
      const pg = pgClient();
      await pg.connect();
      const res = await pg.query(
        \`UPDATE businesses b
         SET status='active', updated_at=now()
         FROM regions r
         WHERE b.region_id = r.id
           AND r.slug = \\\$1
           AND b.confidence_score >= 50
           AND (b.google_business_status = 'OPERATIONAL' OR b.google_business_status IS NULL)
           AND b.status = 'unverified'
         RETURNING b.id\`,
        ['${REGION}']
      );
      console.log('✅ Auto-approved ' + res.rowCount + ' listings for ${REGION}');

      const tally = await pg.query(
        \`SELECT count(*)::int AS total,
                sum(case when status='active' then 1 else 0 end)::int AS active
         FROM businesses b JOIN regions r ON b.region_id=r.id WHERE r.slug=\\\$1\`,
        ['${REGION}']
      );
      const t = tally.rows[0];
      console.log('   Total: ' + t.total + ', Active: ' + t.active);
      await pg.end();
    })().catch(e => { console.error(e); process.exit(1); });
  " || echo "⚠ auto-approve query failed for ${REGION}"

  echo "=== Done ${REGION} ==="
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ALL REGIONS COMPLETE"
echo "═══════════════════════════════════════════════════════════"

# Final national report
node -e "
  require('dotenv').config({ path: '.env.local' });
  const { pgClient } = require('./scripts/_pipeline-lib');
  (async () => {
    const pg = pgClient();
    await pg.connect();
    const { rows } = await pg.query(\`
      SELECT state,
        count(*)::int AS total,
        sum(case when status='active' then 1 else 0 end)::int AS active
      FROM businesses GROUP BY state ORDER BY active DESC
    \`);
    console.log('');
    console.log('NATIONAL REPORT');
    console.log('================');
    console.log('State   Active   Total');
    let ta = 0, tt = 0;
    rows.forEach(r => {
      console.log(r.state.padEnd(8) + String(r.active).padStart(6) + String(r.total).padStart(8));
      ta += r.active; tt += r.total;
    });
    console.log('────────────────────');
    console.log('TOTAL ' + String(ta).padStart(8) + String(tt).padStart(8));
    console.log('');
    console.log('Finished: ' + new Date().toISOString());
    await pg.end();
  })().catch(console.error);
"
