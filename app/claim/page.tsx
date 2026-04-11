import { Suspense } from 'react';
import ClaimForm from './ClaimForm';

export default function ClaimPage() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-neutral-500">Loading…</p>}>
      <ClaimForm />
    </Suspense>
  );
}
