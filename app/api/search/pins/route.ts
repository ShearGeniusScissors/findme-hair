import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerAnon } from '@/lib/supabase';
import { resolveQuery } from '@/lib/search';
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
 * Lightweight endpoint returning only the columns a map marker needs.
 * Cap at 100 pins (was 500) — map clusters anyway and the previous cap was a
 * full-dataset enumeration foothold. Audit row 9bee1293.
 */
const PIN_LIMIT = 100;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const supabase = supabaseServerAnon();

  let query = supabase
    .from('businesses')
    .select('id, slug, name, lat, lng, business_type, suburb, state')
    .eq('status', 'active')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .limit(PIN_LIMIT);

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
    const { data: regionData } = await supabase
      .from('regions')
      .select('id')
      .eq('slug', region)
      .maybeSingle();
    if (regionData) query = query.eq('region_id', regionData.id);
  } else if (q) {
    const resolved = await resolveQuery(q);
    switch (resolved.kind) {
      case 'suburb': query = query.ilike('suburb', `%${resolved.pattern}%`); break;
      case 'region': query = query.eq('region_id', resolved.id); break;
      case 'postcode': query = query.eq('postcode', resolved.code); break;
      case 'text': {
        // audit row da5d8f40: strip PostgREST or() meta-chars from user input
        const safe = resolved.value.replace(/[,()*"'\\]/g, '');
        if (safe.length > 0) query = query.or(`name.ilike.%${safe}%,suburb.ilike.%${safe}%`);
        break;
      }
    }
  }

  if (suburb) {
    query = query.ilike('suburb', suburb.replace(/-/g, ' '));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ pins: [] });

  return NextResponse.json({ pins: data ?? [] });
}
