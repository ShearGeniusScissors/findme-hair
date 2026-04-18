'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import type { Business, BusinessMedia, OpeningHours } from '@/types/database';

const BUCKET = 'business-photos';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function defaultHours(businessId: string): OpeningHours[] {
  return DAYS.map((_, i) => ({
    id: '',
    business_id: businessId,
    day_of_week: i,
    open_time: i === 0 ? null : '09:00',
    close_time: i === 0 ? null : '17:00',
    is_closed: i === 0, // closed Sunday by default
  }));
}

export default function DashboardPage() {
  const supabase = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [listings, setListings] = useState<Business[]>([]);
  const [hours, setHours] = useState<Record<string, OpeningHours[]>>({});
  const [media, setMedia] = useState<Record<string, BusinessMedia[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadMedia = useCallback(async (businessId: string) => {
    const { data } = await supabase
      .from('business_media')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order');
    setMedia((prev) => ({ ...prev, [businessId]: (data ?? []) as BusinessMedia[] }));
  }, [supabase]);

  function photoUrl(storagePath: string) {
    const { data } = supabaseBrowser().storage.from(BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  async function uploadPhoto(businessId: string, file: File) {
    if (!token) return;
    flash('Uploading photo…');
    const form = new FormData();
    form.append('file', file);
    form.append('businessId', businessId);
    form.append('mediaType', 'gallery');
    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await res.json();
    if (!res.ok) { flash(`Upload error: ${json.error}`); return; }
    flash('Photo uploaded ✓');
    await loadMedia(businessId);
  }

  async function deletePhoto(businessId: string, mediaId: string) {
    if (!token) return;
    flash('Deleting…');
    const res = await fetch('/api/photos', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId }),
    });
    if (!res.ok) { flash('Delete failed'); return; }
    flash('Deleted ✓');
    setMedia((prev) => ({
      ...prev,
      [businessId]: (prev[businessId] ?? []).filter((m) => m.id !== mediaId),
    }));
  }

  const loadHours = useCallback(async (businessId: string) => {
    const { data } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('business_id', businessId)
      .order('day_of_week');
    if (data && data.length === 7) {
      setHours((prev) => ({ ...prev, [businessId]: data as OpeningHours[] }));
    } else {
      setHours((prev) => ({ ...prev, [businessId]: defaultHours(businessId) }));
    }
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email ?? null);
      const { data: sess } = await supabase.auth.getSession();
      setToken(sess.session?.access_token ?? null);
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

  function flash(msg: string) {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2500);
  }

  async function updateField(id: string, field: string, value: string | boolean | null) {
    flash('Saving…');
    const { error } = await supabase
      .from('businesses')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', id);
    flash(error ? `Error: ${error.message}` : 'Saved ✓');
    if (!error) {
      setListings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
      );
    }
  }

  async function saveHours(businessId: string) {
    flash('Saving hours…');
    const rows = hours[businessId];
    if (!rows) return;

    const upsertRows = rows.map((h) => ({
      business_id: businessId,
      day_of_week: h.day_of_week,
      open_time: h.is_closed ? null : h.open_time,
      close_time: h.is_closed ? null : h.close_time,
      is_closed: h.is_closed,
    }));

    const { error } = await supabase
      .from('opening_hours')
      .upsert(upsertRows, { onConflict: 'business_id,day_of_week' });
    flash(error ? `Error: ${error.message}` : 'Hours saved ✓');
  }

  function updateHoursLocal(businessId: string, dayIndex: number, patch: Partial<OpeningHours>) {
    setHours((prev) => ({
      ...prev,
      [businessId]: prev[businessId].map((h) =>
        h.day_of_week === dayIndex ? { ...h, ...patch } : h
      ),
    }));
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!hours[id]) await loadHours(id);
    if (!media[id]) await loadMedia(id);
  }

  if (loading) {
    return <Shell><p className="text-sm text-neutral-500">Loading…</p></Shell>;
  }

  if (!email) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-neutral-900">Not signed in</h1>
        <p className="mt-2 text-neutral-600">You need to claim a listing first.</p>
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
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{status}</p>
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
            <li key={b.id} className="rounded-xl border border-neutral-200 bg-white">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 p-5">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{b.name}</h3>
                  <p className="text-sm text-neutral-600">
                    {b.suburb}, {b.state} {b.postcode}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/salon/${b.slug}`}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                  >
                    View public page →
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleExpand(b.id)}
                    className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    {expandedId === b.id ? 'Collapse' : 'Edit listing'}
                  </button>
                </div>
              </div>

              {expandedId === b.id && (
                <div className="border-t border-neutral-100 px-5 pb-5 pt-4 space-y-5">

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Description
                    </label>
                    <textarea
                      key={`desc-${b.id}`}
                      defaultValue={b.description ?? ''}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
                      onBlur={(e) => updateField(b.id, 'description', e.target.value)}
                    />
                    <p className="mt-0.5 text-[11px] text-neutral-400">Saved on blur.</p>
                  </div>

                  {/* Booking URL */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Booking URL
                    </label>
                    <input
                      type="url"
                      key={`booking-${b.id}`}
                      defaultValue={b.booking_url ?? ''}
                      placeholder="https://your-booking-link.com"
                      className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
                      onBlur={(e) => updateField(b.id, 'booking_url', e.target.value || null)}
                    />
                    <p className="mt-0.5 text-[11px] text-neutral-400">Fresha, Kitomba, Timely, or any direct link. Saved on blur.</p>
                  </div>

                  {/* Walk-ins */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={b.walk_ins_welcome ?? false}
                        onChange={(e) => updateField(b.id, 'walk_ins_welcome', e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-sm font-medium text-neutral-700">
                        Walk-ins welcome
                      </span>
                    </label>
                  </div>

                  {/* Photos */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Photos
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[b.id]?.click()}
                        className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-400"
                      >
                        + Add photo
                      </button>
                      <input
                        ref={(el) => { fileInputRefs.current[b.id] = el; }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(b.id, file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    {(media[b.id] ?? []).length === 0 ? (
                      <p className="mt-2 text-xs text-neutral-400">No photos yet. Add up to 10 images (JPEG/PNG/WebP, max 5 MB each).</p>
                    ) : (
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {(media[b.id] ?? []).map((m) => (
                          <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoUrl(m.storage_path)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => deletePhoto(b.id, m.id)}
                              className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white group-hover:flex items-center justify-center text-xs leading-none"
                              aria-label="Delete photo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Opening hours */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Opening hours
                      </label>
                      <button
                        type="button"
                        onClick={() => saveHours(b.id)}
                        className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-400"
                      >
                        Save hours
                      </button>
                    </div>
                    {hours[b.id] ? (
                      <div className="mt-2 space-y-2">
                        {hours[b.id].map((h) => (
                          <div key={h.day_of_week} className="flex items-center gap-3">
                            <span className="w-24 text-sm text-neutral-700">{DAYS[h.day_of_week]}</span>
                            <label className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={h.is_closed}
                                onChange={(e) =>
                                  updateHoursLocal(b.id, h.day_of_week, { is_closed: e.target.checked })
                                }
                                className="h-3.5 w-3.5"
                              />
                              <span className="text-xs text-neutral-500">Closed</span>
                            </label>
                            {!h.is_closed && (
                              <>
                                <input
                                  type="time"
                                  value={h.open_time ?? '09:00'}
                                  onChange={(e) =>
                                    updateHoursLocal(b.id, h.day_of_week, { open_time: e.target.value })
                                  }
                                  className="rounded border border-neutral-300 px-2 py-1 text-xs"
                                />
                                <span className="text-xs text-neutral-400">–</span>
                                <input
                                  type="time"
                                  value={h.close_time ?? '17:00'}
                                  onChange={(e) =>
                                    updateHoursLocal(b.id, h.day_of_week, { close_time: e.target.value })
                                  }
                                  className="rounded border border-neutral-300 px-2 py-1 text-xs"
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-neutral-400">Loading hours…</p>
                    )}
                  </div>

                </div>
              )}
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
