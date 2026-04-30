#!/usr/bin/env node
/**
 * gsc-report.js — Google Search Console performance report for findme.hair
 *
 * Pulls last 90 days (or custom range) of performance data via the GSC API.
 * Outputs two CSVs.
 *
 * ── Auth setup (pick one — Option A is recommended, no GCP console required) ─
 *
 * Option A — Application Default Credentials (recommended, lightest setup):
 *   1. Run once on the machine that runs this script:
 *        gcloud auth application-default login \
 *          --scopes=https://www.googleapis.com/auth/webmasters.readonly
 *   2. In GSC, Settings → Users → Add the same Google account as RESTRICTED.
 *
 * Option B — Service account JSON (legacy, kept for backward compat):
 *   1. Create a GCP project + enable the Google Search Console API.
 *   2. Create a service account, generate a JSON key, download it.
 *   3. In GSC, Settings → Users → Add the service-account email.
 *   4. Set GOOGLE_SERVICE_ACCOUNT_JSON='{...}' or GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/key.json
 *
 * Required scope: https://www.googleapis.com/auth/webmasters.readonly
 *
 * ── Usage ───────────────────────────────────────────────────────────────────
 *
 *   node scripts/gsc-report.js                         # last 90 days
 *   node scripts/gsc-report.js --date-range 30d        # last 30 days
 *   node scripts/gsc-report.js --date-range 2026-01-01:2026-04-17
 *
 * ── Output ──────────────────────────────────────────────────────────────────
 *
 *   gsc-by-page.csv   — clicks / impressions / CTR / position by page
 *   gsc-by-query.csv  — clicks / impressions / CTR / position by query
 */

'use strict';

require('dotenv').config({ path: '.env.local' });

const { google } = require('googleapis');
const fs = require('fs');
const { getGoogleAuth } = require('../lib/google-auth');

// ── Config ───────────────────────────────────────────────────────────────────

const SITE_URL = 'sc-domain:findme.hair'; // Domain property (both www + non-www)
const DEFAULT_DAYS = 90;
const ROW_LIMIT = 25000; // GSC API max per request

// ── Date range ────────────────────────────────────────────────────────────────

function parseDateRange(arg) {
  if (!arg) {
    const end = new Date();
    end.setDate(end.getDate() - 3); // GSC data lags ~3 days
    const start = new Date(end);
    start.setDate(start.getDate() - DEFAULT_DAYS + 1);
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  // "30d" → last N days
  if (/^\d+d$/i.test(arg)) {
    const days = parseInt(arg, 10);
    const end = new Date();
    end.setDate(end.getDate() - 3);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  // "2026-01-01:2026-04-17"
  const parts = arg.split(':');
  if (parts.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0]) && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
    return { startDate: parts[0], endDate: parts[1] };
  }

  throw new Error(
    `Invalid --date-range value: "${arg}"\n` +
    'Use "30d" for last 30 days, or "YYYY-MM-DD:YYYY-MM-DD" for a fixed range.'
  );
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

// ── GSC API ───────────────────────────────────────────────────────────────────

async function fetchDimension(webmasters, dateRange, dimension) {
  const rows = [];
  let startRow = 0;

  while (true) {
    const res = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: [dimension],
        rowLimit: ROW_LIMIT,
        startRow,
      },
    });

    const batch = res.data.rows || [];
    rows.push(...batch);

    if (batch.length < ROW_LIMIT) break;
    startRow += ROW_LIMIT;
    console.log(`  ... fetched ${rows.length} ${dimension} rows so far`);
  }

  return rows;
}

// ── CSV ───────────────────────────────────────────────────────────────────────

function escapeCsv(v) {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}

function writeReport(filename, gscRows, key) {
  const headers = [key, 'clicks', 'impressions', 'ctr_pct', 'avg_position'];

  const records = gscRows.map(r => ({
    [key]: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr_pct: (r.ctr * 100).toFixed(2),
    avg_position: r.position.toFixed(1),
  }));

  records.sort((a, b) => b.impressions - a.impressions);

  const lines = [
    headers.join(','),
    ...records.map(r => headers.map(h => escapeCsv(r[h])).join(',')),
  ];

  fs.writeFileSync(filename, lines.join('\n') + '\n', 'utf8');
  console.log(`  ✓ ${filename} — ${records.length} rows`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const drIdx = args.indexOf('--date-range');
  const dateRange = parseDateRange(drIdx >= 0 ? args[drIdx + 1] : null);

  console.log(`\nGSC Report — findme.hair`);
  console.log(`Property : ${SITE_URL}`);
  console.log(`Range    : ${dateRange.startDate} → ${dateRange.endDate}\n`);

  const auth = await getGoogleAuth();
  const webmasters = google.webmasters({ version: 'v3', auth });

  console.log('Fetching by page...');
  const pageRows = await fetchDimension(webmasters, dateRange, 'page');

  console.log('Fetching by query...');
  const queryRows = await fetchDimension(webmasters, dateRange, 'query');

  console.log('\nWriting CSVs...');
  writeReport('gsc-by-page.csv', pageRows, 'page');
  writeReport('gsc-by-query.csv', queryRows, 'query');

  console.log('\nDone.');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
