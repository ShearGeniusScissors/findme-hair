import { supabaseServerAnon } from '@/lib/supabase';
import type { AuState, Business, BusinessType } from '@/types/database';

export interface SearchFilters {
  q?: string;
  state?: AuState;
  suburb?: string;
  type?: BusinessType;
  limit?: number;
  offset?: number;
}

export async function searchBusinesses(filters: SearchFilters): Promise<Business[]> {
  const supabase = supabaseServerAnon();
  let query = supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(filters.limit ?? 40);

  if (filters.state) query = query.eq('state', filters.state);
  if (filters.suburb) query = query.ilike('suburb', filters.suburb);
  if (filters.type) query = query.eq('business_type', filters.type);
  if (filters.q) query = query.ilike('name', `%${filters.q}%`);
  if (filters.offset) query = query.range(filters.offset, (filters.offset ?? 0) + (filters.limit ?? 40) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Business[];
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

export async function getSuburbBusinesses(state: AuState, suburb: string): Promise<Business[]> {
  const supabase = supabaseServerAnon();
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .eq('state', state)
    .ilike('suburb', suburb)
    .order('google_rating', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Business[];
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
