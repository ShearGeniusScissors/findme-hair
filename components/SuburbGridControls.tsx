'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { isOpenNow } from '@/lib/openNow';
import type { BusinessType } from '@/types/database';
import type { MapPin } from '@/components/MapView';

// Map overlay is mobile-only and behind a tap — load the chunk on demand so
// the suburb page bundle never pays for Google Maps loader code up front.
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

/**
 * Suburb-page filter bottom sheet + mobile map toggle (playbook Tactic 9).
 *
 * SEO-critical constraints honoured here:
 *  - Filter state is PURE client state — no querystring, no router pushes, so
 *    zero new crawlable URLs are minted (faceted-nav rule + SEO freeze).
 *  - The BusinessCard grid arrives as server-rendered `children`; this wrapper
 *    only toggles per-card visibility by index. Every card stays in the HTML
 *    for crawlers regardless of filter state.
 *  - The desktop sticky map aside stays server-side; this overlay reuses the
 *    same cost-controlled MapView (lazy Maps-JS load) for mobile only.
 */

export interface CardFacets {
  /** business_type */
  t: BusinessType;
  /** google_rating */
  r: number | null;
  /** walk_ins_welcome */
  w: boolean;
  /** google_hours.periods — open-now computed client-side at tap time */
  p: unknown;
}

interface Filters {
  type: BusinessType | null;
  minRating: number | null;
  openNow: boolean;
  walkIns: boolean;
}

const NO_FILTERS: Filters = { type: null, minRating: null, openNow: false, walkIns: false };

const TYPE_LABEL: Record<BusinessType, string> = {
  hair_salon: 'Hair salons',
  barber: 'Barbers',
  unisex: 'Unisex',
};

function matches(f: CardFacets, filters: Filters): boolean {
  if (filters.type && f.t !== filters.type) return false;
  if (filters.minRating != null && (f.r == null || f.r < filters.minRating)) return false;
  if (filters.walkIns && !f.w) return false;
  if (filters.openNow && !isOpenNow({ periods: f.p })) return false;
  return true;
}

function countActive(f: Filters): number {
  return (f.type ? 1 : 0) + (f.minRating != null ? 1 : 0) + (f.openNow ? 1 : 0) + (f.walkIns ? 1 : 0);
}

export default function SuburbGridControls({
  facets,
  pins,
  children,
}: {
  facets: CardFacets[];
  pins: MapPin[];
  children: ReactNode[];
}) {
  const [applied, setApplied] = useState<Filters>(NO_FILTERS);
  const [pending, setPending] = useState<Filters>(NO_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  // Lock body scroll while either overlay is up; Escape closes.
  useEffect(() => {
    if (!sheetOpen && !mapOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSheetOpen(false); setMapOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [sheetOpen, mapOpen]);

  const visible = useMemo(() => facets.map((f) => matches(f, applied)), [facets, applied]);
  const visibleCount = visible.filter(Boolean).length;
  const pendingCount = useMemo(
    () => facets.filter((f) => matches(f, pending)).length,
    [facets, pending],
  );
  const activeCount = countActive(applied);

  // Filters only earn their pixels on bigger suburbs; tiny grids scan faster
  // than any sheet. The grid itself still renders below either way.
  const showControls = facets.length >= 4;

  const openSheet = () => { setPending(applied); setSheetOpen(true); };
  const apply = () => { setApplied(pending); setSheetOpen(false); };
  const clearAll = () => { setApplied(NO_FILTERS); setPending(NO_FILTERS); };

  // Removable applied-filter chips (label + how to remove just that one).
  const chips: { label: string; remove: () => void }[] = [];
  if (applied.type) chips.push({ label: TYPE_LABEL[applied.type], remove: () => setApplied({ ...applied, type: null }) });
  if (applied.minRating != null) chips.push({ label: `${applied.minRating.toFixed(1)}★ & up`, remove: () => setApplied({ ...applied, minRating: null }) });
  if (applied.openNow) chips.push({ label: 'Open now', remove: () => setApplied({ ...applied, openNow: false }) });
  if (applied.walkIns) chips.push({ label: 'Walk-ins welcome', remove: () => setApplied({ ...applied, walkIns: false }) });

  return (
    <>
      {/* Applied chips */}
      {chips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.remove}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-gold)] bg-[var(--color-gold-light)] px-3 py-1 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-white)] transition-colors"
            >
              {c.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-[var(--color-ink-muted)] underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* The server-rendered cards — visibility toggled by index, never removed
          from the DOM, so crawlers and the ItemList schema see every listing. */}
      <div className="grid gap-5 sm:grid-cols-2 content-start">
        {children.map((child, i) => (
          <div key={i} className={visible[i] === false ? 'hidden' : 'contents'}>
            {child}
          </div>
        ))}
      </div>

      {activeCount > 0 && visibleCount === 0 && (
        <div className="card mt-5 p-10 text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            No salons match those filters
          </p>
          <button type="button" onClick={clearAll} className="btn-outline mt-4 text-sm">
            Clear filters
          </button>
        </div>
      )}

      {/* Floating pills — filters (all sizes) + map (mobile only; desktop has
          the sticky aside). Hidden while an overlay is up. */}
      {showControls && !sheetOpen && !mapOpen && (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2">
          <button
            type="button"
            onClick={openSheet}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-medium text-white shadow-lg hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-medium text-white shadow-lg hover:opacity-90 transition-opacity lg:hidden"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Map
          </button>
        </div>
      )}

      {/* Filter bottom sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setSheetOpen(false)}
          role="dialog"
          aria-label="Filter salons"
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[var(--color-white)] p-6 pb-8 sm:mx-auto sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-surface)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Type */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Type</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([null, 'hair_salon', 'barber', 'unisex'] as (BusinessType | null)[]).map((t) => (
                <FilterChip
                  key={t ?? 'all'}
                  active={pending.type === t}
                  onClick={() => setPending({ ...pending, type: t })}
                >
                  {t ? TYPE_LABEL[t] : 'All'}
                </FilterChip>
              ))}
            </div>

            {/* Rating */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Google rating</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([null, 4.0, 4.5] as (number | null)[]).map((r) => (
                <FilterChip
                  key={r ?? 'any'}
                  active={pending.minRating === r}
                  onClick={() => setPending({ ...pending, minRating: r })}
                >
                  {r == null ? 'Any' : `${r.toFixed(1)}★ & up`}
                </FilterChip>
              ))}
            </div>

            {/* Toggles */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Availability</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <FilterChip
                active={pending.openNow}
                onClick={() => setPending({ ...pending, openNow: !pending.openNow })}
              >
                Open now
              </FilterChip>
              <FilterChip
                active={pending.walkIns}
                onClick={() => setPending({ ...pending, walkIns: !pending.walkIns })}
              >
                Walk-ins welcome
              </FilterChip>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPending(NO_FILTERS)}
                className="btn-outline flex-shrink-0 text-sm"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={pendingCount === 0}
                className="btn-gold flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingCount === 0
                  ? 'No matches'
                  : `Show ${pendingCount} ${pendingCount === 1 ? 'salon' : 'salons'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile full-screen map overlay */}
      {mapOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--color-white)]" role="dialog" aria-label="Map of salons">
          <MapView pins={pins} height="100%" className="h-full" />
          <button
            type="button"
            onClick={() => setMapOpen(false)}
            className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close map
          </button>
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? 'border-[var(--color-ink)] bg-[var(--color-ink)] font-medium text-white'
          : 'border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-ink-light)] hover:border-[var(--color-ink-muted)]'
      }`}
    >
      {children}
    </button>
  );
}
