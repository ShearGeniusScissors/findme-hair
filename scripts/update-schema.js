#!/usr/bin/env node
/**
 * Schema update runner for the findme.hair data pipeline.
 *
 * Adds the 3-level hierarchy (regions + suburbs), verification tracking
 * columns, and the verification_log table. Runs via a direct Postgres
 * connection using the transaction pooler — all statements are idempotent
 * (IF NOT EXISTS / ON CONFLICT), so re-running is safe.
 *
 * Connection: reads SUPABASE_DB_URL from .env.local. If absent, constructs
 * one from NEXT_PUBLIC_SUPABASE_URL (derives project ref) and SUPABASE_DB_PASSWORD.
 *
 * Usage:
 *   node scripts/update-schema.js
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const SQL = `
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state au_state NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suburbs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region_id uuid NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  state au_state NOT NULL,
  slug text UNIQUE NOT NULL,
  postcode text,
  lat float8,
  lng float8,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suburb_id uuid REFERENCES suburbs(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS verification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  check_type text NOT NULL,
  result text NOT NULL,
  raw_data jsonb,
  checked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS confidence_score int2 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS google_business_status text,
  ADD COLUMN IF NOT EXISTS google_photos jsonb,
  ADD COLUMN IF NOT EXISTS google_hours jsonb,
  ADD COLUMN IF NOT EXISTS google_last_checked timestamptz,
  ADD COLUMN IF NOT EXISTS true_local_found boolean,
  ADD COLUMN IF NOT EXISTS yellow_pages_found boolean,
  ADD COLUMN IF NOT EXISTS website_alive boolean,
  ADD COLUMN IF NOT EXISTS verification_flags jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_businesses_region ON businesses(region_id);
CREATE INDEX IF NOT EXISTS idx_businesses_suburb_id ON businesses(suburb_id);
CREATE INDEX IF NOT EXISTS idx_suburbs_region ON suburbs(region_id);
CREATE INDEX IF NOT EXISTS idx_verification_business ON verification_log(business_id);

INSERT INTO regions (name, state, slug) VALUES
  ('Ballarat', 'VIC', 'ballarat'),
  ('Geelong', 'VIC', 'geelong')
ON CONFLICT (slug) DO NOTHING;
`;

function buildConnectionString() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!url || !password) {
    throw new Error(
      'Provide SUPABASE_DB_URL, or both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD, in .env.local',
    );
  }
  const ref = new URL(url).hostname.split('.')[0];
  // Sydney pooler, transaction mode (port 6543), prepared-statement-safe
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres`;
}

async function main() {
  const connectionString = buildConnectionString();
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('→ Connected to Supabase');
  try {
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('✅ Schema updated (regions, suburbs, verification_log, verification columns)');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }

  // Sanity check directly over the Postgres connection — avoids PostgREST
  // cache lag after DDL (NOTIFY pgrst, 'reload schema' hint below).
  const verify = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await verify.connect();
  await verify.query("NOTIFY pgrst, 'reload schema'");
  const { rows } = await verify.query('SELECT slug, state FROM regions ORDER BY slug');
  console.log(`→ regions table has ${rows.length} rows:`);
  rows.forEach((r) => console.log(`    ${r.slug} (${r.state})`));
  await verify.end();
}

main().catch((err) => {
  console.error('❌ update-schema.js failed:', err.message);
  process.exit(1);
});
