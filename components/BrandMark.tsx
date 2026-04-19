import Link from 'next/link';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  href?: string | null;
  className?: string;
}

const SIZES = {
  sm: { box: 'h-6 w-6', text: 'text-base', letter: 'text-[13px]' },
  md: { box: 'h-7 w-7', text: 'text-xl', letter: 'text-[15px]' },
  lg: { box: 'h-9 w-9', text: 'text-2xl', letter: 'text-[19px]' },
};

export default function BrandMark({ size = 'md', href = '/', className = '' }: Props) {
  const s = SIZES[size];

  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className={`${s.box} inline-flex items-center justify-center rounded-md bg-[var(--color-ink)] font-bold text-[var(--color-gold)] leading-none`}
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        <span className={s.letter}>F</span>
      </span>
      <span
        className={`${s.text} tracking-tight text-[var(--color-ink)]`}
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        findme<span className="text-[var(--color-gold)]">.</span>hair
      </span>
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="no-underline border-none outline-none focus:outline-none focus-visible:outline-none">
      {inner}
    </Link>
  );
}
