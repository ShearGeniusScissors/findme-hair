import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { supabaseServiceRole, supabaseServerInternal } from '@/lib/supabase';
import { emailDomainMatchesWebsite, isDisposableEmail } from '@/lib/emailDomain';

// Audit row 884a60c2 — rate limit /claim using the claim_attempts table itself
// (no external KV dep). 3 attempts per IP per hour, 5 per email per day.
const IP_HOURLY_LIMIT = 3;
const EMAIL_DAILY_LIMIT = 5;

function clientIp(req: NextRequest): string {
  // Vercel populates x-forwarded-for and x-real-ip; the legacy ip() helper is
  // gone in Next 16. Take the first XFF entry (left-most = original client).
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** Hash the IP so we don't store raw IPs in claim_attempts.session_hash. */
function hashIp(ip: string): string {
  return 'ip_' + createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

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

  // Rate-limit via claim_attempts row count — no external KV needed.
  const service = supabaseServiceRole();
  const ipHash = hashIp(clientIp(req));
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 86400 * 1000).toISOString();

  // Count attempts in the last hour from this IP. session_hash holds the IP
  // hash for unauthenticated traffic + the browser session id for in-page
  // submissions; for the rate-limit predicate we look for either match.
  const { count: ipHourly } = await service
    .from('claim_attempts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo)
    .eq('session_hash', ipHash);
  if ((ipHourly ?? 0) >= IP_HOURLY_LIMIT) {
    return NextResponse.json(
      { error: 'Too many claim attempts from this network. Please try again in an hour.' },
      { status: 429 },
    );
  }

  const emailHash = 'em_' + createHash('sha256').update(email).digest('hex').slice(0, 24);
  const { count: emailDaily } = await service
    .from('claim_attempts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo)
    .eq('session_hash', emailHash);
  if ((emailDaily ?? 0) >= EMAIL_DAILY_LIMIT) {
    return NextResponse.json(
      { error: 'Too many claim attempts for this email today. Please try again tomorrow or contact support.' },
      { status: 429 },
    );
  }

  const anon = supabaseServerInternal();
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

  // Record the attempt. We insert THREE rows so the rate-limit query above
  // (which keys on session_hash) finds the right matches: one keyed on the
  // browser session, one keyed on the IP hash, one keyed on the email hash.
  // Without the dual rows the per-IP and per-email limits won't trigger on
  // repeated retries from the same attacker. claim_attempts is INSERT-only
  // for anon (per audit RLS migration); we use service_role here to read
  // the inserted id back for the magic-link redirect.
  const baseRow = {
    business_id: business.id,
    variant: 'v1',
    entry_route: 'claim',
    entry_cta: 'claim_form_submit',
    email_entered: true,
    phone_entered: false,
    verification_method: verifiedByEmail ? 'email_domain_match' : null,
    outcome: verdict,
  };

  // Primary attempt row — used downstream for the magic-link verification.
  const { data: attempt, error: attemptErr } = await service
    .from('claim_attempts')
    .insert({ ...baseRow, session_hash: sessionHash || null })
    .select('id')
    .single();

  // Sibling rows keyed on IP + email hashes — used only by the rate limiter.
  // Fire-and-forget: failures here shouldn't block the legitimate claim.
  await service.from('claim_attempts').insert([
    { ...baseRow, session_hash: ipHash },
    { ...baseRow, session_hash: emailHash },
  ]);

  if (attemptErr) {
    return NextResponse.json({ error: 'Failed to record claim attempt' }, { status: 500 });
  }

  // Emit one claim_events row for analytics — keeps claim_funnel_v warm.
  if (attempt) {
    await service.from('claim_events').insert({
      attempt_id: attempt.id,
      business_id: business.id,
      event_type: 'claim_submitted',
      variant: 'v1',
      meta: { verdict, has_website: !!business.website_url, message_length: message.length },
    });
  }

  // For pending review, post a coordination_log row so Matt/Aaron see the queue.
  if (!verifiedByEmail && attempt) {
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

  if (!attempt) {
    return NextResponse.json({ error: 'Failed to record claim attempt' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    verdict,
    business: { id: business.id, slug: business.slug, name: business.name },
    claim_attempt_id: attempt.id,
  });
}
