import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole, supabaseServerAnon } from '@/lib/supabase';
import { emailDomainMatchesWebsite, isDisposableEmail } from '@/lib/emailDomain';

// Audit row e53b6673 — initialise a claim. This route does NOT issue the
// magic link itself; we hand that off to Supabase Auth from the client so
// the user's session is set up correctly on the redirect. What this route
// does:
//   1. validates the slug + checks the listing isn't already claimed
//   2. matches the email domain against the salon's website_url
//   3. inserts a claim_attempts row (auditable funnel)
//   4. POSTs to coordination_log if pending manual review so Matt sees the queue
//   5. returns the verification verdict to the client
// Anti-spam: simple email-shape validation + disposable-domain reject. Full
// rate-limit + Turnstile is the next iteration (needs Upstash KV / site key).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InitPayload {
  slug?: string;
  email?: string;
  message?: string;
  session_hash?: string;
}

export async function POST(req: NextRequest) {
  let body: InitPayload;
  try {
    body = (await req.json()) as InitPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const slug = (body.slug ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const message = (body.message ?? '').trim().slice(0, 1000);
  const sessionHash = (body.session_hash ?? '').trim().slice(0, 128);

  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }
  if (isDisposableEmail(email)) {
    return NextResponse.json(
      { error: 'Please use your salon\'s business email (disposable email addresses are not accepted).' },
      { status: 400 },
    );
  }

  const anon = supabaseServerAnon();
  const { data: business } = await anon
    .from('businesses')
    .select('id, slug, name, website_url, is_claimed, claimed_by, suburb, state')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: 'Salon not found.' }, { status: 404 });
  }

  if (business.is_claimed && business.claimed_by) {
    return NextResponse.json(
      {
        error: 'This listing has already been claimed by its owner. If you are the owner, ' +
               'sign in with the email you used to claim it.',
      },
      { status: 409 },
    );
  }

  const verifiedByEmail = emailDomainMatchesWebsite(email, business.website_url);
  const verdict: 'verified_owner' | 'pending_review' = verifiedByEmail ? 'verified_owner' : 'pending_review';

  // claim_attempts is INSERT-only for anon (per audit RLS migration). We use
  // the service role here to avoid a round-trip token, and so we can also
  // surface the row id back to the client for the magic-link redirect.
  const service = supabaseServiceRole();
  const { data: attempt, error: attemptErr } = await service
    .from('claim_attempts')
    .insert({
      business_id: business.id,
      session_hash: sessionHash || null,
      variant: 'v1',
      entry_route: 'claim',
      entry_cta: 'claim_form_submit',
      email_entered: true,
      phone_entered: false,
      verification_method: verifiedByEmail ? 'email_domain_match' : null,
      outcome: verdict,
    })
    .select('id')
    .single();

  if (attemptErr) {
    return NextResponse.json({ error: 'Failed to record claim attempt' }, { status: 500 });
  }

  // Emit one claim_events row for analytics — keeps claim_funnel_v warm.
  await service.from('claim_events').insert({
    attempt_id: attempt.id,
    business_id: business.id,
    event_type: 'claim_submitted',
    variant: 'v1',
    meta: { verdict, has_website: !!business.website_url, message_length: message.length },
  });

  // For pending review, post a coordination_log row so Matt/Aaron see the queue.
  if (!verifiedByEmail) {
    await service.from('coordination_log').insert({
      from_org: 'FMH',
      to_org: 'FMH',
      to_agent: 'fmh-ceo',
      topic: 'claim.pending_review',
      priority: 'high',
      message: `Claim pending manual review: ${business.name} (${business.suburb}, ${business.state}) — ${email}`,
      payload: {
        business_id: business.id,
        business_slug: business.slug,
        business_name: business.name,
        business_website: business.website_url,
        claimant_email: email,
        claimant_message: message,
        claim_attempt_id: attempt.id,
        verdict: 'pending_review',
        reason: business.website_url
          ? 'email_domain_does_not_match_website'
          : 'no_website_on_listing',
      },
    });
  }

  return NextResponse.json({
    ok: true,
    verdict,
    business: { id: business.id, slug: business.slug, name: business.name },
    claim_attempt_id: attempt.id,
  });
}
