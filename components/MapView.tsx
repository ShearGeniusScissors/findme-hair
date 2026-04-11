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
      });

      const bounds = new google.maps.LatLngBounds();
      withCoords.forEach((b) => {
        const marker = new markerLib.Marker({
          position: { lat: b.lat!, lng: b.lng! },
          map,
          title: b.name,
        });
        const info = new google.maps.InfoWindow({
          content: `<strong>${b.name}</strong><br/>${b.suburb}, ${b.state}`,
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
        className="flex items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-500"
        style={{ height }}
      >
        Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
      </div>
    );
  }

  return <div ref={ref} className="rounded-xl" style={{ height }} />;
}
