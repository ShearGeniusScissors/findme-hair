#!/usr/bin/env node
/**
 * Creates the 'business-photos' Supabase Storage bucket and applies
 * row-level security policies so claimed salon owners can upload/delete
 * their own photos via the browser client.
 *
 * Must be run once before photo upload works in the owner dashboard.
 *
 * Usage:
 *   node scripts/setup-storage.js
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

// Derive project ref from URL: https://<ref>.supabase.co
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('Could not parse project ref from SUPABASE_URL:', SUPABASE_URL);
  process.exit(1);
}

const dbUrl = process.env.SUPABASE_DB_URL
  ?? `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`;

const SQL = `
-- Create the storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-photos',
  'business-photos',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop and re-create policies (idempotent)
DROP POLICY IF EXISTS "Owner can upload their business photos"    ON storage.objects;
DROP POLICY IF EXISTS "Owner can delete their business photos"    ON storage.objects;
DROP POLICY IF EXISTS "Public can view business photos"           ON storage.objects;

-- Anyone can read photos (bucket is public, but explicit policy is cleaner)
CREATE POLICY "Public can view business photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-photos');

-- A claimed owner can upload to their own business folder ({businessId}/*)
CREATE POLICY "Owner can upload their business photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-photos'
    AND (
      SELECT COUNT(*) FROM public.businesses
      WHERE id::text = split_part(name, '/', 1)
        AND claimed_by = auth.uid()
    ) = 1
  );

-- A claimed owner can delete their own photos
CREATE POLICY "Owner can delete their business photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-photos'
    AND (
      SELECT COUNT(*) FROM public.businesses
      WHERE id::text = split_part(name, '/', 1)
        AND claimed_by = auth.uid()
    ) = 1
  );
`;

async function main() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log('Connected to Supabase Postgres. Applying storage setup…');
  await client.query(SQL);
  await client.end();
  console.log('✅ business-photos bucket and RLS policies applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
