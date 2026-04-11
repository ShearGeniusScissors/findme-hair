'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import type { Business, BusinessStatus, Territory } from '@/types/database';

type Tab = 'unverified' | 'active' | 'territories';

export default function AdminPage() {
  const supabase = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('unverified');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
      const { data: me } = await supabase
        .from('users')
        .select('role')
        .eq('id', auth.user.id)
        .maybeSingle();
      if (me?.role !== 'admin') {
        setLoading(false);
        return;
      }
      setAuthed(true);
      await loadData('unverified');
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData(t: Tab) {
    setTab(t);
    if (t === 'territories') {
      const { data } = await supabase
        .from('territories')
        .select('*')
        .order('state')
        .order('name');
      setTerritories(data ?? []);
    } else {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', t as BusinessStatus)
        .order('created_at', { ascending: false })
        .limit(100);
      setBusinesses(data ?? []);
    }
  }

  async function setStatus(id: string, status: BusinessStatus) {
    await supabase.from('businesses').update({ status }).eq('id', id);
    await loadData(tab);
  }

  if (loading) return <Shell><p className="text-sm text-neutral-500">Loading…</p></Shell>;

  if (!authed) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-neutral-600">
          You must be signed in as an admin user to view this page.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold">Admin</h1>

      <div className="mt-6 flex gap-2 border-b border-neutral-200">
        {(['unverified', 'active', 'territories'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => loadData(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'territories' ? (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
              <th className="pb-2">Name</th>
              <th>State</th>
              <th>Status</th>
              <th>Raw</th>
              <th>Live</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="mt-6 space-y-3">
          {businesses.length === 0 && (
            <li className="text-sm text-neutral-500">No {tab} listings.</li>
          )}
          {businesses.map((b) => (
            <li key={b.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs text-neutral-500">
                    {b.suburb}, {b.state} · {b.business_type}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tab === 'unverified' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setStatus(b.id, 'active')}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(b.id, 'excluded')}
                        className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-700"
                      >
                        Exclude
                      </button>
                    </>
                  )}
                  {tab === 'active' && (
                    <button
                      type="button"
                      onClick={() => setStatus(b.id, 'unverified')}
                      className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      Unpublish
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
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
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </main>
  );
}
