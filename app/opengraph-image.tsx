import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "findme.hair — Australia's Hair Salon & Barber Directory";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
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
          backgroundColor: '#1A1A1A',
          fontFamily: 'serif',
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: '#C9A96E',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span style={{ fontSize: 72, color: '#FFFFFF', fontWeight: 400 }}>
            findme
          </span>
          <span style={{ fontSize: 72, color: '#C9A96E', fontWeight: 400 }}>
            .
          </span>
          <span style={{ fontSize: 72, color: '#FFFFFF', fontWeight: 400 }}>
            hair
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            color: '#C9A96E',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          Australia&apos;s Hair &amp; Barber Directory
        </div>

        {/* Stats */}
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            gap: 64,
            fontSize: 18,
            color: '#999999',
          }}
        >
          <span>13,000+ Verified Listings</span>
          <span>8 States &amp; Territories</span>
          <span>Hair Only</span>
        </div>

        {/* Bottom gold line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: '#C9A96E',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
