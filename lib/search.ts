import { supabaseServerAnon } from '@/lib/supabase';
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
  min_rating?: number;
  limit?: number;
  offset?: number;
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
};

/** Detect if a search query matches a known region slug */
export async function detectRegionFromQuery(q: string): Promise<Region | null> {
  const slug = q.toLowerCase().trim().replace(/\s+/g, '-');
  return getRegionBySlug(slug);
}

export async function searchBusinesses(filters: SearchFilters): Promise<Business[]> {
  const supabase = supabaseServerAnon();
  let query = supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(filters.limit ?? 40);

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

  // If a region filter is explicitly set, use it; otherwise try to detect from q
  if (filters.region) {
    const region = await getRegionBySlug(filters.region);
    if (region) query = query.eq('region_id', region.id);
  } else if (filters.q) {
    const q = filters.q;
    const regionMatch = await detectRegionFromQuery(q);
    if (regionMatch) {
      query = query.or(`region_id.eq.${regionMatch.id},name.ilike.%${q}%,suburb.ilike.%${q}%,postcode.eq.${q}`);
    } else {
      query = query.or(`name.ilike.%${q}%,suburb.ilike.%${q}%,address_line1.ilike.%${q}%,postcode.eq.${q}`);
    }
  }
  if (filters.suburb) {
    query = query.or(`suburb.ilike.${filters.suburb},suburb.ilike.${filters.suburb.replace(/-/g, ' ')}`);
  }
  if (filters.specialty) {
    query = query.contains('specialties', [filters.specialty]);
  }
  if (filters.walk_ins) {
    query = query.eq('walk_ins_welcome', true);
  }
  if (filters.min_rating) {
    query = query.gte('google_rating', filters.min_rating);
  }
  if (filters.offset) query = query.range(filters.offset, (filters.offset ?? 0) + (filters.limit ?? 40) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function searchBusinessesCount(filters: Omit<SearchFilters, 'limit' | 'offset'>): Promise<number> {
  const supabase = supabaseServerAnon();
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

  if (filters.region) {
    const region = await getRegionBySlug(filters.region);
    if (region) query = query.eq('region_id', region.id);
  } else if (filters.q) {
    const q = filters.q;
    const regionMatch = await detectRegionFromQuery(q);
    if (regionMatch) {
      query = query.or(`region_id.eq.${regionMatch.id},name.ilike.%${q}%,suburb.ilike.%${q}%,postcode.eq.${q}`);
    } else {
      query = query.or(`name.ilike.%${q}%,suburb.ilike.%${q}%,address_line1.ilike.%${q}%,postcode.eq.${q}`);
    }
  }
  if (filters.suburb) {
    query = query.or(`suburb.ilike.${filters.suburb},suburb.ilike.${filters.suburb.replace(/-/g, ' ')}`);
  }
  if (filters.specialty) {
    query = query.contains('specialties', [filters.specialty]);
  }
  if (filters.walk_ins) {
    query = query.eq('walk_ins_welcome', true);
  }
  if (filters.min_rating) {
    query = query.gte('google_rating', filters.min_rating);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function countBusinessesByRegion(regionId: string): Promise<number> {
  const supabase = supabaseServerAnon();
  const { count, error } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('region_id', regionId);
  if (error) throw error;
  return count ?? 0;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = supabaseServerAnon();
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return (data as Business | null) ?? null;
}

export async function listRegions(state?: AuState): Promise<Region[]> {
  const supabase = supabaseServerAnon();
  let query = supabase.from('regions').select('*').order('name');
  if (state) query = query.eq('state', state);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Region[];
}

export async function getRegionBySlug(slug: string): Promise<Region | null> {
  const supabase = supabaseServerAnon();
  const { data } = await supabase.from('regions').select('*').eq('slug', slug).maybeSingle();
  return (data as Region | null) ?? null;
}

export async function listSuburbsInRegion(regionId: string): Promise<Suburb[]> {
  const supabase = supabaseServerAnon();
  const { data } = await supabase
    .from('suburbs')
    .select('*')
    .eq('region_id', regionId)
    .order('name');
  return (data ?? []) as Suburb[];
}

export async function getSuburbBusinesses(
  state: AuState,
  regionSlug: string,
  suburbSlug: string,
): Promise<Business[]> {
  const supabase = supabaseServerAnon();
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
  const supabase = supabaseServerAnon();
  const { data } = await supabase
    .from('suburbs')
    .select('*')
    .eq('region_id', regionId)
    .eq('slug', suburbSlug)
    .maybeSingle();
  return (data as Suburb | null) ?? null;
}

export async function listStates(): Promise<AuState[]> {
  const supabase = supabaseServerAnon();
  const { data, error } = await supabase
    .from('businesses')
    .select('state')
    .eq('status', 'active');
  if (error) throw error;
  return Array.from(new Set(((data ?? []) as { state: AuState }[]).map((r) => r.state)));
}
