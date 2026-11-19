/**
 * ShearGeniusBadge — appears at the bottom of salon listing pages in SG service
 * territories. Visit dates are passed only where the van actually goes — Victoria and Tasmania
 * in full, and in SA only the Mount Gambier corner. Provides a dofollow backlink to sheargenius.com.au.
 *
 * Only the word "ShearGenius" is the link (Matt, 6 Nov); the wording "Professional scissors by
 * ShearGenius" stays. UTM: lib/outbound (utm_campaign=salon, utm_content=sg-badge), 19 Nov 2026.
 *
 * Partner salons (businesses.sg_partner, set by findme.hair admins; Matt 19 Nov 2026 "Build a
 * real badge") get "ShearGenius Partner salon" INSTEAD of the generic line — one badge per
 * listing. Only the word "ShearGenius" links, to sheargenius.com.au/pages/partners
 * (utm_content=sg-partner-badge). Visit dates show the same way for both.
 */
import { sgLink } from '@/lib/outbound';

interface ShearGeniusBadgeProps {
  /** ISO date of this salon's own last in-person visit (never the state's latest run), e.g. "2026-04-18" */
  lastVisit?: string | null;
  /** ISO date of the next scheduled field run in this state */
  nextVisit?: string | null;
  /** State code, so the next run reads as the state's run rather than a booked visit */
  state?: string;
  /** ShearGenius Partner salon (businesses.sg_partner) — shows the partner badge instead */
  partner?: boolean;
  /** businesses.sg_partner_since (YYYY-MM-DD), optional */
  partnerSince?: string | null;
}

const SHEARGENIUS_URL = sgLink('/', { page: 'salon', block: 'sg-badge' });
const PARTNERS_URL = sgLink('/pages/partners', { page: 'salon', block: 'sg-partner-badge' });

function ScissorsIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
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
  );
}

function sinceLabel(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ShearGeniusBadge({ lastVisit, nextVisit, state, partner, partnerSince }: ShearGeniusBadgeProps) {
  const since = partner ? sinceLabel(partnerSince) : null;
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="border-t border-[var(--color-border-light)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {partner ? (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="badge badge-gold">
                <ScissorsIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  <a
                    href={PARTNERS_URL}
                    target="_blank"
                    rel="noopener"
                    className="font-semibold underline-offset-2 hover:underline"
                  >
                    ShearGenius
                  </a>{' '}
                  Partner salon
                </span>
              </span>
              {since && <span className="text-[var(--color-ink-muted)]">Partner since {since}</span>}
            </span>
          ) : (
          <span className="inline-flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
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
              <a
                href={SHEARGENIUS_URL}
                target="_blank"
                rel="noopener"
                className="font-medium text-[var(--color-ink-light)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                ShearGenius
              </a>
            </span>
          </span>
          )}

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
