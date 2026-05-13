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
 */
export function supabaseServerInternal() {
  return supabaseServiceRole();
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
