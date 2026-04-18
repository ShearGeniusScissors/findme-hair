/**
 * ShearGeniusBadge — appears at the bottom of every active salon listing page.
 * Provides a dofollow backlink to sheargenius.com.au for SEO.
 *
 * UTM: ?utm_source=findme.hair&utm_medium=listing&utm_campaign=supplier-badge
 */

const SHEARGENIUS_URL =
  'https://www.sheargenius.com.au?utm_source=findme.hair&utm_medium=listing&utm_campaign=supplier-badge';

export default function ShearGeniusBadge() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="border-t border-[var(--color-border-light)] pt-6">
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
      </div>
    </div>
  );
}
