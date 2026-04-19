'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type TypeVal = 'all' | 'hair_salon' | 'barber' | 'unisex';
type DistanceVal = '' | '1' | '2' | '5' | '10' | '25';
type ServiceVal =
  | ''
  | 'mens-haircut'
  | 'ladies-cut'
  | 'balayage-specialist'
  | 'curly-hair-specialist'
  | 'bridal-hair'
  | 'kids-hairdresser'
  | 'mobile-hairdresser'
  | 'hair-extensions'
  | 'colour-specialist'
  | 'highlights'
  | 'keratin-treatment';

export interface MatrixSearchInitial {
  q?: string;
  type?: string;
  service?: string;
  distance?: string;
  walk_ins?: boolean;
  open_now?: boolean;
  claimed?: boolean;
  min_rating_4?: boolean;
}

interface Props {
  totalCount: number;
  variant?: 'hero' | 'compact';
  initial?: MatrixSearchInitial;
}

const TYPE_OPTIONS: { value: TypeVal; label: string }[] = [
  { value: 'all', label: 'All · Hair & Barber' },
  { value: 'hair_salon', label: 'Hair salon' },
  { value: 'barber', label: 'Barber' },
  { value: 'unisex', label: 'Unisex' },
];

const SERVICE_OPTIONS: { value: ServiceVal; label: string }[] = [
  { value: '', label: 'All services' },
  { value: 'mens-haircut', label: "Men's Cut" },
  { value: 'ladies-cut', label: 'Ladies Cut' },
  { value: 'balayage-specialist', label: 'Balayage' },
  { value: 'colour-specialist', label: 'Colour' },
  { value: 'highlights', label: 'Highlights' },
  { value: 'curly-hair-specialist', label: 'Curls' },
  { value: 'bridal-hair', label: 'Bridal' },
  { value: 'kids-hairdresser', label: 'Kids' },
  { value: 'mobile-hairdresser', label: 'Mobile' },
  { value: 'hair-extensions', label: 'Extensions' },
  { value: 'keratin-treatment', label: 'Keratin' },
];

const DISTANCE_OPTIONS: { value: DistanceVal; label: string }[] = [
  { value: '', label: 'Any distance' },
  { value: '1', label: 'Within 1 km' },
  { value: '2', label: 'Within 2 km' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
];

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-[var(--color-ink)] bg-[var(--color-gold-light)] text-[var(--color-ink)]'
          : 'border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-ink-light)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]'
      }`}
    >
      {label}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--color-ink-muted)]">
      {children}
    </span>
  );
}

function normaliseType(v?: string): TypeVal {
  if (v === 'hair_salon' || v === 'barber' || v === 'unisex') return v;
  return 'all';
}
function normaliseService(v?: string): ServiceVal {
  const allowed = SERVICE_OPTIONS.map((o) => o.value);
  return (allowed.includes(v as ServiceVal) ? (v as ServiceVal) : '') as ServiceVal;
}
function normaliseDistance(v?: string): DistanceVal {
  const allowed = DISTANCE_OPTIONS.map((o) => o.value);
  return (allowed.includes(v as DistanceVal) ? (v as DistanceVal) : '') as DistanceVal;
}

export default function MatrixSearch({ totalCount, variant = 'hero', initial }: Props) {
  const router = useRouter();
  const compact = variant === 'compact';

  const [type, setType] = useState<TypeVal>(normaliseType(initial?.type));
  const [query, setQuery] = useState(initial?.q ?? '');
  const [service, setService] = useState<ServiceVal>(normaliseService(initial?.service));
  const [distance, setDistance] = useState<DistanceVal>(normaliseDistance(initial?.distance));

  const [openNow, setOpenNow] = useState(!!initial?.open_now);
  const [walkIns, setWalkIns] = useState(!!initial?.walk_ins);
  const [minRating4, setMinRating4] = useState(!!initial?.min_rating_4);
  const [claimedOnly, setClaimedOnly] = useState(!!initial?.claimed);

  const hasAnyActive = useMemo(
    () =>
      type !== 'all' ||
      query.trim() !== '' ||
      service !== '' ||
      distance !== '' ||
      openNow ||
      walkIns ||
      minRating4 ||
      claimedOnly,
    [type, query, service, distance, openNow, walkIns, minRating4, claimedOnly],
  );

  function clearAll() {
    setType('all');
    setQuery('');
    setService('');
    setDistance('');
    setOpenNow(false);
    setWalkIns(false);
    setMinRating4(false);
    setClaimedOnly(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (type !== 'all') params.set('type', type);
    if (service) params.set('service', service);
    if (distance) params.set('distance', distance);
    if (openNow) params.set('open_now', '1');
    if (walkIns) params.set('walk_ins', '1');
    if (minRating4) params.set('min_rating', '4');
    if (claimedOnly) params.set('claimed', '1');
    router.push(`/search?${params.toString()}`);
  }

  const fieldHeight = compact ? 'h-10' : 'h-12';
  const selectBase = `${fieldHeight} w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] pl-3.5 pr-9 text-sm text-[var(--color-ink)] transition-colors focus:border-[var(--color-gold)] focus:outline-none`;
  const inputBase = `${fieldHeight} w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] transition-colors focus:border-[var(--color-gold)] focus:outline-none`;
  const ctaClass = `inline-flex ${fieldHeight} items-center justify-center gap-2 rounded-lg bg-[var(--color-ink)] px-6 text-sm font-semibold text-[var(--color-white)] transition-colors hover:bg-black`;

  const chevronStyle: React.CSSProperties = {
    backgroundImage:
      "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%231A1A1A'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '16px 16px',
  };

  const containerClass = compact
    ? 'mx-auto w-full max-w-7xl rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-3 shadow-sm sm:p-4'
    : 'mx-auto w-full max-w-5xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-5 shadow-sm sm:p-7';

  return (
    <form onSubmit={onSubmit} className={containerClass}>
      {!compact && (
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2
            className="text-xl text-[var(--color-ink)] sm:text-2xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Find your hairdresser or barber
          </h2>
          {hasAnyActive && (
            <button
              type="button"
              onClick={clearAll}
              className="hidden text-xs font-medium text-[var(--color-gold-dark)] underline-offset-4 hover:underline sm:inline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Primary row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.3fr_1fr_1fr_auto] lg:items-end">
        <label className="flex flex-col gap-1.5">
          {!compact && <FieldLabel>Type</FieldLabel>}
          <select
            className={selectBase}
            style={chevronStyle}
            value={type}
            onChange={(e) => setType(e.target.value as TypeVal)}
            aria-label="Type"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          {!compact && <FieldLabel>Suburb or postcode</FieldLabel>}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={compact ? 'Suburb or postcode' : 'e.g. Newtown or 2042'}
            className={inputBase}
            aria-label="Suburb or postcode"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          {!compact && <FieldLabel>Service</FieldLabel>}
          <select
            className={selectBase}
            style={chevronStyle}
            value={service}
            onChange={(e) => setService(e.target.value as ServiceVal)}
            aria-label="Service"
          >
            {SERVICE_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          {!compact && <FieldLabel>Distance</FieldLabel>}
          <select
            className={selectBase}
            style={chevronStyle}
            value={distance}
            onChange={(e) => setDistance(e.target.value as DistanceVal)}
            aria-label="Distance"
          >
            {DISTANCE_OPTIONS.map((o) => (
              <option key={o.value || 'any'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className={ctaClass}>
          Show{' '}
          <span className="text-[var(--color-gold)]">
            {totalCount > 0 ? totalCount.toLocaleString('en-AU') : 'all'}
          </span>{' '}
          salons
          <span aria-hidden>→</span>
        </button>
      </div>

      {/* Refinement chips */}
      <div className={`${compact ? 'mt-3' : 'mt-5'} flex flex-wrap items-center gap-2`}>
        <Chip label="Open now" active={openNow} onClick={() => setOpenNow((v) => !v)} />
        <Chip label="Walk-ins welcome" active={walkIns} onClick={() => setWalkIns((v) => !v)} />
        <Chip label="Rating 4★+" active={minRating4} onClick={() => setMinRating4((v) => !v)} />
        <Chip label="Claimed only" active={claimedOnly} onClick={() => setClaimedOnly((v) => !v)} />
        {hasAnyActive && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-xs font-medium text-[var(--color-gold-dark)] underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
    </form>
  );
}
