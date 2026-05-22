import { cache } from 'react';
import { supabaseServerInternal } from '@/lib/supabase';
import type { AuState, Business, BusinessType, Region, Suburb } from '@/types/database';

export interface SearchFilters {
  q?: string;
  state?: AuState;
  region?: string; // slug
  suburb?: string; // slug OR name (case-insensitive)
  type?: BusinessType;
  service?: string;
  specialty?: string; // matches specialties[] array column
  walk_ins?: boolean;
  claimed?: boolean;
  open_now?: boolean;
  min_rating?: number;
  limit?: number;
  offset?: number;
}

interface GooglePeriod {
  open?: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

/** Minutes-since-Sunday-00:00 in Australia/Sydney (covers AEDT/AEST). */
function nowMinutesInAuLocal(): { day: number; mins: number } {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const hh = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const mm = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: dayMap[wd] ?? 0, mins: hh * 60 + mm };
}

export function isOpenNow(googleHours: unknown): boolean {
  const h = googleHours as { periods?: GooglePeriod[] } | null;
  if (!h?.periods?.length) return false;
  const now = nowMinutesInAuLocal();
  const nowAbs = now.day * 1440 + now.mins;
  for (const p of h.periods) {
    if (!p.open) continue;
    const openAbs = p.open.day * 1440 + p.open.hour * 60 + p.open.minute;
    // Missing close = open 24h on that day; treat as open for that day only.
    if (!p.close) {
      if (openAbs <= nowAbs && nowAbs < openAbs + 1440) return true;
      continue;
    }
    let closeAbs = p.close.day * 1440 + p.close.hour * 60 + p.close.minute;
    if (closeAbs <= openAbs) closeAbs += 7 * 1440; // wraps past Saturday night
    // Check this week and previous week (covers a Saturday-night → Sunday-morning span)
    if ((openAbs <= nowAbs && nowAbs < closeAbs) ||
        (openAbs - 7 * 1440 <= nowAbs && nowAbs < closeAbs - 7 * 1440)) {
      return true;
    }
  }
  return false;
}

/** Map service filter values to business_type(s) */
const SERVICE_TO_TYPES: Record<string, BusinessType[]> = {
  barber: ['barber'],
  haircut: ['hair_salon', 'unisex'],
  colour: ['hair_salon', 'unisex'],
  blowdry: ['hair_salon', 'unisex'],
  kids: ['hair_salon', 'unisex'],
  extensions: ['hair_salon', 'unisex'],
  mens: ['barber', 'unisex'],
  womens: ['hair_salon', 'unisex'],
  'mens-haircut': ['barber', 'unisex'],
  'ladies-cut': ['hair_salon', 'unisex'],
  'balayage-specialist': ['hair_salon', 'unisex'],
  'colour-specialist': ['hair_salon', 'unisex'],
  'curly-hair-specialist': ['hair_salon', 'unisex'],
  'bridal-hair': ['hair_salon', 'unisex'],
  'kids-hairdresser': ['hair_salon', 'unisex'],
  'mobile-hairdresser': ['hair_salon', 'unisex'],
  'hair-extensions': ['hair_salon', 'unisex'],
  'keratin-treatment': ['hair_salon', 'unisex'],
  highlights: ['hair_salon', 'unisex'],
};

/** Detect if a search query matches a known region slug */
export async function detectRegionFromQuery(q: string): Promise<Region | null> {
  const slug = q.toLowerCase().trim().replace(/\s+/g, '-');
  return getRegionBySlug(slug);
}

export type QueryResolution =
  | { kind: 'suburb'; pattern: string } // ILIKE '%pattern%' against suburb column
  | { kind: 'region'; id: string; slug: string }
  | { kind: 'postcode'; code: string }
  | { kind: 'text'; value: string };

/**
 * Resolve a free-text query into the most specific geographic entity we know about.
 * Preference order: postcode → suburb (exact name) → region (slug or name) → plain text.
 *
 * Returning a specific kind lets the caller apply a strict filter (e.g. region_id = X)
 * instead of an OR across region + name + address that contaminates results with
 * unrelated featured listings.
 */
export async function resolveQuery(q: string): Promise<QueryResolution> {
  const trimmed = q.trim();
  if (!trimmed) return { kind: 'text', value: '' };

  if (/^\d{4}$/.test(trimmed)) return { kind: 'postcode', code: trimmed };

  const supabase = supabaseServerInternal();

  // Any suburb whose name contains the query (case-insensitive).
  // Catches variants: "bondi" → Bondi + Bondi Beach + Bondi Junction + North Bondi.
  // "perth" → Perth + East/North/South/West Perth. "newtown" → all states.
  const { data: subs } = await supabase
    .from('suburbs')
    .select('name')
    .ilike('name', `%${trimmed}%`)
    .limit(1);
  if (subs && subs.length > 0) return { kind: 'suburb', pattern: trimmed };

  // Region by slug (spaces → dashes)
  const slug = trimmed.toLowerCase().replace(/\s+/g, '-');
  const { data: bySlug } = await supabase
    .from('regions')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();
  if (bySlug) return { kind: 'region', id: bySlug.id as string, slug: bySlug.slug as string };

  // Region by exact name
  const { data: byName } = await supabase
    .from('regions')
    .select('id, slug')
    .ilike('name', trimmed)
    .maybeSingle();
  if (byName) return { kind: 'region', id: byName.id as string, slug: byName.slug as string };

  return { kind: 'text', value: trimmed };
}

/**
 * Applies the explicit region/suburb filters AND the resolved q-term in a single pass.
 * We use strict equality/ILIKE-exact so results never contaminate with unrelated featured
 * listings — the old OR(region_id, name ILIKE, address ILIKE, …) pattern was too lax.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
async function applyGeoAndQuery(query: any, filters: SearchFilters): Promise<any> {
  if (filters.region) {
    const region = await getRegionBySlug(filters.region);
    if (region) query = query.eq('region_id', region.id);
  } else if (filters.q) {
    const resolved = await resolveQuery(filters.q);
    switch (resolved.kind) {
      case 'suburb':
        query = query.ilike('suburb', `%${resolved.pattern}%`);
        break;
      case 'region':
        query = query.eq('region_id', resolved.id);
        break;
      case 'postcode':
        query = query.eq('postcode', resolved.code);
        break;
      case 'text': {
        // Narrow fallback: match only name + suburb (address_line1 caused false positives).
        // Audit row da5d8f40: strip PostgREST or()-meta chars so user input can't
        // break out of the filter expression (commas split filters; parens nest them;
        // asterisks and quotes change LIKE semantics).
        const safe = resolved.value.replace(/[,()*"'\\]/g, '');
        if (safe.length > 0) {
          query = query.or(`name.ilike.%${safe}%,suburb.ilike.%${safe}%`);
        }
        break;
      }
    }
  }
  if (filters.suburb) {
    // Explicit suburb filter (e.g. from a suburb page): match exactly.
    const name = filters.suburb.replace(/-/g, ' ');
    query = query.ilike('suburb', name);
  }
  return query;
}

export async function searchBusinesses(filters: SearchFilters): Promise<Business[]> {
  // Internal: returns full Business rows incl. confidence_score for sort + internal
  // columns rendered server-side. Anon role no longer has SELECT on those columns
  // post audit row 353f6644.
  const supabase = supabaseServerInternal();
  const userLimit = filters.limit ?? 40;
  // When open_now is active we over-fetch, filter in JS, then trim.
  const dbLimit = filters.open_now ? Math.min(userLimit * 6, 400) : userLimit;
  let query = supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(dbLimit);

  if (filters.state) query = query.eq('state', filters.state);
  if (filters.type) {
    query = query.eq('business_type', filters.type);
  } else if (filters.service && SERVICE_TO_TYPES[filters.service]) {
    const types = SERVICE_TO_TYPES[filters.service];
    if (types.length === 1) {
      query = query.eq('business_type', types[0]);
    } else {
      query = query.in('business_type', types);
    }
  }

  query = await applyGeoAndQuery(query, filters);
  if (filters.specialty) {
    query = query.contains('specialties', [filters.specialty]);
  }
  if (filters.walk_ins) {
    query = query.eq('walk_ins_welcome', true);
  }
  if (filters.claimed) {
    query = query.eq('is_claimed', true);
  }
  if (filters.min_rating) {
    query = query.gte('google_rating', filters.min_rating);
  }
  if (filters.offset) query = query.range(filters.offset, (filters.offset ?? 0) + (filters.limit ?? 40) - 1);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as Business[];
  if (filters.open_now) {
    return rows.filter((b) => isOpenNow(b.google_hours)).slice(0, userLimit);
  }
  return rows;
}

export async function searchBusinessesCount(filters: Omit<SearchFilters, 'limit' | 'offset'>): Promise<number> {
  const supabase = supabaseServerInternal();
  // open_now cannot be filtered server-side, so count an over-fetched sample.
  if (filters.open_now) {
    const rows = await searchBusinesses({ ...filters, limit: 400 });
    return rows.length;
  }
  let query = supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (filters.state) query = query.eq('state', filters.state);
  if (filters.type) {
    query = query.eq('business_type', filters.type);
  } else if (filters.service && SERVICE_TO_TYPES[filters.service]) {
    const types = SERVICE_TO_TYPES[filters.service];
    if (types.length === 1) {
      query = query.eq('business_type', types[0]);
    } else {
      query = query.in('business_type', types);
    }
  }

  query = await applyGeoAndQuery(query, filters);
  if (filters.specialty) {
    query = query.contains('specialties', [filters.specialty]);
  }
  if (filters.walk_ins) {
    query = query.eq('walk_ins_welcome', true);
  }
  if (filters.claimed) {
    query = query.eq('is_claimed', true);
  }
  if (filters.min_rating) {
    query = query.gte('google_rating', filters.min_rating);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function countBusinessesByRegion(regionId: string): Promise<number> {
  const supabase = supabaseServerInternal();
  const { count, error } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('region_id', regionId);
  if (error) throw error;
  return count ?? 0;
}

// Batch counter: one round-trip returning a Map of regionId -> count. Replaces
// the N+1 pattern that had state-hub pages firing 30-40 concurrent COUNT
// queries — Site Audit flagged /nsw at 4.6s, /qld at 3s before this fix.
export async function countBusinessesByRegionBatch(regionIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (regionIds.length === 0) return map;
  const supabase = supabaseServerInternal();
  const { data, error } = await supabase
    .from('businesses')
    .select('region_id')
    .eq('status', 'active')
    .in('region_id', regionIds);
  if (error) throw error;
  for (const row of (data ?? []) as Array<{ region_id: string | null }>) {
    if (row.region_id) map.set(row.region_id, (map.get(row.region_id) ?? 0) + 1);
  }
  for (const id of regionIds) if (!map.has(id)) map.set(id, 0);
  return map;
}

// React.cache dedupes calls within a single request — generateMetadata + the page
// component both call this for the same slug, so we go from 2 DB queries per
// /salon/[slug] render to 1. Drops salon-page render time noticeably and clears
// the audit's "Slow page" / "Timed out" warnings on long-tail profiles.
export const getBusinessBySlug = cache(async (slug: string): Promise<Business | null> => {
  // Internal: /salon/[slug] renders confidence_score (noindex), scraped_services
  // (services list), preferred_scissor_supplier_url (supplier badge). Bypass RLS;
  // .eq('status','active') is the defensive row filter.
  const supabase = supabaseServerInternal();
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return (data as Business | null) ?? null;
});

export async function listRegions(state?: AuState): Promise<Region[]> {
  const supabase = supabaseServerInternal();
  let query = supabase.from('regions').select('*').order('name');
  if (state) query = query.eq('state', state);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Region[];
}

export async function getRegionBySlug(slug: string): Promise<Region | null> {
  const supabase = supabaseServerInternal();
  const { data } = await supabase.from('regions').select('*').eq('slug', slug).maybeSingle();
  return (data as Region | null) ?? null;
}

export async function listSuburbsInRegion(regionId: string): Promise<Suburb[]> {
  const supabase = supabaseServerInternal();
  const { data } = await supabase
    .from('suburbs')
    .select('*')
    .eq('region_id', regionId)
    .order('name');
  return (data ?? []) as Suburb[];
}

export type NearbySalon = Business & { distance_km: number };

/**
 * Great-circle distance between two lat/lng points, in kilometres.
 * Wikipedia: https://en.wikipedia.org/wiki/Haversine_formula
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Return up to `limit` active salons within `radiusKm` of `origin`, ordered by:
 *   1. same-suburb first (still ranked by distance within the group)
 *   2. distance ascending
 *   3. google_rating descending
 *
 * Salons without lat/lng are excluded. If the origin itself has no lat/lng we
 * return an empty array — callers should render an empty state in that case
 * (the spec is explicit: NEVER fall back to top-rated state-wide salons).
 */
export async function getNearbySalonsByDistance(
  origin: { slug: string; suburb: string; state: AuState; lat: number | null; lng: number | null },
  radiusKm = 25,
  limit = 6,
): Promise<NearbySalon[]> {
  if (origin.lat == null || origin.lng == null) return [];
  // Internal: returns full Business rows for the nearby panel which downstream
  // BusinessCard rendering touches non-public columns. Bypass RLS; status='active'
  // is the row filter.
  const supabase = supabaseServerInternal();

  // Bounding box pre-filter so we don't pull the whole state.
  // 1° latitude ≈ 110.574 km; 1° longitude ≈ 111.320 * cos(lat) km.
  // Pad the box by ~10% to keep haversine-corner cases in scope.
  const latDelta = (radiusKm * 1.1) / 110.574;
  const cosLat = Math.max(Math.abs(Math.cos((origin.lat * Math.PI) / 180)), 0.01);
  const lngDelta = (radiusKm * 1.1) / (111.320 * cosLat);

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .neq('slug', origin.slug)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gte('lat', origin.lat - latDelta)
    .lte('lat', origin.lat + latDelta)
    .gte('lng', origin.lng - lngDelta)
    .lte('lng', origin.lng + lngDelta)
    .limit(200);
  if (error) throw error;

  const sameSuburb = origin.suburb.toLowerCase();
  const withDistance: NearbySalon[] = [];
  for (const b of (data ?? []) as Business[]) {
    if (b.lat == null || b.lng == null) continue;
    const distance_km = haversineKm(origin.lat, origin.lng, b.lat, b.lng);
    if (distance_km > radiusKm) continue;
    withDistance.push({ ...b, distance_km });
  }

  withDistance.sort((a, b) => {
    const aSame = a.suburb.toLowerCase() === sameSuburb ? 0 : 1;
    const bSame = b.suburb.toLowerCase() === sameSuburb ? 0 : 1;
    if (aSame !== bSame) return aSame - bSame;
    if (a.distance_km !== b.distance_km) return a.distance_km - b.distance_km;
    return (b.google_rating ?? 0) - (a.google_rating ?? 0);
  });

  return withDistance.slice(0, limit);
}

export async function getSuburbBusinesses(
  state: AuState,
  regionSlug: string,
  suburbSlug: string,
): Promise<Business[]> {
  // Internal: getSuburbBusinesses returns full rows + orders by confidence_score.
  const supabase = supabaseServerInternal();
  const region = await getRegionBySlug(regionSlug);
  if (!region) return [];
  const suburbName = suburbSlug.replace(/-/g, ' ');
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .eq('state', state)
    .eq('region_id', region.id)
    .ilike('suburb', suburbName)
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false });
  return (data ?? []) as Business[];
}

export async function getSuburbByRegionAndSlug(
  regionId: string,
  suburbSlug: string,
): Promise<Suburb | null> {
  const supabase = supabaseServerInternal();
  const { data } = await supabase
    .from('suburbs')
    .select('*')
    .eq('region_id', regionId)
    .eq('slug', suburbSlug)
    .maybeSingle();
  return (data as Suburb | null) ?? null;
}

export async function listStates(): Promise<AuState[]> {
  const supabase = supabaseServerInternal();
  const { data, error } = await supabase
    .from('businesses')
    .select('state')
    .eq('status', 'active');
  if (error) throw error;
  return Array.from(new Set(((data ?? []) as { state: AuState }[]).map((r) => r.state)));
}
