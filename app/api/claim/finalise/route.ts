import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase';

// Audit row e53b6673 — second leg of the claim flow. Called from /dashboard
// after the magic-link sign-in completes. We verify the caller's auth token
// (Bearer header from the dashboard's session), look up the matching
// claim_attempt, and:
//   - if verdict was verified_owner AND email-domain still matches: mark
//     businesses.is_claimed=true, claimed_by=user.id (idempotent — if a
//     listing is already claimed by THIS user we just return success).
//   - if verdict was pending_review: do nothing to businesses; tell the
//     dashboard so it can render the pending UX. Matt's manual approval
//     queue is the existing coordination_log row created at /api/claim/init.

interface FinalisePayload {
  slug?: string;
  verdict?: 'verified_owner' | 'pending_review';
  claim_attempt_id?: string;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseServiceRole();
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: FinalisePayload;
  try {
    body = (await req.json()) as FinalisePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const slug = (body.slug ?? '').trim();
  const verdict = body.verdict;
  const claimAttemptId = (body.claim_attempt_id ?? '').trim();
  if (!slug || !verdict || !claimAttemptId) {
    return NextResponse.json({ error: 'slug, verdict, claim_attempt_id required' }, { status: 400 });
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug, name, is_claimed, claimed_by, website_url')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!business) return NextResponse.json({ error: 'Salon not found' }, { status: 404 });

  // Already claimed by this user — idempotent success.
  if (business.is_claimed && business.claimed_by === user.id) {
    await logEvent(supabase, claimAttemptId, business.id, 'claim_finalise_idempotent', { verdict });
    return NextResponse.json({ claimed: true, business_name: business.name });
  }

  // Race: someone else claimed in the meantime.
  if (business.is_claimed && business.claimed_by && business.claimed_by !== user.id) {
    await logEvent(supabase, claimAttemptId, business.id, 'claim_finalise_already_claimed', { verdict });
    return NextResponse.json(
      { error: 'This listing has already been claimed by someone else.' },
      { status: 409 },
    );
  }

  if (verdict === 'verified_owner') {
    // Re-verify the email-domain match server-side. We do this again here
    // because the verdict comes from the client URL; never trust it.
    const { emailDomainMatchesWebsite } = await import('@/lib/emailDomain');
    const reMatches = user.email
      ? emailDomainMatchesWebsite(user.email, business.website_url)
      : false;

    if (!reMatches) {
      // Trust was lost between /init and /finalise. Downgrade to pending.
      await supabase.from('claim_attempts').update({
        outcome: 'pending_review',
        verification_method: null,
      }).eq('id', claimAttemptId);
      await logEvent(supabase, claimAttemptId, business.id, 'claim_finalise_downgrade_to_pending', {});
      return NextResponse.json({ pending: true, business_name: business.name });
    }

    const { error: claimErr } = await supabase
      .from('businesses')
      .update({ is_claimed: true, claimed_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', business.id);

    if (claimErr) {
      return NextResponse.json({ error: 'Failed to claim listing' }, { status: 500 });
    }

    await supabase.from('claim_attempts').update({
      outcome: 'claimed',
      verification_confirmed_at: new Date().toISOString(),
    }).eq('id', claimAttemptId);

    await logEvent(supabase, claimAttemptId, business.id, 'claim_finalise_success', {});

    return NextResponse.json({ claimed: true, business_name: business.name });
  }

  // verdict === 'pending_review'
  await supabase.from('claim_attempts').update({
    verification_confirmed_at: new Date().toISOString(),
  }).eq('id', claimAttemptId);
  await logEvent(supabase, claimAttemptId, business.id, 'claim_finalise_pending_ack', {});
  return NextResponse.json({ pending: true, business_name: business.name });
}

async function logEvent(
  supabase: ReturnType<typeof supabaseServiceRole>,
  attemptId: string,
  businessId: string,
  eventType: string,
  meta: Record<string, unknown>,
) {
  try {
    await supabase.from('claim_events').insert({
      attempt_id: attemptId,
      business_id: businessId,
      event_type: eventType,
      variant: 'v1',
      meta,
    });
  } catch {
    // claim_events is best-effort — never block the claim on a log write.
  }
}
