/**
 * lib/google-auth.js — unified Google API auth for findme.hair scripts.
 *
 * Resolution order (first that resolves wins):
 *   1. GOOGLE_SERVICE_ACCOUNT_JSON   — full JSON key string in env
 *   2. GOOGLE_SERVICE_ACCOUNT_PATH   — path to JSON key file
 *   3. Application Default Credentials — user runs `gcloud auth application-default login` once
 *
 * For findme.hair GSC integration, ADC is the lightest setup: one shell command, no
 * GCP console steps, no JSON files to manage. See docs/GSC_AUTH_SETUP.md.
 */

'use strict';

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const DEFAULT_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

function loadServiceAccountCredentials() {
  const jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;

  if (jsonStr) {
    try { return JSON.parse(jsonStr); }
    catch { throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.'); }
  }

  if (jsonPath) {
    const resolved = path.resolve(jsonPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Service account key file not found: ${resolved}`);
    }
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  }

  return null;
}

/**
 * Returns a Google auth client suitable for `google.webmasters({ auth })`.
 * Throws with an actionable error message if no auth path resolves.
 */
async function getGoogleAuth(scopes = DEFAULT_SCOPES) {
  const serviceAccount = loadServiceAccountCredentials();

  if (serviceAccount) {
    return new google.auth.GoogleAuth({ credentials: serviceAccount, scopes });
  }

  // Fall back to Application Default Credentials.
  // Matt runs `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters.readonly`
  // once and the SDK auto-discovers ~/.config/gcloud/application_default_credentials.json.
  try {
    const auth = new google.auth.GoogleAuth({ scopes });
    await auth.getClient();
    return auth;
  } catch (err) {
    throw new Error(
      'No Google credentials found. Pick one:\n\n' +
      '  Option A (recommended) — Application Default Credentials:\n' +
      '    gcloud auth application-default login \\\n' +
      '      --scopes=https://www.googleapis.com/auth/webmasters.readonly\n' +
      '    Then add yourself as a user in GSC: https://search.google.com/search-console/users\n\n' +
      '  Option B — Service account JSON:\n' +
      '    export GOOGLE_SERVICE_ACCOUNT_JSON=\'{...}\'\n' +
      '    or  GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/key.json\n\n' +
      `Underlying error: ${err.message}`
    );
  }
}

module.exports = { getGoogleAuth, DEFAULT_SCOPES };
