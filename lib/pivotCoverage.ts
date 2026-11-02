import { supabaseServerInternal } from '@/lib/supabase';
import type { AuState } from '@/types/database';

/**
 * Index-worthiness check for the templated pivot pages (indexing audit 2026-11-02).
 *
 * GSC on 2 Nov 2026: 1 page indexed, 15,904 "Discovered – currently not indexed",
 * Googlebot down to ~6 refresh crawls a day. Part of the cleanup is to stop asking
 * Google to index pivot pages whose topic the data can't back — e.g. "Korean hair
 * salons in Hobart" with no salon tagged Korean, or "at-home hairdressers" in a
 * suburb with no mobile stylist. Those pages stay live for visitors but are
 * noindexed and left out of the sitemap until real matches exist.
 *
 * The page (generateMetadata) and the sitemap both count through the same pure
 * functions below, so a URL is never in the sitemap while its page says noindex.
 */

export const MIN_CITY_SPECIALTY_MATCHES = 6;
export const MIN_SUBURB_PIVOT_LISTINGS = 3;

// City-pivot routes that promise a specialty. Routes not listed here (best-*,
// walk-in-barber, mens-haircut) list general salons and are always indexable.
export const CITY_PIVOT_SPECIALTY: Record<string, string> = {
  'balayage-specialist': 'balayage',
  'bridal-hair': 'bridal',
  'curly-hair-specialist': 'curly',
  'hair-extensions': 'extensions',
  'japanese-hairdresser': 'japanese',
  'kids-hairdresser': 'kids',
  'korean-hair-salon': 'korean',
  'mobile-hairdresser': 'mobile',
};

export type SuburbPivotRoute = 'hairdresser' | 'barber' | 'at-home-hairdresser';

export const COVERAGE_COLUMNS = 'state, suburb, specialties, is_mobile, name, business_type';

export interface CoverageRow {
  state: string | null;
  suburb: string | null;
  specialties: string[] | null;
  is_mobile: boolean | null;
  name: string | null;
  business_type: string | null;
}

const norm = (s: string | null | undefined) => (s ?? '').toLowerCase().trim();

/** A real mobile / at-home stylist: flagged mobile, tagged mobile, or "mobile" in the name. */
export function isMobileRow(r: CoverageRow): boolean {
  return !!r.is_mobile || (r.specialties ?? []).includes('mobile') || /mobile/i.test(r.name ?? '');
}

function matchesRoute(r: CoverageRow, route: string): boolean {
  if (route === 'hairdresser') return r.business_type === 'hair_salon' || r.business_type === 'unisex';
  if (route === 'barber') return r.business_type === 'barber' || r.business_type === 'unisex';
  if (route === 'at-home-hairdresser') return isMobileRow(r);
  const specialty = CITY_PIVOT_SPECIALTY[route];
  if (!specialty) return true;
  if (specialty === 'mobile') return isMobileRow(r);
  return (r.specialties ?? []).includes(specialty);
}

export function countMatches(rows: CoverageRow[], route: string, state: string, suburbs: string[]): number {
  const wanted = new Set(suburbs.map(norm));
  return rows.filter((r) => r.state === state && wanted.has(norm(r.suburb)) && matchesRoute(r, route)).length;
}

export function cityPivotIndexable(rows: CoverageRow[], route: string, state: string, suburbs: string[]): boolean {
  if (!CITY_PIVOT_SPECIALTY[route]) return true;
  return countMatches(rows, route, state, suburbs) >= MIN_CITY_SPECIALTY_MATCHES;
}

export function suburbPivotIndexable(rows: CoverageRow[], route: SuburbPivotRoute, state: string, suburbName: string): boolean {
  return countMatches(rows, route, state, [suburbName]) >= MIN_SUBURB_PIVOT_LISTINGS;
}

/** Active listings in the given suburbs, coverage columns only (small, page-level). */
export async function fetchCoverageRows(state: AuState, suburbs: string[]): Promise<CoverageRow[]> {
  const supabase = supabaseServerInternal();
  const rows: CoverageRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data } = await supabase
      .from('businesses')
      .select(COVERAGE_COLUMNS)
      .eq('status', 'active')
      .eq('state', state)
      .or(suburbs.map((s) => `suburb.ilike.${s}`).join(','))
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    rows.push(...(data as CoverageRow[]));
    if (data.length < 1000) break;
  }
  return rows;
}

export async function isCityPivotIndexable(route: string, state: AuState, suburbs: string[]): Promise<boolean> {
  if (!CITY_PIVOT_SPECIALTY[route]) return true;
  return cityPivotIndexable(await fetchCoverageRows(state, suburbs), route, state, suburbs);
}

export async function isSuburbPivotIndexable(route: SuburbPivotRoute, state: AuState, suburbName: string): Promise<boolean> {
  return suburbPivotIndexable(await fetchCoverageRows(state, [suburbName]), route, state, suburbName);
}

/** robots value for a pivot page that fails the coverage check. */
export const PIVOT_NOINDEX = { index: false, follow: true } as const;
