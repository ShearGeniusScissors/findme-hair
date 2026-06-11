'use client';

import { useEffect } from 'react';
import { trackEvent } from './TapTracker';

// Profile-view beacon (playbook Tactic 5). One 'view' event per profile
// page load. Click tracking is handled globally by TapTracker (layout) via
// [data-track] attributes — keeping a single click pathway avoids
// double-counting.
export default function EngagementTracker({ businessId }: { businessId: string }) {
  useEffect(() => {
    trackEvent(businessId, 'view', 'profile');
  }, [businessId]);

  return null;
}
