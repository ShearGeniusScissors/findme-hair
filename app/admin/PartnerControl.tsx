'use client';

import { useState } from 'react';

// ShearGenius Partner flag for one listing (businesses.sg_partner + sg_partner_since).
// Admin-only: the database rejects the change from anyone who isn't a findme.hair admin
// (trigger businesses_sg_partner_guard). Saving changes the listing row, which fires the
// existing revalidate webhook, so the salon page shows or hides the badge straight away.
export default function PartnerControl({
  partner,
  since,
  onSave,
}: {
  partner: boolean;
  since: string | null;
  onSave: (next: { sg_partner: boolean; sg_partner_since: string | null }) => Promise<string | null>;
}) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' });
  const [on, setOn] = useState(partner);
  const [date, setDate] = useState(since ?? '');
  const [savedDate, setSavedDate] = useState(since ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(nextOn: boolean, nextDate: string) {
    setBusy(true);
    setError(null);
    const payload = nextOn
      ? { sg_partner: true, sg_partner_since: nextDate || today }
      : { sg_partner: false, sg_partner_since: null };
    const err = await onSave(payload);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setOn(payload.sg_partner);
    setDate(payload.sg_partner_since ?? '');
    setSavedDate(payload.sg_partner_since ?? '');
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
      <label className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-neutral-700">
        <input
          type="checkbox"
          checked={on}
          disabled={busy}
          onChange={(e) => save(e.target.checked, date)}
          aria-label="ShearGenius Partner"
        />
        ShearGenius Partner
      </label>
      {on && (
        <label className="inline-flex items-center gap-1 text-neutral-500">
          since
          <input
            type="date"
            value={date}
            disabled={busy}
            onChange={(e) => setDate(e.target.value)}
            onBlur={(e) => {
              if (e.target.value !== savedDate) save(true, e.target.value);
            }}
            className="rounded border border-neutral-200 px-1 py-0.5 text-[11px] text-neutral-700"
          />
        </label>
      )}
      {on && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">Badge on</span>}
      {busy && <span className="text-neutral-400">Saving…</span>}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
