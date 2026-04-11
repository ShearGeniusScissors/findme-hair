'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import type { Business } from '@/types/database';

export default function DashboardPage() {
  const supabase = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [listings, setListings] = useState<Business[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('claimed_by', user.id)
        .order('updated_at', { ascending: false });
      setListings(data ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    location.href = '/';
  }

  async function updateDescription(id: string, description: string) {
    setStatus('Saving…');
    const { error } = await supabase
      .from('businesses')
      .update({ description, updated_at: new Date().toISOString() })
      .eq('id', id);
    setStatus(error ? `Error: ${error.message}` : 'Saved');
    setTimeout(() => setStatus(null), 2000);
  }

  if (loading) {
    return <Shell><p className="text-sm text-neutral-500">Loading…</p></Shell>;
  }

  if (!email) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-neutral-900">Not signed in</h1>
        <p className="mt-2 text-neutral-600">
          You need to claim a listing first.
        </p>
        <Link
          href="/claim"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
        >
          Start claim flow
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Your dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">Signed in as {email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Sign out
        </button>
      </div>

      {status && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {status}
        </p>
      )}

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Your listings
      </h2>

      {listings.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          You don&rsquo;t have any claimed listings yet. Contact us to verify ownership.
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {listings.map((b) => (
            <li key={b.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{b.name}</h3>
                  <p className="text-sm text-neutral-600">
                    {b.suburb}, {b.state} {b.postcode}
                  </p>
                </div>
                <Link
                  href={`/salon/${b.slug}`}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                >
                  View public page →
                </Link>
              </div>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Description
              </label>
              <textarea
                defaultValue={b.description ?? ''}
                rows={3}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
                onBlur={(e) => updateDescription(b.id, e.target.value)}
              />
              <p className="mt-1 text-[11px] text-neutral-400">Saved on blur.</p>
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
        <div className="mx-auto max-w-5xl px-6 py-6">
          <Link href="/" className="text-sm font-semibold text-rose-600 hover:text-rose-500">
            ← findme.hair
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">{children}</div>
    </main>
  );
}
