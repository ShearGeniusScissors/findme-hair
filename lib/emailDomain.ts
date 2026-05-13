/**
 * Email-domain matching for the claim flow. Audit row e53b6673.
 *
 * Match rules:
 *   - extract the hostname from the website URL (drop protocol + www. prefix)
 *   - extract the domain after @ from the email
 *   - accept if they're equal OR the website host is a subdomain of the email domain
 *
 * We accept "owner@business.com.au" → "https://www.business.com.au/" without
 * needing the public-suffix list (tldts) because we compare full suffixes,
 * not registrable roots. False-negative risk: an owner with email
 * "owner@parentcompany.com" claiming "salon.com" (legitimately separate brand)
 * fails this check and falls through to manual review — which is the correct
 * outcome.
 */
export function emailDomainMatchesWebsite(email: string, websiteUrl: string | null | undefined): boolean {
  if (!email || !websiteUrl) return false;

  const atIdx = email.lastIndexOf('@');
  if (atIdx < 1) return false;
  const emailDomain = email.slice(atIdx + 1).trim().toLowerCase();
  if (!emailDomain || !emailDomain.includes('.')) return false;

  let websiteHost: string;
  try {
    const u = new URL(websiteUrl.trim());
    websiteHost = u.hostname.toLowerCase();
  } catch {
    // websiteUrl might be missing protocol — try patching it on.
    try {
      const u = new URL('https://' + websiteUrl.trim());
      websiteHost = u.hostname.toLowerCase();
    } catch {
      return false;
    }
  }
  // Strip leading www. for the comparison.
  websiteHost = websiteHost.replace(/^www\./, '');

  if (websiteHost === emailDomain) return true;
  // Allow email at the apex while website lives on a subdomain (e.g. owner@brand.com.au
  // and https://book.brand.com.au).
  if (websiteHost.endsWith('.' + emailDomain)) return true;
  // Allow website at the apex while email lives on a subdomain (rare).
  if (emailDomain.endsWith('.' + websiteHost)) return true;
  return false;
}

/**
 * Very conservative disposable-email check — only rejects the most obvious
 * temp-mail providers. Pre-launch we'd rather over-accept and let manual
 * review catch the rest than block a real salon owner with a quirky address.
 */
const DISPOSABLE_DOMAINS = new Set<string>([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', '10minutemail.com',
  '10minutemail.net', 'yopmail.com', 'throwawaymail.com', 'getairmail.com',
  'getnada.com', 'mintemail.com', 'sharklasers.com', 'maildrop.cc',
  'fakeinbox.com', 'dropmail.me', 'trashmail.com', 'mohmal.com',
]);

export function isDisposableEmail(email: string): boolean {
  const atIdx = email.lastIndexOf('@');
  if (atIdx < 1) return false;
  return DISPOSABLE_DOMAINS.has(email.slice(atIdx + 1).trim().toLowerCase());
}
