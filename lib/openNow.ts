// Pure open-now computation — client-safe (no Supabase / server-only imports).
// Extracted from lib/search.ts so the suburb-page filter sheet (client
// component, playbook Tactic 9) can share the exact same logic the server
// uses for ?open=true searches. lib/search.ts re-exports it unchanged.

export interface GooglePeriod {
  open?: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

/** Minutes-since-Sunday-00:00 in Australia/Sydney (covers AEDT/AEST). */
function nowMinutesInAuLocal(): { day: number; mins: number } {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const hh = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const mm = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: dayMap[wd] ?? 0, mins: hh * 60 + mm };
}

/** True if the salon has any opening period starting on the given day (0=Sun..6=Sat). */
export function isOpenOnDay(googleHours: unknown, day: number): boolean {
  const h = googleHours as { periods?: GooglePeriod[] } | null;
  if (!h?.periods?.length) return false;
  return h.periods.some((p) => p.open?.day === day);
}

export function isOpenNow(googleHours: unknown): boolean {
  const h = googleHours as { periods?: GooglePeriod[] } | null;
  if (!h?.periods?.length) return false;
  const now = nowMinutesInAuLocal();
  const nowAbs = now.day * 1440 + now.mins;
  for (const p of h.periods) {
    if (!p.open) continue;
    const openAbs = p.open.day * 1440 + p.open.hour * 60 + p.open.minute;
    // Missing close = open 24h on that day; treat as open for that day only.
    if (!p.close) {
      if (openAbs <= nowAbs && nowAbs < openAbs + 1440) return true;
      continue;
    }
    let closeAbs = p.close.day * 1440 + p.close.hour * 60 + p.close.minute;
    if (closeAbs <= openAbs) closeAbs += 7 * 1440; // wraps past Saturday night
    // Check this week and previous week (covers a Saturday-night → Sunday-morning span)
    if ((openAbs <= nowAbs && nowAbs < closeAbs) ||
        (openAbs - 7 * 1440 <= nowAbs && nowAbs < closeAbs - 7 * 1440)) {
      return true;
    }
  }
  return false;
}
