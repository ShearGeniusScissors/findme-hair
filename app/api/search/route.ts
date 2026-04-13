import { NextRequest, NextResponse } from 'next/server';
import { searchBusinesses } from '@/lib/search';
import type { AuState, BusinessType } from '@/types/database';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const businesses = await searchBusinesses({
    q: params.get('q') ?? undefined,
    state: (params.get('state') as AuState) ?? undefined,
    region: params.get('region') ?? undefined,
    suburb: params.get('suburb') ?? undefined,
    type: (params.get('type') as BusinessType) ?? undefined,
    service: params.get('service') ?? undefined,
    limit: Math.min(Number(params.get('limit')) || 20, 40),
    offset: Number(params.get('offset')) || 0,
  });
  return NextResponse.json({ businesses });
}
