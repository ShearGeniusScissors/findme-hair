interface Props {
  rating: number;
  reviewCount?: number | null;
  size?: 'sm' | 'md';
  showCount?: boolean;
  /** Booking.com-style word anchor (Excellent/Great/Good) + "on Google"
      attribution. Counts + source attribution are what make stars trusted
      (Baymard; Places ToS requires the attribution anyway). */
  showTier?: boolean;
}

/** Word tier only at/above 4.0 — below that the number speaks plainly. */
export function ratingTier(rating: number): string | null {
  if (rating >= 4.8) return 'Excellent';
  if (rating >= 4.5) return 'Great';
  if (rating >= 4.0) return 'Good';
  return null;
}

export default function StarRating({
  rating,
  reviewCount,
  size = 'sm',
  showCount = true,
  showTier = false,
}: Props) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  const starSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <svg key={`f${i}`} className={`${starSize} text-[var(--color-gold)]`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {hasHalf && (
          <svg className={`${starSize} text-[var(--color-gold)]`} fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="halfGrad">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#E8E4DF" />
              </linearGradient>
            </defs>
            <path fill="url(#halfGrad)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <svg key={`e${i}`} className={`${starSize} text-[var(--color-border)]`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className={`font-semibold text-[var(--color-ink)] ${size === 'md' ? 'text-sm' : 'text-xs'}`}>
        {rating.toFixed(1)}
      </span>
      {showTier && ratingTier(rating) && (
        <span className={`font-medium text-[var(--color-gold-dark)] ${size === 'md' ? 'text-sm' : 'text-xs'}`}>
          {ratingTier(rating)}
        </span>
      )}
      {showCount && reviewCount != null && (
        <span className={`text-[var(--color-ink-muted)] ${size === 'md' ? 'text-sm' : 'text-xs'}`}>
          {showTier
            ? `· ${reviewCount.toLocaleString('en-AU')} reviews on Google`
            : `(${reviewCount})`}
        </span>
      )}
    </div>
  );
}
