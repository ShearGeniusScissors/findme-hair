'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export interface MapPin {
  lat: number | null;
  lng: number | null;
  name: string;
  suburb: string;
  state: string;
}

interface Props {
  pins: MapPin[];
  height?: number | string;
  className?: string;
}

let optionsSet = false;

const GOLD_PIN_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#C9A96E" stroke="#1A1A1A" stroke-width="2"/>
  </svg>`
)}`;

/**
 * COST CONTROL: every Google Maps JS load is a billable SKU (~$7/1000).
 * We defer importLibrary() until either:
 *   (a) the map element is in the viewport (IntersectionObserver), or
 *   (b) the user explicitly clicks the placeholder.
 *
 * Net effect: bots that don't execute JS = $0. Mobile users who never scroll
 * to the sidebar map = $0. Real users who see the map = $0.007. Previously
 * every page render was a billable map load.
 */
export default function MapView({ pins, height = 420, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Lazy-trigger: load the map only once the placeholder is in view OR the
  // user clicks it. Default rootMargin allows ~200px of lead-in.
  useEffect(() => {
    if (shouldLoad) return;
    if (!ref.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Old browser fallback — load immediately rather than silently fail.
      queueMicrotask(() => setShouldLoad(true));
      return;
    }
    const target = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [shouldLoad]);

  // Actual Google Maps JS load — only fires after shouldLoad flips.
  useEffect(() => {
    if (!shouldLoad) return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !ref.current) return;

    const withCoords = pins.filter((b) => b.lat != null && b.lng != null);
    if (withCoords.length === 0) return;

    if (!optionsSet) {
      setOptions({ key, v: 'weekly' });
      optionsSet = true;
    }

    let cancelled = false;

    (async () => {
      const [maps, markerLib] = await Promise.all([
        importLibrary('maps'),
        importLibrary('marker'),
      ]);
      if (cancelled || !ref.current) return;

      const map = new maps.Map(ref.current, {
        center: { lat: withCoords[0].lat!, lng: withCoords[0].lng! },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { featureType: 'water', stylers: [{ color: '#dae6f0' }] },
          { featureType: 'landscape', stylers: [{ color: '#f2efe9' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8580' }] },
        ],
      });

      const bounds = new google.maps.LatLngBounds();
      withCoords.forEach((b) => {
        const marker = new markerLib.Marker({
          position: { lat: b.lat!, lng: b.lng! },
          map,
          title: b.name,
          icon: {
            url: GOLD_PIN_SVG,
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          },
        });
        const info = new google.maps.InfoWindow({
          content: `<div style="font-family:DM Sans,sans-serif;padding:4px 0"><strong style="color:#1a1a1a">${b.name}</strong><br/><span style="color:#8a8580;font-size:12px">${b.suburb}, ${b.state}</span></div>`,
        });
        marker.addListener('click', () => info.open({ map, anchor: marker }));
        bounds.extend({ lat: b.lat!, lng: b.lng! });
      });
      if (withCoords.length > 1) map.fitBounds(bounds);
    })();

    return () => {
      cancelled = true;
    };
  }, [pins, shouldLoad]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={`map-container flex items-center justify-center bg-[var(--color-surface-warm)] text-sm text-[var(--color-ink-muted)] ${className ?? ''}`}
        style={{ height }}
      >
        Map unavailable
      </div>
    );
  }

  // Pre-load placeholder: a static map-coloured panel so the layout is
  // stable while we wait for the user to scroll the element into view.
  // Click also triggers load (a11y + non-IO fallback).
  return (
    <div
      ref={ref}
      onClick={() => setShouldLoad(true)}
      className={`map-container relative ${className ?? ''}`}
      style={{
        height,
        background: shouldLoad
          ? undefined
          : 'linear-gradient(135deg, #f2efe9 0%, #dae6f0 100%)',
        cursor: shouldLoad ? undefined : 'pointer',
      }}
      role={shouldLoad ? undefined : 'button'}
      aria-label={shouldLoad ? undefined : 'Load map'}
    >
      {!shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-10 h-10 text-[var(--color-gold)] opacity-60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
          </svg>
        </div>
      )}
    </div>
  );
}
