/**
 * ShearGeniusBadge — appears at the bottom of salon listing pages in SG service
 * territories. Visit dates are passed only where the van actually goes — Victoria and Tasmania
 * in full, and in SA only the Mount Gambier corner. Provides a dofollow backlink to sheargenius.com.au.
 *
 * UTM: ?utm_source=findme.hair&utm_medium=listing&utm_campaign=supplier-badge
 */

interface ShearGeniusBadgeProps {
  /** ISO date of this salon's own last in-person visit (never the state's latest run), e.g. "2026-04-18" */
  lastVisit?: string | null;
  /** ISO date of the next scheduled field run in this state */
  nextVisit?: string | null;
  /** State code, so the next run reads as the state's run rather than a booked visit */
  state?: string;
}

const SHEARGENIUS_URL =
  'https://www.sheargenius.com.au?utm_source=findme.hair&utm_medium=listing&utm_campaign=supplier-badge';

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ShearGeniusBadge({ lastVisit, nextVisit, state }: ShearGeniusBadgeProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="border-t border-[var(--color-border-light)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={SHEARGENIUS_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-gold-dark)] transition-colors group"
          >
            {/* Scissors icon */}
            <svg
              className="w-4 h-4 text-[var(--color-gold)] flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
            <span>
              Professional scissors by{' '}
              <span className="font-medium text-[var(--color-ink-light)] group-hover:text-[var(--color-gold-dark)]">
                ShearGenius
              </span>
            </span>
          </a>

          {(lastVisit || nextVisit) && (
            <div className="flex items-center gap-4 text-xs text-[var(--color-ink-muted)]">
              {lastVisit && (
                <span>Last visit: <span className="font-medium">{formatDate(lastVisit)}</span></span>
              )}
              {nextVisit && (
                <span>Next {state ? `${state} ` : ''}run: <span className="font-medium">{formatDate(nextVisit)}</span></span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
