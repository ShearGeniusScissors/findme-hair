'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import type { Business, Territory } from '@/types/database';

type Tab = 'pending' | 'active' | 'territories' | 'flags' | 'recency';

interface RecencyRow {
  id: string;
  name: string;
  suburb: string;
  state: string;
  last_verified: string | null;
  recency_label: string;
  recency_score: number;
}

const CONFIDENCE_COLOURS = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
} as const;

function confidenceBadge(score: number | null) {
  const s = score ?? 0;
  if (s >= 75) return { label: s, cls: CONFIDENCE_COLOURS.green };
  if (s >= 50) return { label: s, cls: CONFIDENCE_COLOURS.amber };
  return { label: s, cls: CONFIDENCE_COLOURS.red };
}

const RECENCY_COLOURS: Record<string, string> = {
  fresh: 'bg-emerald-100 text-emerald-800',
  aging: 'bg-amber-100 text-amber-800',
  stale: 'bg-red-100 text-red-800',
  never: 'bg-neutral-100 text-neutral-600',
};

export default function AdminPage() {
  const supabase = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [recency, setRecency] = useState<RecencyRow[]>([]);
  const [recencyFilter, setRecencyFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(
    async (t: Tab) => {
      setTab(t);
      setSelected(new Set());
      if (t === 'territories') {
        const { data } = await supabase.from('territories').select('*').order('state').order('name');
        setTerritories((data ?? []) as Territory[]);
        return;
      }
      if (t === 'recency') {
        const { data } = await supabase
          .from('business_verification_recency')
          .select('*')
          .order('recency_score', { ascending: true })
          .order('last_verified', { ascending: true, nullsFirst: true })
          .limit(500);
        setRecency((data ?? []) as RecencyRow[]);
        return;
      }
      let query = supabase.from('businesses').select('*').limit(250);
      if (t === 'pending') {
        query = query.eq('status', 'unverified').order('confidence_score', { ascending: false });
      } else if (t === 'active') {
        query = query.eq('status', 'active').order('name');
      } else if (t === 'flags') {
        query = query.not('verification_flags', 'eq', '[]').order('confidence_score', { ascending: true });
      }
      const { data } = await query;
      setBusinesses((data ?? []) as Business[]);
    },
    [supabase],
  );

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
      const { data: me } = await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle();
      if ((me as { role?: string } | null)?.role !== 'admin') {
        setLoading(false);
        return;
      }
      setAuthed(true);
      await load('pending');
      setLoading(false);
    })();
  }, [supabase, load]);

  async function setBusinessStatus(ids: string[], next: 'active' | 'excluded' | 'unverified') {
    if (ids.length === 0) return;
    setStatus(`Updating ${ids.length}…`);
    await supabase.from('businesses').update({ status: next }).in('id', ids);
    setStatus(`${ids.length} updated`);
    setTimeout(() => setStatus(null), 2000);
    await load(tab);
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectAllHighConfidence() {
    const ids = new Set(businesses.filter((b) => (b.confidence_score ?? 0) >= 75).map((b) => b.id));
    setSelected(ids);
  }

  const filteredRecency = recencyFilter === 'all'
    ? recency
    : recency.filter((r) => r.recency_label === recencyFilter);

  const staleCount = recency.filter((r) => r.recency_label === 'stale' || r.recency_label === 'never').length;

  if (loading) return <Shell><p className="text-sm text-neutral-500">Loading…</p></Shell>;

  if (!authed) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-neutral-600">You must be signed in as an admin user to view this page.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        {status && <span className="text-sm text-emerald-700">{status}</span>}
      </div>

      <nav className="mt-6 flex gap-2 border-b border-neutral-200">
        {(['pending', 'active', 'territories', 'flags', 'recency'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => load(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t === 'pending' ? 'Pending approval' : t}
          </button>
        ))}
      </nav>

      {tab === 'territories' && (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
              <th className="pb-2">Name</th>
              <th>State</th>
              <th>Status</th>
              <th>Raw</th>
              <th>Live</th>
              <th>Last imported</th>
            </tr>
          </thead>
          <tbody>
            {territories.map((t) => (
              <tr key={t.id} className="border-b border-neutral-100">
                <td className="py-3 font-medium">{t.name}</td>
                <td>{t.state}</td>
                <td className="capitalize">{t.import_status}</td>
                <td>{t.raw_count}</td>
                <td>{t.live_count}</td>
                <td className="text-xs text-neutral-500">
                  {t.last_imported_at ? new Date(t.last_imported_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'recency' && (
        <div className="mt-6">
          {staleCount > 0 && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              ⚠️ <strong>{staleCount}</strong> listings are stale (&gt;6 months) or never verified — field visits needed.
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {(['all', 'stale', 'never', 'aging', 'fresh'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setRecencyFilter(f)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  recencyFilter === f
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {f === 'all' ? `All (${recency.length})` : `${f} (${recency.filter((r) => r.recency_label === f).length})`}
              </button>
            ))}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
                <th className="pb-2">Business</th>
                <th>Suburb</th>
                <th>State</th>
                <th>Last verified</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecency.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">No rows.</td>
                </tr>
              )}
              {filteredRecency.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100">
                  <td className="py-3 font-medium">{r.name}</td>
                  <td className="py-3">{r.suburb}</td>
                  <td className="py-3">{r.state}</td>
                  <td className="py-3 text-xs text-neutral-500">
                    {r.last_verified ? new Date(r.last_verified).toLocaleDateString('en-AU') : '—'}
                  </td>
                  <td className="py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${RECENCY_COLOURS[r.recency_label] ?? 'bg-neutral-100 text-neutral-600'}`}>
                      {r.recency_label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(tab === 'pending' || tab === 'active' || tab === 'flags') && (
        <>
          {tab === 'pending' && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllHighConfidence}
                className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Select all 75+ confidence
              </button>
              <button
                type="button"
                disabled={selected.size === 0}
                onClick={() => setBusinessStatus(Array.from(selected), 'active')}
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                ✅ Approve selected ({selected.size})
              </button>
              <button
                type="button"
                disabled={selected.size === 0}
                onClick={() => setBusinessStatus(Array.from(selected), 'excluded')}
                className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-40"
              >
                ❌ Exclude selected
              </button>
            </div>
          )}

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
                {tab === 'pending' && <th className="w-8 pb-2"></th>}
                <th className="pb-2">Business</th>
                <th>Suburb</th>
                <th>Type</th>
                {tab !== 'active' && <th>Score</th>}
                <th>Rating</th>
                <th>Flags</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-neutral-500">
                    No rows.
                  </td>
                </tr>
              )}
              {businesses.map((b) => {
                const badge = confidenceBadge(b.confidence_score);
                return (
                  <tr key={b.id} className="border-b border-neutral-100 align-top">
                    {tab === 'pending' && (
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(b.id)}
                          onChange={() => toggleSelected(b.id)}
                        />
                      </td>
                    )}
                    <td className="py-3">
                      <p className="font-semibold text-neutral-900">{b.name}</p>
                      {b.address_line1 && (
                        <p className="text-xs text-neutral-500">{b.address_line1}</p>
                      )}
                    </td>
                    <td className="py-3">{b.suburb}, {b.state}</td>
                    <td className="py-3 capitalize">{b.business_type.replace('_', ' ')}</td>
                    {tab !== 'active' && (
                      <td className="py-3">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    )}
                    <td className="py-3">
                      {b.google_rating != null
                        ? `★ ${b.google_rating.toFixed(1)} (${b.google_review_count ?? 0})`
                        : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex max-w-[240px] flex-wrap gap-1">
                        {(b.verification_flags ?? []).map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1">
                        {tab === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setBusinessStatus([b.id], 'active')}
                              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setBusinessStatus([b.id], 'excluded')}
                              className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-700"
                            >
                              Exclude
                            </button>
                          </>
                        )}
                        {tab === 'active' && (
                          <button
                            type="button"
                            onClick={() => setBusinessStatus([b.id], 'unverified')}
                            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                          >
                            Unpublish
                          </button>
                        )}
                        {b.google_place_id && (
                          <a
                            href={`https://www.google.com/maps/place/?q=place_id:${b.google_place_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                          >
                            🔍 Google
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link href="/" className="text-sm font-semibold text-rose-600 hover:text-rose-500">
            ← findme.hair
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </main>
  );
}
