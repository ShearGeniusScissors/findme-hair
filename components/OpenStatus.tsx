import type { GoogleHours } from '@/types/database';

interface Props {
  hours: GoogleHours | null;
}

export default function OpenStatus({ hours }: Props) {
  if (!hours?.weekdayDescriptions?.length) return null;

  const now = new Date();
  const dayIndex = now.getDay(); // 0=Sun
  // Google weekdayDescriptions are Mon(0) to Sun(6)
  const googleDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const todayLine = hours.weekdayDescriptions[googleDayIndex];

  if (!todayLine) return null;

  const closedPatterns = ['closed', 'Closed', 'CLOSED'];
  const isClosed = closedPatterns.some((p) => todayLine.includes(p));

  // Simple heuristic: check if current time falls within any hours pattern
  // For now, show "Open today" vs "Closed today"
  if (isClosed) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-muted)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-muted)]" />
        Closed today
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-success)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
      Open today
    </span>
  );
}
