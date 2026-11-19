'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';

// Sign-in for /admin (19 Nov 2026). /admin had no way to sign in; staff accounts are the
// existing Supabase Auth users that SG Routes uses (findme.hair and SG Routes share one
// project), and /admin still only opens for public.users role 'admin'. Password, or a
// one-time code: emailed magic links land on localhost (project Site URL), so they're not
// offered. No account is ever created here.
export default function AdminSignIn({ signedInAs }: { signedInAs: string | null }) {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [useCode, setUseCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (signedInAs) {
    return (
      <div className="mt-4 max-w-sm text-sm text-neutral-700">
        <p>
          Signed in as <strong>{signedInAs}</strong>, which isn&rsquo;t a findme.hair admin.
        </p>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
          className="mt-3 rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-semibold hover:bg-neutral-50"
        >
          Sign out
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const addr = email.trim().toLowerCase();
    if (!addr) return setError('Type your email.');
    setBusy(true);
    const { error: err } = useCode
      ? await supabase.auth.verifyOtp({ email: addr, token: code.replace(/\D/g, ''), type: 'email' })
      : await supabase.auth.signInWithPassword({ email: addr, password });
    setBusy(false);
    if (err) {
      setError(useCode ? 'That code didn’t work. Use the newest code and type every number.' : 'Email or password didn’t match.');
      return;
    }
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-sm space-y-3 text-sm">
      <label className="block">
        <span className="text-xs font-semibold text-neutral-600">Email</span>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      {useCode ? (
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Sign-in code</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 tracking-widest"
          />
          <span className="mt-1 block text-xs text-neutral-500">
            The code texted by the SG Routes sign-in screen works here too (same staff account).
          </span>
        </label>
      ) : (
        <label className="block">
          <span className="text-xs font-semibold text-neutral-600">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <button
        type="button"
        onClick={() => {
          setUseCode(!useCode);
          setError(null);
        }}
        className="text-xs text-neutral-500 underline hover:text-neutral-800"
      >
        {useCode ? 'Use a password instead' : 'No password? Use a sign-in code'}
      </button>
    </form>
  );
}
