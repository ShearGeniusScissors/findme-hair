import Link from 'next/link';

interface Tile {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function Scissors() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

function Droplet() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  );
}

function Wave() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M3 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0 3 3 4.5 0" />
      <path d="M3 17c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0 3 3 4.5 0" />
    </svg>
  );
}

function Lines() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <line x1="7" y1="4" x2="7" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="17" y1="4" x2="17" y2="20" />
    </svg>
  );
}

function Diamond() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 3l8 8-8 10-8-10z" />
    </svg>
  );
}

function Smile() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9.5" x2="9" y2="10" />
      <line x1="15" y1="9.5" x2="15" y2="10" />
    </svg>
  );
}

function Car() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M5 17h14l-1.5-6.5A2 2 0 0 0 15.57 9H8.43a2 2 0 0 0-1.93 1.5L5 17z" />
      <circle cx="8" cy="17" r="1.5" />
      <circle cx="16" cy="17" r="1.5" />
    </svg>
  );
}

function Ribbon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

const TILES: Tile[] = [
  { label: 'Barber', href: '/services/barber', icon: <Scissors /> },
  { label: 'Colour', href: '/services/balayage-specialist', icon: <Droplet /> },
  { label: 'Curls', href: '/services/curly-hair-specialist', icon: <Wave /> },
  { label: 'Fades', href: '/search?type=barber&q=fade', icon: <Lines /> },
  { label: 'Bridal', href: '/services/bridal-hair', icon: <Diamond /> },
  { label: 'Kids', href: '/search?q=kids', icon: <Smile /> },
  { label: 'Mobile', href: '/services/mobile-hairdresser', icon: <Car /> },
  { label: 'Extensions', href: '/services/hair-extensions', icon: <Ribbon /> },
];

export default function CategoryTiles() {
  return (
    <section className="bg-[var(--color-white)]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <div>
            <p className="text-editorial-overline">Browse by service</p>
            <h2
              className="mt-2 text-2xl text-[var(--color-ink)] sm:text-3xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Find a specialist
            </h2>
          </div>
          <Link
            href="/search"
            className="hidden text-xs font-semibold tracking-[0.12em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-gold-dark)] sm:inline"
          >
            See all services &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8 md:gap-4">
          {TILES.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="group flex flex-col items-center gap-3 rounded-xl border border-transparent px-2 py-5 text-center transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] transition-colors group-hover:border-[var(--color-gold)] group-hover:text-[var(--color-gold-dark)]"
                aria-hidden="true"
              >
                {t.icon}
              </span>
              <span className="text-sm font-medium text-[var(--color-ink)]">{t.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
