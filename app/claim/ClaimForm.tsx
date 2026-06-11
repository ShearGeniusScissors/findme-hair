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

export interface ClaimSalon {
  slug: string;
  name: string;
  address: string | null;
  suburb: string;
  state: string;
}

export default function ClaimForm({ salon }: { salon?: ClaimSalon | null }) {
  const params = useSearchParams();
  const slug = salon?.slug ?? params.get('slug') ?? '';
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
    <main className="min-h-screen bg-[var(--color-surface)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-white)]">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link href="/" className="text-sm font-semibold text-[var(--color-gold-dark)] hover:text-[var(--color-gold)]">
            ← findme.hair
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-3xl text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
          Claim your free listing
        </h1>
        <p className="mt-2 text-[var(--color-ink-light)]">
          We&rsquo;ll send a magic link to your email. If your email matches the salon&rsquo;s
          website, you&rsquo;re in instantly. Otherwise we&rsquo;ll verify ownership within 24 hours.
        </p>

        {/* Screen 1 — Confirm (playbook Part 3): the salon they came from,
            name + address shown, never make them search. Falls back to the
            slug when the server lookup missed. */}
        {salon ? (
          <div className="mt-4 rounded-lg border border-[var(--color-gold)] bg-[var(--color-gold-light)] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
              Your salon
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--color-ink)]">{salon.name}</p>
            <p className="text-sm text-[var(--color-ink-light)]">
              {salon.address ? `${salon.address}, ` : ''}
              {salon.suburb}, {salon.state}
            </p>
          </div>
        ) : slug ? (
          <p className="mt-4 rounded-lg border border-[var(--color-gold)] bg-[var(--color-gold-light)] px-4 py-3 text-sm text-[var(--color-ink)]">
            Claiming: <span className="font-semibold">{slug}</span>
          </p>
        ) : null}

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
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Your email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-sm focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-light)]"
                  placeholder="you@yoursalon.com.au"
                />
                <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">
                  Tip: use the email at your salon&rsquo;s domain for instant verification.
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Tell us a bit about yourself (optional)
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-sm focus:border-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-light)]"
                  placeholder="Owner of Example Salon, opened 2018…"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="btn-gold w-full justify-center disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending magic link…' : 'Claim my free listing'}
            </button>
            {error && <p className="text-sm text-[#b3261e]">{error}</p>}
          </form>
        )}

        {/* Why claim — real benefits, no urgency (playbook Part 4 locked copy) */}
        <div className="mt-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-white)] p-6">
          <p className="text-sm font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-serif)' }}>
            Why claim your listing?
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-light)]">
            <li>✓ Update your details, hours and booking link</li>
            <li>✓ Add your own photos</li>
            <li>✓ See how many people viewed your page</li>
          </ul>
          <p className="mt-4 text-xs text-[var(--color-ink-muted)]">
            Free forever · Takes 2 minutes · You control what customers see
          </p>
        </div>
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
