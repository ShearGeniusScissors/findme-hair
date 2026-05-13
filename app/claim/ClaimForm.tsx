'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';

// Audit row e53b6673 — real claim flow with email-domain verification.
// Server-side /api/claim/init does the lookup + match + claim_attempts insert,
// then this client uses Supabase Auth OTP to send the magic link.

type Verdict = 'verified_owner' | 'pending_review';

interface InitResponse {
  ok: true;
  verdict: Verdict;
  business: { id: string; slug: string; name: string };
  claim_attempt_id: string;
}

export default function ClaimForm() {
  const params = useSearchParams();
  const slug = params.get('slug') ?? '';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug) {
      setError('No salon selected. Open a salon page first and use the Claim button there.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError(null);

    try {
      // Step 1 — validate + log + decide verdict (server side).
      const initRes = await fetch('/api/claim/init', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug,
          email,
          message,
          session_hash: getOrCreateSessionHash(),
        }),
      });
      const initJson = (await initRes.json()) as InitResponse | { error: string };
      if (!initRes.ok || !('ok' in initJson)) {
        throw new Error('error' in initJson ? initJson.error : 'Could not start claim');
      }

      // Step 2 — send the magic link. Pass verdict + claim_attempt_id through
      // the redirect so the dashboard knows whether to auto-claim or show
      // the pending-review state.
      const supabase = supabaseBrowser();
      const redirect = new URL(`${window.location.origin}/dashboard`);
      redirect.searchParams.set('slug', slug);
      redirect.searchParams.set('verdict', initJson.verdict);
      redirect.searchParams.set('claim_attempt_id', initJson.claim_attempt_id);
      if (message) redirect.searchParams.set('message', message);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirect.toString() },
      });
      if (otpError) throw otpError;

      setVerdict(initJson.verdict);
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
          We&rsquo;ll send a magic link to your email. If your email matches the salon&rsquo;s
          website, you&rsquo;re in instantly. Otherwise we&rsquo;ll verify ownership within 24 hours.
        </p>

        {slug && (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Claiming: <span className="font-semibold">{slug}</span>
          </p>
        )}

        {status === 'sent' ? (
          verdict === 'verified_owner' ? (
            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
              <p className="font-semibold">Check your email</p>
              <p className="mt-2 text-sm">
                We sent a magic link to <span className="font-semibold">{email}</span>. Click it
                to sign in &mdash; your email domain matches the salon&rsquo;s website, so the
                listing will be claimed automatically.
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
              <p className="font-semibold">Check your email &mdash; one extra step</p>
              <p className="mt-2 text-sm">
                We sent a magic link to <span className="font-semibold">{email}</span>. Click
                it to sign in. Because your email doesn&rsquo;t match the salon&rsquo;s website,
                our team will manually verify ownership within 24 hours and email you when
                you&rsquo;re approved.
              </p>
            </div>
          )
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
                <span className="mt-1 block text-xs text-neutral-500">
                  Tip: use the email at your salon&rsquo;s domain for instant verification.
                </span>
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

/**
 * Lightweight client-side session id so we can correlate claim_attempts +
 * claim_events without storing PII. Lives in sessionStorage so it resets per
 * tab; not a tracking cookie.
 */
function getOrCreateSessionHash(): string {
  if (typeof window === 'undefined') return '';
  try {
    const k = 'fmh.session_hash';
    let v = window.sessionStorage.getItem(k);
    if (!v) {
      v = Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.sessionStorage.setItem(k, v);
    }
    return v;
  } catch {
    return '';
  }
}
