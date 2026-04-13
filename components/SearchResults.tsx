'use client';

import { useEffect, useState } from 'react';
import BusinessCard from './BusinessCard';
import MapView from './MapView';
import type { MapPin } from './MapView';
import type { Business } from '@/types/database';

interface Props {
  initialBusinesses: Business[];
  totalCount: number;
  searchParams: Record<string, string>;
}

export default function SearchResults({ initialBusinesses, totalCount, searchParams }: Props) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');

  // Fetch all map pins on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    fetch(`/api/search/pins?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setPins(data.pins ?? []))
      .catch(() => {});
  }, [searchParams]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      params.set('offset', String(businesses.length));
      params.set('limit', '20');
      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBusinesses((prev) => [...prev, ...data.businesses]);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasMore = businesses.length < totalCount;

  return (
    <>
      {/* Mobile tab switcher */}
      <div className="flex lg:hidden border-b border-[var(--color-border)] mb-6">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
            mobileTab === 'list'
              ? 'text-[var(--color-gold-dark)] border-b-2 border-[var(--color-gold)]'
              : 'text-[var(--color-ink-muted)]'
          }`}
        >
          List
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
            mobileTab === 'map'
              ? 'text-[var(--color-gold-dark)] border-b-2 border-[var(--color-gold)]'
              : 'text-[var(--color-ink-muted)]'
          }`}
        >
          Map
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,480px)]">
        {/* Listings — scrollable left panel */}
        <div className={mobileTab === 'map' ? 'hidden lg:block' : ''}>
          {businesses.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-warm)]">
                <svg className="w-6 h-6 text-[var(--color-ink-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
                No results found
              </h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                Try searching by suburb name, salon name, or postcode.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {businesses.map((b) => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-[var(--color-ink-muted)] mb-4">
                    Showing {businesses.length} of {totalCount.toLocaleString()} results
                  </p>
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="btn-outline text-sm !py-2.5 !px-8"
                  >
                    {loading ? 'Loading\u2026' : 'Load more salons'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Map sidebar — sticky on desktop, tab on mobile */}
        <aside className={`${mobileTab === 'list' ? 'hidden lg:block' : ''} lg:sticky lg:top-[81px] lg:self-start`}>
          <MapView
            pins={pins}
            height={mobileTab === 'map' ? 'calc(100vh - 200px)' : 'calc(100vh - 100px)'}
            className="!rounded-xl"
          />
        </aside>
      </div>
    </>
  );
}
