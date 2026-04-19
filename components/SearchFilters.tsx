'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

interface Region {
  slug: string;
  name: string;
  state: string;
}

interface Suburb {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  regions: Region[];
  suburbs: Suburb[];
  totalCount: number;
}

const SPECIALTIES = [
  { value: 'colour-specialist', label: 'Colour Specialist' },
  { value: 'balayage', label: 'Balayage' },
  { value: 'curly-hair', label: 'Curly Hair' },
  { value: 'extensions', label: 'Extensions' },
  { value: 'kids', label: 'Kids' },
  { value: 'bridal', label: 'Bridal' },
  { value: 'mens', label: 'Mens Cuts' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'keratin', label: 'Keratin' },
  { value: 'organic', label: 'Organic' },
  { value: 'barber', label: 'Barber' },
  { value: 'blow-dry', label: 'Blow Dry' },
  { value: 'afro', label: 'Textured Hair' },
];

const TYPES = [
  { value: '', label: 'All' },
  { value: 'hair_salon', label: 'Hair Salon' },
  { value: 'barber', label: 'Barber' },
  { value: 'unisex', label: 'Unisex' },
];

const STATES = [
  { value: 'VIC', label: 'Victoria' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'ACT', label: 'ACT' },
];

export default function SearchFilters({ regions, suburbs, totalCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  // Read current params
  const currentQ = searchParams.get('q') || '';
  const currentType = searchParams.get('type') || '';
  const currentState = searchParams.get('state') || '';
  const currentRegion = searchParams.get('region') || '';
  const currentSuburb = searchParams.get('suburb') || '';
  const currentSpecialty = searchParams.get('specialty') || '';
  const currentWalkIns = searchParams.get('walk_ins') || '';
  const currentMinRating = searchParams.get('min_rating') || '';

  // Local filter state (syncs with URL)
  const [q, setQ] = useState(currentQ);
  const [type, setType] = useState(currentType);
  const [state, setState] = useState(currentState);
  const [region, setRegion] = useState(currentRegion);
  const [suburb, setSuburb] = useState(currentSuburb);
  const [specialty, setSpecialty] = useState(currentSpecialty);
  const [walkIns, setWalkIns] = useState(currentWalkIns === 'true');
  const [minRating, setMinRating] = useState(currentMinRating);

  // Count active filters (excluding q which is always visible)
  const activeFilterCount = [type, specialty, walkIns ? 'true' : '', minRating, state, region, suburb]
    .filter(Boolean).length;

  // Build URL and navigate
  const applyFilters = useCallback((overrides?: Record<string, string>) => {
    const params = new URLSearchParams();
    const vals = { q, type, state, region, suburb, specialty, walk_ins: walkIns ? 'true' : '', min_rating: minRating, ...overrides };
    for (const [k, v] of Object.entries(vals)) {
      if (v) params.set(k, v);
    }
    router.push(`/search?${params.toString()}`);
  }, [q, type, state, region, suburb, specialty, walkIns, minRating, router]);

  // Search form submit
  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
  }

  // Clear all
  function clearAll() {
    setQ('');
    setType('');
    setState('');
    setRegion('');
    setSuburb('');
    setSpecialty('');
    setWalkIns(false);
    setMinRating('');
    router.push('/search');
    setOpen(false);
  }

  // Remove single filter chip
  function removeFilter(key: string) {
    const overrides: Record<string, string> = { [key]: '' };
    if (key === 'type') setType('');
    else if (key === 'walk_ins') { setWalkIns(false); overrides.walk_ins = ''; }
    else if (key === 'specialty') setSpecialty('');
    else if (key === 'min_rating') setMinRating('');
    else if (key === 'state') { setState(''); overrides.region = ''; overrides.suburb = ''; setRegion(''); setSuburb(''); }
    else if (key === 'region') { setRegion(''); overrides.suburb = ''; setSuburb(''); }
    else if (key === 'suburb') setSuburb('');
    applyFilters(overrides);
  }

  // Active filter chips for display
  const chips: { key: string; label: string }[] = [];
  if (type) chips.push({ key: 'type', label: TYPES.find(t => t.value === type)?.label || type });
  if (specialty) chips.push({ key: 'specialty', label: SPECIALTIES.find(s => s.value === specialty)?.label || specialty });
  if (walkIns) chips.push({ key: 'walk_ins', label: 'Walk-ins welcome' });
  if (minRating) chips.push({ key: 'min_rating', label: `${minRating}+ stars` });
  if (state) chips.push({ key: 'state', label: STATES.find(s => s.value === state)?.label || state });
  if (region) chips.push({ key: 'region', label: regions.find(r => r.slug === region)?.name || region });
  if (suburb) chips.push({ key: 'suburb', label: suburb });

  // Filter regions by state
  const filteredRegions = state ? regions.filter(r => r.state === state) : regions;

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-white)]">
      <div className="mx-auto max-w-7xl px-6 py-4">
        {/* ─── Main search row ────────────────────── */}
        <form onSubmit={onSearch} className="flex items-center gap-3">
          {/* Search input */}
          <div className="flex flex-1 items-center bg-[var(--color-white)] border border-[var(--color-border)] rounded-lg px-3 py-2 focus-within:border-[var(--color-gold)] transition-colors">
            <svg className="w-4 h-4 text-[var(--color-ink-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search suburb or salon..."
              className="flex-1 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none px-3 py-0.5"
            />
          </div>

          {/* Filters button */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeFilterCount > 0
                ? 'border-[var(--color-gold)] bg-[var(--color-gold-light)] text-[var(--color-gold-dark)]'
                : 'border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-muted)]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>

          {/* Search button */}
          <button type="submit" className="btn-gold !py-2 !px-5 text-xs flex-shrink-0">
            Search
          </button>
        </form>

        {/* ─── Active filter chips ────────────────── */}
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => removeFilter(chip.key)}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-gold-light)] px-3 py-1 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-gold)] hover:text-white transition-colors"
              >
                {chip.label}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
            <button
              onClick={clearAll}
              className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-medium"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ─── Filter panel (slides down) ─────────── */}
        {open && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            {/* Type pills row */}
            <div className="flex items-center gap-1.5 mb-5">
              <span className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider mr-2">Type</span>
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    type === t.value
                      ? 'bg-[var(--color-ink)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:bg-[var(--color-border)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Specialty */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider mb-2">
                  Specialty
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSpecialty(specialty === s.value ? '' : s.value)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        specialty === s.value
                          ? 'bg-[var(--color-gold)] text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:bg-[var(--color-gold-light)] hover:text-[var(--color-gold-dark)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider mb-2">
                  Availability
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={walkIns}
                      onChange={(e) => setWalkIns(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-gold)] focus:ring-[var(--color-gold)]"
                    />
                    <span className="text-sm text-[var(--color-ink)]">Walk-ins welcome</span>
                  </label>
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider mb-2">
                  Rating
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === ''}
                      onChange={() => setMinRating('')}
                      className="w-4 h-4 border-[var(--color-border)] text-[var(--color-gold)] focus:ring-[var(--color-gold)]"
                    />
                    <span className="text-sm text-[var(--color-ink)]">Any rating</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === '4'}
                      onChange={() => setMinRating('4')}
                      className="w-4 h-4 border-[var(--color-border)] text-[var(--color-gold)] focus:ring-[var(--color-gold)]"
                    />
                    <span className="text-sm text-[var(--color-ink)]">4+ stars</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === '4.5'}
                      onChange={() => setMinRating('4.5')}
                      className="w-4 h-4 border-[var(--color-border)] text-[var(--color-gold)] focus:ring-[var(--color-gold)]"
                    />
                    <span className="text-sm text-[var(--color-ink)]">4.5+ stars</span>
                  </label>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider mb-2">
                  Location
                </label>
                <div className="space-y-2">
                  <select
                    value={state}
                    onChange={(e) => { setState(e.target.value); setRegion(''); setSuburb(''); }}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none"
                  >
                    <option value="">All states</option>
                    {STATES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    value={region}
                    onChange={(e) => { setRegion(e.target.value); setSuburb(''); }}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none"
                  >
                    <option value="">All regions</option>
                    {filteredRegions.map((r) => (
                      <option key={r.slug} value={r.slug}>{r.name}</option>
                    ))}
                  </select>
                  {suburbs.length > 0 && (
                    <select
                      value={suburb}
                      onChange={(e) => setSuburb(e.target.value)}
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none"
                    >
                      <option value="">All suburbs</option>
                      {suburbs.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Panel footer */}
            <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                Clear all filters
              </button>
              <button
                type="button"
                onClick={() => { applyFilters(); setOpen(false); }}
                className="btn-gold !py-2 !px-6 text-sm"
              >
                Show {totalCount.toLocaleString()} results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
