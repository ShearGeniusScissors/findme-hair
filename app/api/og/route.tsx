import { ImageResponse } from 'next/og';
import { supabaseServerInternal } from '@/lib/supabase';

// Audit row 25f65d1a — dynamic per-salon OG card. Used by /salon/[slug]
// generateMetadata + JSON-LD ImageObject when the salon has no google_photos.
// /og-image.jpg (sibling route) is the static brand-tile fallback when
// this generator itself errors or no slug is supplied.

export const runtime = 'edge';
export const revalidate = 86400;

const GOLD = '#C9A96E';
const INK = '#1A1A1A';
const BONE = '#F3EFE9';

const STATE_NAME: Record<string, string> = {
  VIC: 'Victoria', NSW: 'New South Wales', QLD: 'Queensland',
  WA: 'Western Australia', SA: 'South Australia', TAS: 'Tasmania',
  NT: 'Northern Territory', ACT: 'ACT',
};

const TYPE_LABEL: Record<string, string> = {
  hair_salon: 'Hair Salon',
  barber: 'Barber Shop',
  unisex: 'Unisex Salon',
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    // No slug → just regenerate the brand tile so callers get a usable image.
    return brandTile();
  }

  const supabase = supabaseServerInternal();
  const { data } = await supabase
    .from('businesses')
    .select('name, suburb, state, business_type, google_rating, google_review_count')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) return brandTile();

  const typeLabel = TYPE_LABEL[data.business_type as string] ?? 'Salon';
  const stateLabel = STATE_NAME[data.state as string] ?? data.state;
  // The star is drawn as SVG: the default OG font has no ★ glyph, and the
  // runtime fetch for one failed on every render (Vercel runtime errors).
  const rating = data.google_rating ? Number(data.google_rating).toFixed(1) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 72,
          background: `linear-gradient(135deg, ${BONE} 0%, #ffffff 100%)`,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="6" cy="6" r="3" stroke={GOLD} strokeWidth="2" />
            <circle cx="6" cy="18" r="3" stroke={GOLD} strokeWidth="2" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" stroke={GOLD} strokeWidth="2" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" stroke={GOLD} strokeWidth="2" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" stroke={GOLD} strokeWidth="2" />
          </svg>
          <span style={{ fontSize: 28, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>
            findme.hair
          </span>
        </div>

        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.0,
            marginTop: 64,
            letterSpacing: '-0.03em',
            display: 'flex',
            maxWidth: 1050,
          }}
        >
          {String(data.name).slice(0, 60)}
        </div>

        <div style={{ fontSize: 36, color: GOLD, marginTop: 24, display: 'flex' }}>
          {typeLabel} in {data.suburb}, {stateLabel}
        </div>

        <div style={{ marginTop: 'auto', fontSize: 28, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
          {rating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{rating}</span>
              <svg width="26" height="26" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={GOLD} />
              </svg>
              <span>{`· ${data.google_review_count ?? 0} reviews`}</span>
            </div>
          ) : (
            <span>New on findme.hair</span>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000, immutable',
      },
    },
  );
}

function brandTile() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${BONE} 0%, #ffffff 100%)`,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, color: INK, letterSpacing: '-0.04em' }}>
          findme.hair
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000, immutable',
      },
    },
  );
}
