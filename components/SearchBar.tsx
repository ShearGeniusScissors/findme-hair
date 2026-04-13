'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  defaultValue?: string;
  size?: 'lg' | 'md';
  autoFocus?: boolean;
  preserveParams?: Record<string, string | undefined>;
}

export default function SearchBar({ defaultValue = '', size = 'md', autoFocus = false, preserveParams }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    // Preserve active filters when resubmitting search
    if (preserveParams) {
      for (const [key, value] of Object.entries(preserveParams)) {
        if (value) params.set(key, value);
      }
    }
    router.push(`/search?${params.toString()}`);
  }

  const isLarge = size === 'lg';

  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full items-center bg-[var(--color-white)] border border-[var(--color-border)] transition-colors focus-within:border-[var(--color-gold)] ${
        isLarge ? 'rounded-xl p-2 shadow-sm' : 'rounded-lg p-1.5'
      }`}
    >
      {/* Search icon */}
      <div className={`flex-shrink-0 text-[var(--color-ink-muted)] ${isLarge ? 'pl-4' : 'pl-3'}`}>
        <svg className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by suburb, salon name, or postcode..."
        autoFocus={autoFocus}
        className={`flex-1 bg-transparent text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none ${
          isLarge ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'
        }`}
        aria-label="Search salons and barbers"
      />

      <button
        type="submit"
        className={`btn-gold flex-shrink-0 ${
          isLarge ? '!py-3 !px-7 text-sm' : '!py-2 !px-5 text-xs'
        }`}
      >
        Search
      </button>
    </form>
  );
}
