# findme.hair — Data Pipeline Prompt for Claude Code
> Paste this entire document into Claude Code and say: "Read this and execute it start to finish without stopping."
> Claude Code should never ask for confirmation — just run each step, log what it does, and move to the next.

---

## YOUR MISSION

You are building the complete data pipeline for findme.hair — an Australian hair salon and barber directory.

Your job is to:
1. Update the Supabase database schema to support 3-level territory hierarchy and full verification tracking
2. Scrape every hair salon and barber in Ballarat and Geelong from Google Places API
3. Cross-verify every business against Google, True Local, and Yellow Pages
4. Apply verification rules and assign confidence scores
5. Import all verified businesses into Supabase with correct territory/suburb structure
6. All listings go into Supabase with status = 'unverified' — Matt approves in /admin before anything goes live

Do not stop. Do not ask questions. If you hit an error, fix it and continue. Log everything.

---

## CREDENTIALS & PATHS

- Project root: ~/Projects/findme-hair
- Env file: ~/Projects/findme-hair/.env.local
- Supabase project URL: in .env.local as NEXT_PUBLIC_SUPABASE_URL
- Supabase service key: in .env.local as SUPABASE_SERVICE_KEY
- Google Places API key: in .env.local as GOOGLE_PLACES_API_KEY

If GOOGLE_PLACES_API_KEY is missing from .env.local, stop and tell Matt:
"Add your Google Places API key to .env.local as GOOGLE_PLACES_API_KEY=YOUR_KEY_HERE
Get one at: https://console.cloud.google.com/apis/credentials
Enable: Places API (New) + Maps JavaScript API"
Then wait.

---

(full pipeline spec continues — see conversation transcript for authoritative copy)
