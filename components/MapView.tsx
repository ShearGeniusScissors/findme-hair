'use client';

import { useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { Business } from '@/types/database';

interface Props {
  businesses: Business[];
  height?: number;
}

let optionsSet = false;

export default function MapView({ businesses, height = 420 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !ref.current) return;

    const withCoords = businesses.filter((b) => b.lat != null && b.lng != null);
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
  }, [businesses]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className="map-container flex items-center justify-center bg-[var(--color-surface-warm)] text-sm text-[var(--color-ink-muted)]"
        style={{ height }}
      >
        Map unavailable
      </div>
    );
  }

  return <div ref={ref} className="map-container" style={{ height }} />;
}
