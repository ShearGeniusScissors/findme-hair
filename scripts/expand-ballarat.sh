#!/bin/bash
# Full Ballarat suburb scrape pipeline
# Run with: nohup bash scripts/expand-ballarat.sh > /tmp/expansion-ballarat.log 2>&1 &

set -e
cd /Users/mattgrumley/Projects/findme-hair

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  findme.hair — Ballarat Full Suburb Scrape"
echo "  Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "════��═════════════════════════════════��════════════════════"

REGIONS=(ballarat-cbd wendouree sebastopol alfredton ballarat-east)
TOTAL=${#REGIONS[@]}

for i in "${!REGIONS[@]}"; do
  REGION=${REGIONS[$i]}
  NUM=$((i + 1))
  echo ""
  echo "───��───────────────────────────────────────────────────────"
  echo "▶ [${NUM}/${TOTAL}] ${REGION}   ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
  echo "───────────────────────────────────────────────────────────"

  node scripts/discover-suburbs.js --region=${REGION} || {
    echo "❌ discover-suburbs failed for ${REGION}, continuing..."
    continue
  }

  node scripts/scrape-region.js --region=${REGION} || {
    echo "❌ scrape-region failed for ${REGION}, continuing..."
    continue
  }

  node scripts/verify-businesses.js --region=${REGION} || {
    echo "⚠ verify-businesses failed for ${REGION}, continuing..."
  }

  echo "=== Done ${REGION} ==="
done

# Auto-approve
echo ""
echo "▶ Auto-approving Ballarat businesses..."
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
           'Ballarat','Ballarat Central','Ballarat CBD',
           'Wendouree','Sebastopol','Alfredton',
           'Mount Clear','Mount Helen','Delacombe',
           'Buninyong','Lucas','Redan',
           'Golden Point','Soldiers Hill',
           'Black Hill','Invermay','Invermay Park',
           'Nerrina','Brown Hill','Eureka',
           'Lake Gardens','Lake Wendouree',
           'Ballarat West','Canadian','Miners Rest',
           'Warrenheip','Mitchell Park','Bonshaw',
           'Winter Valley','Cardigan','Enfield',
           'Bakery Hill','Newington','Ballarat East',
           'Ballarat North','Smythes Creek',
           'Mount Helen','Windermere','Learmonth',
           'Cardigan Village','Lake Gardens'
         )
       RETURNING id, suburb\`
    );
    console.log('✅ Auto-approved ' + res.rowCount + ' Ballarat businesses');
    const subs = {};
    res.rows.forEach(r => subs[r.suburb] = (subs[r.suburb]||0)+1);
    Object.entries(subs).sort().forEach(([s,c]) => console.log('   ' + s + ': ' + c));
    await pg.end();
  })().catch(e => { console.error(e); process.exit(1); });
" || echo "⚠ auto-approve failed"

# Rebuild Ballarat MATTS RUN CSV
echo ""
echo "▶ Rebuilding Ballarat Matts Run CSVs..."
node -e "
  require('dotenv').config({ path: '.env.local' });
  const { pgClient } = require('./scripts/_pipeline-lib');
  const fs = require('fs');
  const path = require('path');

  function esc(v) {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('\"') || s.includes('\n')) return '\"' + s.replace(/\"/g, '\"\"') + '\"';
    return s;
  }
  function extractStreetSort(addr) {
    if (!addr) return { street: 'zzz', num: 99999 };
    const m = addr.match(/^(\d+[a-zA-Z]?)\s+(.+)/);
    if (m) return { num: parseInt(m[1]), street: m[2].toLowerCase() };
    return { street: (addr||'').toLowerCase(), num: 0 };
  }

  (async () => {
    const pg = pgClient();
    await pg.connect();

    const SUBS = [
      'Alfredton','Bakery Hill','Ballarat','Ballarat Central','Ballarat East',
      'Ballarat North','Ballarat West','Black Hill','Bonshaw','Brown Hill',
      'Buninyong','Canadian','Cardigan','Cardigan Village','Delacombe',
      'Enfield','Eureka','Golden Point','Invermay','Invermay Park',
      'Lake Gardens','Lake Wendouree','Learmonth','Lucas','Miners Rest',
      'Mitchell Park','Mount Clear','Mount Helen','Nerrina','Newington',
      'Redan','Sebastopol','Smythes Creek','Smythesdale','Soldiers Hill',
      'Warrenheip','Wendouree','Windermere','Winter Valley',
      'Creswick','Clunes','Daylesford','Haddon','Navigators'
    ];

    const ph = SUBS.map((_,i) => '\$'+(i+1)).join(',');
    const res = await pg.query(
      \`SELECT id,name,address_line1,suburb,postcode,state,lat,lng,phone,
              website_url,business_type,google_rating,google_review_count,
              confidence_score,status
       FROM businesses
       WHERE state = 'VIC' AND status IN ('active','unverified')
         AND suburb IN (\${ph})\`,
      SUBS
    );

    const sorted = res.rows.sort((a,b) => {
      const sc = (a.suburb||'').localeCompare(b.suburb||'');
      if (sc !== 0) return sc;
      const sa = extractStreetSort(a.address_line1);
      const sb = extractStreetSort(b.address_line1);
      if (sa.street !== sb.street) return sa.street.localeCompare(sb.street);
      return sa.num - sb.num;
    });

    const dir = '/Users/mattgrumley/Downloads/Findme.hair Data/Matts Runs/VIC/Ballarat';
    fs.mkdirSync(dir, { recursive: true });

    let master = 'status,name,address_line1,suburb,postcode,state,lat,lng,phone,website_url,business_type,google_rating,google_review_count,confidence_score,booking_platform,business_id\n';
    sorted.forEach(b => {
      master += [b.status,b.name,b.address_line1,b.suburb,b.postcode,b.state,b.lat,b.lng,b.phone,b.website_url,b.business_type,b.google_rating,b.google_review_count,b.confidence_score,'',b.id].map(esc).join(',') + '\n';
    });
    fs.writeFileSync(path.join(dir, 'Ballarat-MASTER.csv'), master);

    let visits = 'day,suburb,name,address_line1,phone,business_type,google_rating,google_review_count,status,confidence_score,visited,still_open,claimed_listing,scissors_interest,sale_amount,notes,business_id\n';
    sorted.forEach(b => {
      visits += ['Home territory',b.suburb,b.name,b.address_line1,b.phone,b.business_type,b.google_rating,b.google_review_count,b.status,b.confidence_score,'','','','','','',b.id].map(esc).join(',') + '\n';
    });
    fs.writeFileSync(path.join(dir, 'Ballarat-VISITS.csv'), visits);

    // Summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  BALLARAT SCRAPE COMPLETE');
    console.log('═════���═════════════════════════════════════════════════════');
    console.log('  Total Ballarat businesses: ' + sorted.length);
    console.log('  (Original seed data: 89)');
    console.log('');
    const subCounts = {};
    sorted.forEach(b => subCounts[b.suburb] = (subCounts[b.suburb]||0)+1);
    console.log('  SUBURB BREAKDOWN:');
    Object.entries(subCounts).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([s,c]) => {
      console.log('    ' + s.padEnd(24) + String(c).padStart(4));
    });
    const active = sorted.filter(b => b.status === 'active').length;
    const unv = sorted.filter(b => b.status === 'unverified').length;
    console.log('');
    console.log('  Active: ' + active + '  |  Unverified: ' + unv);
    console.log('  Files: Ballarat-MASTER.csv, Ballarat-VISITS.csv');
    console.log('  Location: ~/Downloads/Findme.hair Data/Matts Runs/VIC/Ballarat/');
    console.log('═══════════════════════════════════════���═══════════════════');
    console.log('Finished: ' + new Date().toISOString());
    await pg.end();
  })().catch(e => { console.error(e); process.exit(1); });
"
