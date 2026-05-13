import { ImageResponse } from 'next/og';

// Audit row 25f65d1a — /og-image.jpg used to 404, breaking every social share
// of a salon with no Google photo. This route generates a 1200x630 PNG with
// the findme.hair wordmark at the path '/og-image.jpg' so every existing
// reference (~25 pages, dozens of metadata blocks, the JSON-LD ImageObject
// fallback on /salon/[slug]) starts serving a real image with no caller changes.
// The file is named .jpg for compatibility; the Content-Type is image/png
// (this is fine — every OG-card scraper sniffs the bytes, not the extension).

export const runtime = 'edge';
export const revalidate = 86400; // image is static; cache for a day

const GOLD = '#C9A96E';
const INK = '#1A1A1A';
const BONE = '#F3EFE9';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${BONE} 0%, #ffffff 100%)`,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 36 }}>
          <svg width="84" height="84" viewBox="0 0 24 24" fill="none">
            <circle cx="6" cy="6" r="3" stroke={GOLD} strokeWidth="2" />
            <circle cx="6" cy="18" r="3" stroke={GOLD} strokeWidth="2" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 96, fontWeight: 700, color: INK, lineHeight: 1, letterSpacing: '-0.04em' }}>
              findme.hair
            </div>
            <div style={{ fontSize: 32, color: GOLD, marginTop: 8, letterSpacing: '0.04em' }}>
              Australia&apos;s hairdresser directory
            </div>
          </div>
        </div>
        <div style={{ fontSize: 28, color: '#666', marginTop: 8 }}>
          13,000+ verified salons &amp; barbers · VIC · NSW · QLD · WA · SA · TAS · NT · ACT
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
