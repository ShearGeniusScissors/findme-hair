import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerAnon } from '@/lib/supabase';
import type { AuState, BusinessType } from '@/types/database';

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

/**
 * Lightweight endpoint returning only lat/lng/name/suburb/state for map pins.
 * Returns up to 500 pins matching the same filters as the main search.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const supabase = supabaseServerAnon();

  let query = supabase
    .from('businesses')
    .select('lat, lng, name, suburb, state')
    .eq('status', 'active')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .limit(500);

  const state = params.get('state') as AuState | undefined;
  const type = params.get('type') as BusinessType | undefined;
  const service = params.get('service') ?? undefined;
  const region = params.get('region') ?? undefined;
  const suburb = params.get('suburb') ?? undefined;
  const q = params.get('q') ?? undefined;

  if (state) query = query.eq('state', state);

  if (type) {
    query = query.eq('business_type', type);
  } else if (service && SERVICE_TO_TYPES[service]) {
    const types = SERVICE_TO_TYPES[service];
    if (types.length === 1) {
      query = query.eq('business_type', types[0]);
    } else {
      query = query.in('business_type', types);
    }
  }

  if (region) {
    // Look up region id
    const { data: regionData } = await supabase
      .from('regions')
      .select('id')
      .eq('slug', region)
      .maybeSingle();
    if (regionData) query = query.eq('region_id', regionData.id);
  } else if (q) {
    const slug = q.toLowerCase().trim().replace(/\s+/g, '-');
    const { data: regionData } = await supabase
      .from('regions')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (regionData) {
      query = query.or(`region_id.eq.${regionData.id},name.ilike.%${q}%,suburb.ilike.%${q}%,postcode.eq.${q}`);
    } else {
      query = query.or(`name.ilike.%${q}%,suburb.ilike.%${q}%,address_line1.ilike.%${q}%,postcode.eq.${q}`);
    }
  }

  if (suburb) {
    query = query.or(`suburb.ilike.${suburb},suburb.ilike.${suburb.replace(/-/g, ' ')}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ pins: [] });

  return NextResponse.json({ pins: data ?? [] });
}
