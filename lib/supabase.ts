import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * We deliberately do NOT parameterise these clients with the Database
 * generic. Once we introduce a generated types file via `supabase gen types`
 * we can swap these for strictly-typed clients. For now the page code casts
 * rows to the hand-written interfaces in types/database.ts.
 */

/** Browser client — uses the anon key; respects RLS. Use in Client Components. */
export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Service-role client. BYPASSES RLS. Server-side only.
 */
export function supabaseServiceRole() {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_KEY is not set');
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Server-side render client. Was supabaseServerAnon, now backed by service_role
 * because audit row 353f6644 introduces column-level GRANTs that revoke
 * confidence_score / preferred_scissor_supplier_url / scraped_* / notes /
 * verification_flags etc. from anon. Server-render pages need those columns.
 *
 * Callers MUST keep explicit row-level filters (e.g. `.eq('status', 'active')`)
 * because service_role bypasses RLS. Without those filters, excluded /
 * unverified listings would leak onto public pages.
 *
 * Server-only. Never imported into Client Components.
 *
 * Every request from this client gives up after RENDER_DB_TIMEOUT_MS. The
 * database is shared with SG Routes: on 19 Nov 2026 a crawler sweeping
 * hundreds of directory pages left renders waiting up to 300 s on a
 * saturated database, which also took SG Routes (and its sign-in) down for
 * ~15 minutes. Failing fast lets ISR keep serving the last good page instead
 * of piling up more waiting connections.
 */
const RENDER_DB_TIMEOUT_MS = 15_000;

// Only at request time. During `next build` (~1,500 prerendered pages) queries
// can legitimately take longer while the build itself loads the database, and
// a timeout there fails the deploy (it did on 19 Nov, commit 62bc020).
const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  if (IS_BUILD) return fetch(input, init);
  const timeout = AbortSignal.timeout(RENDER_DB_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
}

export function supabaseServerInternal() {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_KEY is not set');
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout },
  });
}

/**
 * SSR-aware server client with cookie access — used for authenticated
 * Server Components. Pass a cookies() adapter from next/headers.
 */
export function supabaseServer(cookieStore: {
  getAll: () => { name: string; value: string }[];
  setAll?: (cookies: { name: string; value: string; options?: object }[]) => void;
}) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookies) => {
        if (cookieStore.setAll) cookieStore.setAll(cookies);
      },
    },
  });
}
