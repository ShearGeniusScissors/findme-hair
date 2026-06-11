'use client';

import { useEffect } from 'react';

// Global engagement click delegate (playbook Tactic 5). Mounted once in the
// root layout. Any anchor with data-track="call|website|book|directions|maps"
// is reported to /api/track via sendBeacon. The business id is resolved from
// the nearest [data-track-business] ancestor (the profile <main> carries it
// page-wide; listing-card call buttons carry their own). Server components
// stay server-rendered — they just emit data attributes.

export function trackEvent(businessId: string, action: string, source: string) {
  if (typeof navigator === 'undefined' || (navigator as { webdriver?: boolean }).webdriver) return;
  const payload = JSON.stringify({ business_id: businessId, action, source });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', body: payload, keepalive: true });
    }
  } catch {
    // Analytics must never break the page.
  }
}

export default function TapTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-track]') as HTMLElement | null;
      if (!el) return;
      const action = el.getAttribute('data-track');
      if (!action) return;
      const owner = el.closest('[data-track-business]') as HTMLElement | null;
      const businessId = owner?.getAttribute('data-track-business');
      if (!businessId) return;
      trackEvent(businessId, action, el.getAttribute('data-track-source') ?? 'profile');
    };
    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
