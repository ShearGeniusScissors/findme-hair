'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface Props {
  totalCount: number;
}

type TypeVal = 'all' | 'hair_salon' | 'barber' | 'unisex';
type DistanceVal = '' | '1' | '2' | '5' | '10' | '25';
type ServiceVal =
  | ''
  | 'barber'
  | 'colour'
  | 'curly-hair-specialist'
  | 'fades'
  | 'bridal-hair'
  | 'kids'
  | 'mobile-hairdresser'
  | 'hair-extensions';

const TYPE_OPTIONS: { value: TypeVal; label: string }[] = [
  { value: 'all', label: 'All · Hair & Barber' },
  { value: 'hair_salon', label: 'Hair salon' },
  { value: 'barber', label: 'Barber' },
  { value: 'unisex', label: 'Unisex' },
];

const SERVICE_OPTIONS: { value: ServiceVal; label: string }[] = [
  { value: '', label: 'All services' },
  { value: 'barber', label: 'Barber' },
  { value: 'colour', label: 'Colour' },
  { value: 'curly-hair-specialist', label: 'Curly specialist' },
  { value: 'fades', label: 'Fades' },
  { value: 'bridal-hair', label: 'Bridal' },
  { value: 'kids', label: 'Kids' },
  { value: 'mobile-hairdresser', label: 'Mobile' },
  { value: 'hair-extensions', label: 'Extensions' },
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

const selectBase =
  'h-12 w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] pl-3.5 pr-9 text-sm text-[var(--color-ink)] transition-colors focus:border-[var(--color-gold)] focus:outline-none';

const chevronBg =
  "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2020%2020'%20fill%3D'%231A1A1A'%3E%3Cpath%20fill-rule%3D'evenodd'%20d%3D'M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%201%201%201.08%201.04l-4.25%204.5a.75.75%200%200%201-1.08%200l-4.25-4.5a.75.75%200%200%201%20.02-1.06z'%20clip-rule%3D'evenodd'%20%2F%3E%3C%2Fsvg%3E\")] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat";

export default function MatrixSearch({ totalCount }: Props) {
  const router = useRouter();

  const [type, setType] = useState<TypeVal>('all');
  const [query, setQuery] = useState('');
  const [service, setService] = useState<ServiceVal>('');
  const [distance, setDistance] = useState<DistanceVal>('');

  const [openNow, setOpenNow] = useState(false);
  const [walkIns, setWalkIns] = useState(false);
  const [newClients, setNewClients] = useState(false);
  const [minRating4, setMinRating4] = useState(false);
  const [claimedOnly, setClaimedOnly] = useState(false);

  const hasAnyActive = useMemo(
    () =>
      type !== 'all' ||
      query.trim() !== '' ||
      service !== '' ||
      distance !== '' ||
      openNow ||
      walkIns ||
      newClients ||
      minRating4 ||
      claimedOnly,
    [type, query, service, distance, openNow, walkIns, newClients, minRating4, claimedOnly],
  );

  function clearAll() {
    setType('all');
    setQuery('');
    setService('');
    setDistance('');
    setOpenNow(false);
    setWalkIns(false);
    setNewClients(false);
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
    if (walkIns) params.set('walk_ins', '1');
    if (minRating4) params.set('min_rating', '4');
    if (openNow) params.set('open_now', '1');
    if (newClients) params.set('new_clients', '1');
    if (claimedOnly) params.set('claimed', '1');
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-5xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-white)] p-5 shadow-sm sm:p-7"
    >
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

      {/* Primary row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.3fr_1fr_1fr_auto] lg:items-end">
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Type</FieldLabel>
          <select
            className={`${selectBase} ${chevronBg}`}
            value={type}
            onChange={(e) => setType(e.target.value as TypeVal)}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <FieldLabel>Suburb or postcode</FieldLabel>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Newtown or 2042"
            className="h-12 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] transition-colors focus:border-[var(--color-gold)] focus:outline-none"
            aria-label="Suburb or postcode"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <FieldLabel>Service</FieldLabel>
          <select
            className={`${selectBase} ${chevronBg}`}
            value={service}
            onChange={(e) => setService(e.target.value as ServiceVal)}
          >
            {SERVICE_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <FieldLabel>Distance</FieldLabel>
          <select
            className={`${selectBase} ${chevronBg}`}
            value={distance}
            onChange={(e) => setDistance(e.target.value as DistanceVal)}
          >
            {DISTANCE_OPTIONS.map((o) => (
              <option key={o.value || 'any'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-ink)] px-6 text-sm font-semibold text-[var(--color-white)] transition-colors hover:bg-black lg:mt-0"
        >
          Show{' '}
          <span className="text-[var(--color-gold)]">
            {totalCount > 0 ? totalCount.toLocaleString('en-AU') : 'all'}
          </span>{' '}
          salons
          <span aria-hidden>→</span>
        </button>
      </div>

      {/* Refinement chips */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Chip label="Open now" active={openNow} onClick={() => setOpenNow((v) => !v)} />
        <Chip label="Walk-ins welcome" active={walkIns} onClick={() => setWalkIns((v) => !v)} />
        <Chip label="Accepting new clients" active={newClients} onClick={() => setNewClients((v) => !v)} />
        <Chip label="Rating 4★+" active={minRating4} onClick={() => setMinRating4((v) => !v)} />
        <Chip label="Claimed only" active={claimedOnly} onClick={() => setClaimedOnly((v) => !v)} />
        {hasAnyActive && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-xs font-medium text-[var(--color-gold-dark)] underline-offset-4 hover:underline sm:hidden"
          >
            Clear all
          </button>
        )}
      </div>
    </form>
  );
}
