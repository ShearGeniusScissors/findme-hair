'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full items-center gap-2 rounded-full border border-neutral-200 bg-white p-2 shadow-sm focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a suburb or salon name…"
        className="flex-1 bg-transparent px-4 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        aria-label="Search"
      />
      <button
        type="submit"
        className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
      >
        Search
      </button>
    </form>
  );
}
