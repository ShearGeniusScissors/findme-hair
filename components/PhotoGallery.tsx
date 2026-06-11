'use client';

import { useEffect, useState } from 'react';

// Profile photo mosaic + "See all N" lightbox (playbook Tactic 10).
// Receives pre-resolved self-hosted URLs from the server component — no
// Google references ever reach the client (May 2026 cost incident).
// Client component, but still SSR'd: the mosaic <img> tags are in the HTML.
export default function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (photos.length === 0) return null;

  const mosaic = photos.slice(0, 3);

  return (
    <div className="bg-[var(--color-white)]">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="relative">
          {photos.length === 1 ? (
            <div className="overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0]} alt={name} className="w-full h-72 sm:h-96 object-cover" />
            </div>
          ) : (
            <div
              className="grid gap-2 rounded-xl overflow-hidden"
              style={{
                gridTemplateColumns: mosaic.length >= 3 ? '2fr 1fr' : '1fr 1fr',
                gridTemplateRows: mosaic.length >= 3 ? '1fr 1fr' : '1fr',
                height: '24rem',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mosaic[0]}
                alt={`${name} photo 1`}
                className="w-full h-full object-cover"
                style={mosaic.length >= 3 ? { gridRow: '1 / -1' } : undefined}
              />
              {mosaic.slice(1).map((url, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url + idx}
                  src={url}
                  alt={`${name} photo ${idx + 2}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {photos.length > 3 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/85 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              See all {photos.length} photos
            </button>
          )}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 p-4 sm:p-8"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-label={`${name} photos`}
        >
          <div className="mx-auto max-w-3xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white">
              <span className="text-sm font-medium">{name} — {photos.length} photos</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close photos"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {photos.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url + idx}
                src={url}
                alt={`${name} photo ${idx + 1}`}
                className="w-full rounded-lg"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
