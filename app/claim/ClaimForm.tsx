'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';

export default function ClaimForm() {
  const params = useSearchParams();
  const slug = params.get('slug') ?? '';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard?slug=${slug}&message=${encodeURIComponent(message)}`,
        },
      });
      if (error) throw error;
      setStatus('sent');
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/" className="text-sm font-semibold text-rose-600 hover:text-rose-500">
            ← findme.hair
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-neutral-900">Claim your listing</h1>
        <p className="mt-2 text-neutral-600">
          We&rsquo;ll send a magic link to your email. Click it to verify you own the
          business and take over the listing.
        </p>

        {slug && (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Claiming: <span className="font-semibold">{slug}</span>
          </p>
        )}

        {status === 'sent' ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <p className="font-semibold">Check your email</p>
            <p className="mt-2 text-sm">
              We sent a magic link to <span className="font-semibold">{email}</span>.
              Click the link to finish claiming the listing.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Your email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  placeholder="you@yoursalon.com.au"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Tell us a bit about yourself (optional)
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  placeholder="Owner of Example Salon, opened 2018…"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="inline-flex w-full items-center justify-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending magic link…' : 'Send me a magic link'}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
