#!/usr/bin/env node
/**
 * gsc-sync.js — Sync GSC performance data into Supabase + detect declining pages
 *
 * This is the weekly cron script. It:
 *   1. Pulls last 7 days of GSC data for findme.hair (via gsc-report.js logic)
 *   2. Upserts into content_published (matched by URL, org='findme.hair')
 *   3. Compares new impressions vs stored impressions — flags >50% drops as issues
 *   4. Creates Paperclip FIN issues for top-declining pages needing content refresh
 *
 * ── Auth ────────────────────────────────────────────────────────────────────
 *   Same as gsc-report.js — GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_PATH
 *   Plus standard Supabase env vars from .env.local
 *
 * ── Usage ───────────────────────────────────────────────────────────────────
 *   node scripts/gsc-sync.js                      # 7-day window (default)
 *   node scripts/gsc-sync.js --dry-run             # print without writing
 *   node scripts/gsc-sync.js --org sheargenius     # run for sheargenius.com.au
 *
 * ── Orgs ────────────────────────────────────────────────────────────────────
 *   findme     → sc-domain:findme.hair        (default)
 *   sheargenius → sc-domain:sheargenius.com.au
 */

'use strict';

require('dotenv').config({ path: '.env.local' });

const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────

const ORG_CONFIG = {
  findme: {
    siteUrl: 'sc-domain:findme.hair',
    org: 'findme.hair',
    issuePrefix: 'FIN',
    baseUrl: 'https://www.findme.hair',
  },
  sheargenius: {
    siteUrl: 'sc-domain:sheargenius.com.au',
    org: 'sheargenius.com.au',
    issuePrefix: 'SHE',
    baseUrl: 'https://www.sheargenius.com.au',
  },
};

const DEFAULT_DAYS = 7;
const ROW_LIMIT = 25000;
const DECLINE_THRESHOLD = 0.5;  // 50% drop = flag for content refresh
const MIN_IMPRESSIONS = 10;     // ignore pages with very low baseline
const MAX_ISSUES_PER_RUN = 5;   // cap Paperclip issues created per run

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const orgKey = args.includes('--org') ? args[args.indexOf('--org') + 1] : 'findme';
const config = ORG_CONFIG[orgKey];
if (!config) {
  console.error(`Unknown --org value: "${orgKey}". Valid: ${Object.keys(ORG_CONFIG).join(', ')}`);
  process.exit(1);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function loadCredentials() {
  const jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  if (jsonStr) {
    try { return JSON.parse(jsonStr); }
    catch { throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.'); }
  }
  if (jsonPath) {
    const resolved = path.resolve(jsonPath);
    if (!fs.existsSync(resolved)) throw new Error(`Key file not found: ${resolved}`);
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  }
  throw new Error(
    'No GSC credentials found.\n' +
    'Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_PATH.'
  );
}

// ── Date range ────────────────────────────────────────────────────────────────

function dateRange(days = DEFAULT_DAYS) {
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return {
    startDate: end.toISOString().slice(0, 10),
    endDate: new Date(end.getTime() - (days - 1) * 86400000).toISOString().slice(0, 10),
  };
}

function last7Days() {
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

// ── GSC fetch ─────────────────────────────────────────────────────────────────

async function fetchPages(webmasters, range) {
  const rows = [];
  let startRow = 0;
  while (true) {
    const res = await webmasters.searchanalytics.query({
      siteUrl: config.siteUrl,
      requestBody: {
        startDate: range.startDate,
        endDate: range.endDate,
        dimensions: ['page'],
        rowLimit: ROW_LIMIT,
        startRow,
      },
    });
    const batch = res.data.rows || [];
    rows.push(...batch);
    if (batch.length < ROW_LIMIT) break;
    startRow += ROW_LIMIT;
  }
  return rows;
}

// ── Paperclip issue creation ──────────────────────────────────────────────────

function paperclipRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const apiUrl = new URL(process.env.PAPERCLIP_API_URL || 'http://localhost:3000');
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || (apiUrl.protocol === 'https:' ? 443 : 80),
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAPERCLIP_API_KEY}`,
        'X-Paperclip-Run-Id': process.env.PAPERCLIP_RUN_ID || 'gsc-sync-manual',
      },
    };
    const req = (apiUrl.protocol === 'https:' ? https : require('http')).request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createDeclineIssue(page, currentImpressions, prevImpressions) {
  const dropPct = Math.round((1 - currentImpressions / prevImpressions) * 100);
  const companyId = process.env.PAPERCLIP_COMPANY_ID;
  if (!companyId) {
    console.log(`  [skip] No PAPERCLIP_COMPANY_ID — would create issue for ${page}`);
    return;
  }

  const title = `Content refresh: ${page.replace(config.baseUrl, '') || '/'} — ${dropPct}% impression drop`;
  const description = `## GSC Decline Alert\n\n` +
    `Page: ${page}\n\n` +
    `- Previous impressions (7d): ${prevImpressions}\n` +
    `- Current impressions (7d): ${currentImpressions}\n` +
    `- Drop: ${dropPct}%\n\n` +
    `Auto-detected by weekly GSC sync (gsc-sync.js). Review and refresh content.`;

  const res = await paperclipRequest('POST', `/api/companies/${companyId}/issues`, {
    title,
    description,
    priority: dropPct >= 75 ? 'high' : 'medium',
    labels: ['content-refresh', 'gsc-decline'],
  });

  if (res.status === 201 || res.status === 200) {
    console.log(`  ✓ Created issue: ${res.body.identifier} — ${title}`);
  } else {
    console.log(`  ✗ Failed to create issue (${res.status}): ${JSON.stringify(res.body)}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nGSC Sync — ${config.org}`);
  console.log(`Property : ${config.siteUrl}`);
  if (dryRun) console.log('MODE     : DRY RUN (no writes)\n');
  else console.log('MODE     : LIVE\n');

  // Auth
  const credentials = loadCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const webmasters = google.webmasters({ version: 'v3', auth });

  // Fetch GSC data
  const range = last7Days();
  console.log(`Fetching GSC data: ${range.startDate} → ${range.endDate}`);
  const gscRows = await fetchPages(webmasters, range);
  console.log(`  ${gscRows.length} pages returned from GSC\n`);

  if (gscRows.length === 0) {
    console.log('No data returned from GSC. Exiting.');
    return;
  }

  // Supabase
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Fetch existing content_published records for this org
  const { data: existing, error: fetchErr } = await sb
    .from('content_published')
    .select('id, url, gsc_impressions_7d, gsc_clicks_7d, gsc_avg_position')
    .eq('org', config.org);

  if (fetchErr) throw new Error(`Supabase fetch failed: ${fetchErr.message}`);

  const existingByUrl = Object.fromEntries((existing || []).map(r => [r.url, r]));
  console.log(`Existing content_published rows for ${config.org}: ${Object.keys(existingByUrl).length}`);

  // Build upserts and detect declines
  const upserts = [];
  const declines = [];

  for (const row of gscRows) {
    const url = row.keys[0];
    const impressions = row.impressions;
    const clicks = row.clicks;
    const position = parseFloat(row.position.toFixed(2));

    const prev = existingByUrl[url];
    const prevImpressions = prev?.gsc_impressions_7d ?? null;

    // Decline detection
    if (
      prevImpressions !== null &&
      prevImpressions >= MIN_IMPRESSIONS &&
      impressions < prevImpressions * (1 - DECLINE_THRESHOLD)
    ) {
      declines.push({ url, currentImpressions: impressions, prevImpressions });
    }

    if (prev) {
      // Update existing row
      upserts.push({
        id: prev.id,
        url,
        org: config.org,
        gsc_impressions_7d: impressions,
        gsc_clicks_7d: clicks,
        gsc_avg_position: position,
        last_updated: new Date().toISOString(),
      });
    } else {
      // Insert new row — derive content_type from URL pattern
      upserts.push({
        url,
        org: config.org,
        content_type: inferContentType(url),
        gsc_impressions_7d: impressions,
        gsc_clicks_7d: clicks,
        gsc_avg_position: position,
        published_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      });
    }
  }

  // Sort declines by severity
  declines.sort((a, b) => {
    const dropA = 1 - a.currentImpressions / a.prevImpressions;
    const dropB = 1 - b.currentImpressions / b.prevImpressions;
    return dropB - dropA;
  });

  console.log(`\nUpserts prepared: ${upserts.length}`);
  console.log(`Declines detected: ${declines.length}`);
  if (declines.length > 0) {
    console.log('\nTop declines:');
    declines.slice(0, 5).forEach(d => {
      const drop = Math.round((1 - d.currentImpressions / d.prevImpressions) * 100);
      console.log(`  ${drop}% drop — ${d.url} (${d.prevImpressions} → ${d.currentImpressions} impressions)`);
    });
  }

  if (dryRun) {
    console.log('\nDry run — no writes performed.');
    return;
  }

  // Upsert to Supabase in batches of 500
  const BATCH = 500;
  let upserted = 0;
  for (let i = 0; i < upserts.length; i += BATCH) {
    const batch = upserts.slice(i, i + BATCH);
    const { error } = await sb.from('content_published').upsert(batch, { onConflict: 'url' });
    if (error) {
      console.error(`Upsert error (batch ${i / BATCH + 1}):`, error.message);
    } else {
      upserted += batch.length;
    }
  }
  console.log(`\n✓ Upserted ${upserted} rows into content_published`);

  // Create Paperclip issues for top declines
  if (declines.length > 0) {
    console.log(`\nCreating Paperclip issues for top ${Math.min(declines.length, MAX_ISSUES_PER_RUN)} declines...`);
    for (const d of declines.slice(0, MAX_ISSUES_PER_RUN)) {
      await createDeclineIssue(d.url, d.currentImpressions, d.prevImpressions);
    }
  }

  console.log('\nDone.');
}

function inferContentType(url) {
  if (url.includes('/blog/')) return 'blog';
  if (url.includes('/best-hairdresser/')) return 'landing';
  if (url.includes('/salon/')) return 'listing';
  if (url.match(/\/[a-z-]+\/[a-z-]+\/[a-z-]+/)) return 'suburb';
  if (url.match(/\/[a-z-]+\/[a-z-]+/)) return 'region';
  if (url.match(/\/[a-z-]+\/?$/)) return 'state';
  return 'page';
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
