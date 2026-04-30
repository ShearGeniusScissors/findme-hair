# GSC auth setup

The findme.hair Google Search Console scripts (`scripts/gsc-report.js`, `scripts/gsc-sync.js`) need read-only access to GSC data for `sc-domain:findme.hair` and `sc-domain:sheargenius.com.au`.

There are two supported paths. **Use Option A** unless you have a specific reason to use a service account.

## Option A — Application Default Credentials (recommended)

One command, then add yourself as a GSC user. No GCP console steps.

```bash
# 1. Authenticate (opens a browser, you sign in as matt@sheargenius.com.au)
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly

# 2. Verify it works
node scripts/gsc-report.js --date-range 7d
```

If GSC says "user not authorised":

1. Go to <https://search.google.com/search-console/users>
2. Pick the property (findme.hair, then repeat for sheargenius.com.au)
3. **Add user** → email `matt@sheargenius.com.au` → Permission: **Restricted** → Add

Done. The credentials are cached at `~/.config/gcloud/application_default_credentials.json` and refresh automatically. No JSON files in the repo.

## Option B — Service account JSON (legacy)

Only use this if Application Default Credentials aren't available (e.g., headless server, CI without browser).

1. <https://console.cloud.google.com/iam-admin/serviceaccounts/create?project=findme-hair> → name `findme-hair-gsc-reader` → no role → DONE
2. Open the new service account → **Keys** → **Add Key** → **Create new key** → **JSON** → save as `./secrets/gsc-service-account.json`
3. <https://search.google.com/search-console/users> → **Add user** → paste the service-account email (looks like `findme-hair-gsc-reader@findme-hair.iam.gserviceaccount.com`) → Restricted → Add
4. Set one of:
   ```bash
   export GOOGLE_SERVICE_ACCOUNT_PATH=./secrets/gsc-service-account.json
   # or
   export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

The script auto-prefers service account if either env var is set, otherwise falls back to ADC.

## Troubleshooting

- **"No Google credentials found"** → run the gcloud command in Option A.
- **"User does not have sufficient permission"** → you forgot step 2 of Option A (add yourself in GSC). Properties are case-sensitive; use exactly `sc-domain:findme.hair` (no `https://` prefix).
- **"Quota exceeded"** → GSC API has a 1,200 queries-per-minute quota. The scripts paginate at 25,000 rows per request, so this is rarely hit.
