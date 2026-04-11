---
# findme.hair — Master Project Briefing
Version 1.0 | Owner: Matt Grumley | April 2026
This document is the single source of truth for all Claude Cowork and Claude Code work on findme.hair. Read this file at the start of every session before writing any code.

## 1. What is findme.hair?
A national Australian hair salon and barber directory. The public uses it to find hairdressers and barbers near them. Hair and barber only — no beauty, nails, lashes, spa, tattoo, or anything not primarily hair.

Domain: findme.hair (on GoDaddy)
Owner: Matt Grumley, CEO ShearGenius, 30+ years hair industry experience

## 2. Listing Rules
- INCLUDE: hair salons, barber shops, unisex hair salons
- EXCLUDE: nail salons, beauty salons, lash/brow, spa, tattoo, anything not primarily hair
- ONE LISTING PER BUILDING — no chair renters as separate listings
- google_place_id is the deduplication key — one place ID = one listing

## 3. Tech Stack
- Frontend: Next.js 14, App Router, TypeScript
- Database: Supabase (Postgres + Auth + Storage)
- Hosting: Vercel (auto-deploy from GitHub)
- Maps: Google Maps API
- Styling: Tailwind CSS
- Scraping: Google Places API via Node.js scripts
- Version control: GitHub, repo name: findme-hair

## 4. Environment Variables Needed
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=

## 5. Supabase SQL — run this in Supabase SQL editor

CREATE TYPE business_type AS ENUM ('hair_salon', 'barber', 'unisex');
CREATE TYPE business_status AS ENUM ('active', 'unverified', 'closed', 'duplicate', 'excluded');
CREATE TYPE au_state AS ENUM ('VIC', 'TAS', 'SA', 'NSW', 'QLD', 'WA', 'NT', 'ACT');
CREATE TYPE booking_platform AS ENUM ('fresha', 'kitomba', 'shortcuts', 'timely', 'other', 'none');
CREATE TYPE import_source AS ENUM ('google_places', 'manual', 'claimed', 'csv_import');
CREATE TYPE import_decision AS ENUM ('accepted', 'rejected_category', 'rejected_duplicate', 'needs_review');
CREATE TYPE territory_status AS ENUM ('pending', 'imported', 'verified', 'live');
CREATE TYPE user_role AS ENUM ('owner', 'admin');
CREATE TYPE media_type AS ENUM ('cover', 'gallery', 'logo');

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  business_type business_type NOT NULL,
  address_line1 text NOT NULL,
  suburb text NOT NULL,
  state au_state NOT NULL,
  postcode text NOT NULL,
  lat float8,
  lng float8,
  phone text,
  website_url text,
  booking_url text,
  booking_platform booking_platform DEFAULT 'none',
  description text,
  google_place_id text UNIQUE,
  google_rating float4,
  google_review_count int4,
  status business_status NOT NULL DEFAULT 'unverified',
  is_claimed boolean NOT NULL DEFAULT false,
  claimed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  featured_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_businesses_suburb ON businesses(suburb);
CREATE INDEX idx_businesses_state ON businesses(state);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_google_place ON businesses(google_place_id);
CREATE INDEX idx_businesses_fts ON businesses
  USING gin(to_tsvector('english', name || ' ' || suburb || ' ' || coalesce(description, '')));

CREATE TABLE import_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  source import_source NOT NULL,
  raw_name text,
  raw_address text,
  raw_category text,
  google_place_id text,
  import_decision import_decision NOT NULL,
  rejection_reason text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE address_dedup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalised_address text UNIQUE NOT NULL,
  google_place_id text,
  canonical_business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  duplicate_count int4 DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE business_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  media_type media_type NOT NULL DEFAULT 'gallery',
  sort_order int4 DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE opening_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week int2 NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time time,
  close_time time,
  is_closed boolean NOT NULL DEFAULT false,
  UNIQUE(business_id, day_of_week)
);

CREATE TABLE territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state au_state NOT NULL,
  import_status territory_status NOT NULL DEFAULT 'pending',
  raw_count int4 DEFAULT 0,
  live_count int4 DEFAULT 0,
  last_imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO territories (name, state, import_status) VALUES
  ('Ballarat', 'VIC', 'verified'),
  ('Geelong', 'VIC', 'pending'),  -- was 'needs_review' in v1.0; not in territory_status enum
  ('Melbourne CBD', 'VIC', 'pending'),
  ('Bendigo', 'VIC', 'pending'),
  ('Shepparton', 'VIC', 'pending'),
  ('Hobart', 'TAS', 'pending'),
  ('Launceston', 'TAS', 'pending'),
  ('Adelaide CBD', 'SA', 'pending'),
  ('Adelaide North', 'SA', 'pending'),
  ('Adelaide South', 'SA', 'pending');

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active businesses" ON businesses FOR SELECT USING (status = 'active');
CREATE POLICY "Admins read all" ON businesses FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Owners update own listing" ON businesses FOR UPDATE USING (claimed_by = auth.uid());
CREATE POLICY "Owners manage own media" ON business_media FOR ALL USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = business_media.business_id AND businesses.claimed_by = auth.uid()));
CREATE POLICY "Owners manage own hours" ON opening_hours FOR ALL USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = opening_hours.business_id AND businesses.claimed_by = auth.uid()));

## 6. Next.js Project Structure
findme-hair/
├── app/
│   ├── page.tsx                  (landing page — already built)
│   ├── search/page.tsx           (search results + map)
│   ├── [state]/[suburb]/page.tsx (suburb directory)
│   ├── salon/[slug]/page.tsx     (business profile)
│   ├── claim/page.tsx            (claim your listing)
│   ├── dashboard/page.tsx        (owner dashboard)
│   └── admin/page.tsx            (Matt only)
├── components/
│   ├── SearchBar.tsx
│   ├── BusinessCard.tsx
│   ├── MapView.tsx
│   ├── BookingButton.tsx
│   └── ClaimBanner.tsx
├── lib/
│   ├── supabase.ts
│   ├── search.ts
│   └── geo.ts
├── scripts/
│   ├── import-territory.js
│   └── seed-ballarat.js
└── types/database.ts

## 7. Build Order — follow this sequence exactly

Step 1 — Supabase setup
  - Create Supabase project named findme-hair
  - Run all SQL above in Supabase SQL editor
  - Enable Storage bucket named business-media (public read)
  - Collect SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

Step 2 — Next.js init
  - npx create-next-app@latest findme-hair --typescript --tailwind --app
  - npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  - Create .env.local with all keys
  - Push to GitHub repo findme-hair
  - Connect to Vercel for auto-deploy

Step 3 — Seed Ballarat data
  - Run scripts/seed-ballarat.js
  - Verify ~75-85 records accepted in Supabase

Step 4 — Search page

Step 5 — Business profile page

Step 6 — Claim flow

Step 7 — Owner dashboard

Step 8 — Admin panel (Matt only, role = admin)

Step 9 — Geelong clean-up

Step 10 — Territory expansion (VIC → TAS → SA → national)

## 8. Key Rules — never break these
1. One listing per physical address
2. Hair and barber only — no exceptions
3. All imports start as unverified
4. google_place_id is the dedup key
5. If unsure on category, set needs_review — never auto-exclude
6. Pilot user: Caitlyn at CoCo Red salon — contact once claim flow is live

## 9. Monetisation — Phase 5, do not build yet
Free tier: basic listing. Paid ~$25-35/mo: featured placement, booking badge, photos, analytics.
featured_until field is already in the schema.
---
