import { formatBusinessType } from '@/lib/formatBusinessType';
import { stateName } from '@/lib/geo';
import { stripMarkdown } from '@/lib/seoMeta';
import type { AuState } from '@/types/database';

/**
 * Listing copy built ONLY from verified fields (rebuild approved by Matt 2026-11-02).
 *
 * Until 2026-11-02 every salon page led with `ai_description` — AI prose written
 * in April that invented specifics nobody checked ("family-run since 2010",
 * "the brothers have mastered…", award claims, what regulars "praise"). Google
 * dropped the site from its index days after those pages were re-crawled
 * (SEO/03_reports/findme-indexing-diagnosis-2026-11-02.md).
 *
 * Every clause here maps to a field:
 *   name, business_type, address_line1/suburb/state/postcode  → public listing
 *   google_hours                                              → listed hours
 *   google_rating, google_review_count                        → Google
 *   phone, website_url, booking_url                           → public listing
 *   top_rated_year                                            → findme.hair's own badge (/top-rated)
 * Deliberately NOT used: ai_description / card_teaser (AI prose), specialties
 * and walk_ins_welcome (keyword matches on the salon's own website text, not
 * verified). Never add a clause without a field behind it.
 */

export interface ListingFacts {
  name: string;
  business_type: string;
  address_line1?: string | null;
  suburb: string;
  state: string;
  postcode?: string | null;
  google_hours?: unknown;
  google_rating?: number | null;
  google_review_count?: number | null;
  phone?: string | null;
  website_url?: string | null;
  booking_url?: string | null;
  top_rated_year?: number | null;
  description?: string | null;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
// Display order Monday → Sunday.
const WEEK = [1, 2, 3, 4, 5, 6, 0];

export interface OpenSpan {
  day: number; // 0 = Sunday
  open: number; // minutes after midnight
  close: number | null; // minutes after midnight on the open day (may exceed 1440); null = no close listed
}

/**
 * Normalise both stored hours formats:
 *  - Places API (New): { periods: [{ open: {day,hour,minute}, close: {...} }], weekdayDescriptions }
 *  - simple map: { Monday: "09:00-17:30", ... } (hyphen or en dash; missing day = closed)
 */
export function normaliseHours(googleHours: unknown): OpenSpan[] {
  if (!googleHours || typeof googleHours !== 'object') return [];
  const h = googleHours as Record<string, unknown>;
  const spans: OpenSpan[] = [];
  if (Array.isArray(h.periods)) {
    for (const p of h.periods as Array<{ open?: { day: number; hour: number; minute?: number }; close?: { day: number; hour: number; minute?: number } }>) {
      if (!p?.open || typeof p.open.day !== 'number') continue;
      const open = p.open.hour * 60 + (p.open.minute ?? 0);
      let close: number | null = null;
      if (p.close && typeof p.close.day === 'number') {
        const dayGap = (p.close.day - p.open.day + 7) % 7;
        close = dayGap * 1440 + p.close.hour * 60 + (p.close.minute ?? 0);
        if (close <= open) close += 1440; // same-day close at/before open = runs past midnight
      }
      spans.push({ day: p.open.day, open, close });
    }
    return spans;
  }
  for (const [key, value] of Object.entries(h)) {
    const day = DAY_NAMES.findIndex((d) => d.toLowerCase() === key.toLowerCase());
    if (day < 0 || typeof value !== 'string') continue;
    for (const m of value.matchAll(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/g)) {
      const open = Number(m[1]) * 60 + Number(m[2]);
      let close = Number(m[3]) * 60 + Number(m[4]);
      if (close <= open) close += 1440;
      spans.push({ day, open, close });
    }
  }
  return spans;
}

function fmtTime(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  if (m === 0) return 'midnight';
  if (m === 720) return 'midday';
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}${mm ? `:${String(mm).padStart(2, '0')}` : ''} ${h24 < 12 ? 'am' : 'pm'}`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function plural(day: number): string {
  return `${DAY_NAMES[day]}s`;
}

/** "seven days a week" / "Monday to Friday" / "six days a week (closed Mondays)" / "on Tuesday, Thursday and Saturday". */
function dayPattern(openDays: Set<number>, short = false): string | null {
  const n = openDays.size;
  if (n === 0) return null;
  const closed = WEEK.filter((d) => !openDays.has(d));
  const names = short ? DAY_SHORT : DAY_NAMES;
  if (n === 7) return short ? '7 days' : 'seven days a week';
  const weekdaysOnly = [1, 2, 3, 4, 5].every((d) => openDays.has(d)) && n === 5;
  if (weekdaysOnly) return short ? 'Mon–Fri' : 'Monday to Friday';
  if (n >= 5) {
    const closedTxt = short ? closed.map((d) => DAY_SHORT[d]).join(' & ') : joinList(closed.map(plural));
    return short ? `${n} days (closed ${closedTxt})` : `${n === 6 ? 'six' : 'five'} days a week (closed ${closedTxt})`;
  }
  const openOrdered = WEEK.filter((d) => openDays.has(d));
  // Consecutive run in Monday→Sunday order (e.g. Tue–Fri) reads as a range.
  const first = WEEK.indexOf(openOrdered[0]);
  const consecutive = n > 2 && openOrdered.every((d, i) => WEEK.indexOf(d) === first + i);
  if (consecutive) {
    const a = openOrdered[0];
    const z = openOrdered[n - 1];
    return short ? `${DAY_SHORT[a]}–${DAY_SHORT[z]}` : `${DAY_NAMES[a]} to ${DAY_NAMES[z]}`;
  }
  const open = openOrdered.map((d) => names[d]);
  return short ? open.join(', ') : joinList(open);
}

export interface HoursSummary {
  openDays: Set<number>;
  sentence: string | null; // full sentence for the About section
  short: string | null; // compact form for cards / meta
}

export function summariseHours(googleHours: unknown): HoursSummary {
  const spans = normaliseHours(googleHours);
  const openDays = new Set(spans.map((s) => s.day));
  const pattern = dayPattern(openDays);
  if (!pattern) return { openDays, sentence: null, short: null };

  const extras: string[] = [];
  const shortExtras: string[] = [];
  const closing = spans.filter((s) => s.close != null) as Array<OpenSpan & { close: number }>;
  // Late opening: latest listed close at or after 7 pm.
  if (closing.length) {
    const latest = Math.max(...closing.map((s) => s.close));
    if (latest >= 19 * 60 && latest < 1440 + 6 * 60) {
      const days = WEEK.filter((d) => closing.some((s) => s.day === d && s.close === latest));
      const when = days.length <= 2 ? `on ${joinList(days.map(plural))}` : `on ${NUMBER_WORDS[days.length]} evenings a week`;
      extras.push(`until ${fmtTime(latest)} ${when}`);
      shortExtras.push(`late ${days.length <= 2 ? days.map((d) => DAY_SHORT[d]).join(' & ') : `${days.length} nights`}`);
    }
  }
  // Early start: earliest listed opening at or before 8 am.
  if (spans.length) {
    const earliest = Math.min(...spans.map((s) => s.open));
    if (earliest <= 8 * 60) {
      const days = WEEK.filter((d) => spans.some((s) => s.day === d && s.open === earliest));
      const when = days.length <= 2 ? `on ${joinList(days.map(plural))}` : `on ${NUMBER_WORDS[days.length]} days`;
      extras.push(`from ${fmtTime(earliest)} ${when}`);
    }
  }
  // "seven days a week" / "six days a week (…)" / "Monday to Friday" read as hours;
  // a short list of days reads as opening days.
  const lead = openDays.size >= 5 || /\bto\b/.test(pattern) ? 'Its listed hours are' : 'Its listed opening days are';
  const sentence = `${lead} ${pattern}${extras.length ? `, ${joinList(extras)}` : ''}.`;
  const short = `Open ${dayPattern(openDays, true)}${shortExtras.length ? `, ${shortExtras.join(', ')}` : ''}`;
  return { openDays, sentence, short };
}

function typeNoun(t: string): string {
  return formatBusinessType(t).toLowerCase();
}

/** Street part of the address, or null when address_line1 holds only the suburb/state/postcode. */
function streetPart(b: ListingFacts): string | null {
  const a = (b.address_line1 ?? '').trim().replace(/,?\s*Australia\s*$/i, '');
  // Never print internal notes that ended up in the address field ("TBC", brackets, "home-based").
  if (!a || /\bTBC\b|[()]|home[- ]?based/i.test(a)) return null;
  const locality = new RegExp(`(,?\\s*${b.suburb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})?(,?\\s*${b.state})?(\\s*\\d{4})?\\s*$`, 'i');
  const street = a.replace(locality, '').replace(/,\s*$/, '').trim();
  return street.length > 0 && street.toLowerCase() !== b.suburb.toLowerCase() ? street : null;
}

function placeLine(b: ListingFacts): string {
  const street = streetPart(b);
  const where = [b.suburb, `${b.state}${b.postcode ? ` ${b.postcode}` : ''}`].join(' ');
  return street ? `${street}, ${where}` : `${b.suburb}, ${stateName(b.state as AuState)}`;
}

// Every noun here (hair salon, barber shop, unisex salon) takes "a" — "unisex" starts with a "you" sound.
const article = (word: string) => (/^(a|e|i|o)/i.test(word) ? 'an' : 'a');

/** Paragraphs for the "About" section. */
export function buildAboutParagraphs(b: ListingFacts): string[] {
  const noun = typeNoun(b.business_type);
  const first: string[] = [
    streetPart(b)
      ? `${b.name} is ${article(noun)} ${noun} at ${placeLine(b)}.`
      : `${b.name} is ${article(noun)} ${noun} in ${b.suburb}, ${stateName(b.state as AuState)}.`,
  ];
  const hours = summariseHours(b.google_hours);
  if (hours.sentence) first.push(hours.sentence);
  if (b.booking_url && b.phone) first.push(`You can book online with the Book Now button or call ${b.phone}.`);
  else if (b.booking_url) first.push('You can book online with the Book Now button on this page.');
  else if (b.phone) first.push(`To book, call ${b.phone}${b.website_url ? ' or check its website, linked on this page' : ''}.`);
  else if (b.website_url) first.push('Its website is linked on this page.');

  const second: string[] = [];
  if (b.top_rated_year) {
    second.push(`It holds a findme.hair Top Rated ${b.top_rated_year} badge, given to the top 10% of Australian salons and barbers by weighted Google rating.`);
  }
  second.push(
    `Address, opening hours and contact details come from the business's public listing${
      b.google_review_count ? ', and the rating and review count from Google' : ''
    }. If anything here is out of date, the owner can claim this listing and correct it.`,
  );
  return [first.join(' '), second.join(' ')];
}

/** One plain sentence for JSON-LD `description`. */
export function buildSchemaDescription(b: ListingFacts): string {
  const manual = stripMarkdown(b.description);
  if (manual) return manual;
  return buildAboutParagraphs(b)[0];
}

/** Meta description, ≤155 chars, most useful facts first. */
export function buildMetaDescription(b: ListingFacts): string {
  const noun = typeNoun(b.business_type);
  const parts = [`${b.name}: ${noun} ${streetPart(b) ? 'at' : 'in'} ${placeLine(b)}.`];
  if (b.google_rating != null && (b.google_review_count ?? 0) >= 5) {
    parts.push(`${b.google_rating.toFixed(1)}★ from ${b.google_review_count} Google reviews.`);
  }
  const hours = summariseHours(b.google_hours);
  if (hours.short) parts.push(`${hours.short}.`);
  parts.push('Hours, phone and directions.');
  let out = '';
  for (const p of parts) {
    const next = out ? `${out} ${p}` : p;
    if (next.length > 155) break;
    out = next;
  }
  return out || `${b.name}: ${noun} in ${b.suburb}, ${stateName(b.state as AuState)}.`.slice(0, 155);
}

/** Short factual teaser for listing cards (replaces the AI `card_teaser`). */
export function buildCardTeaser(b: ListingFacts): string | null {
  const hours = summariseHours(b.google_hours);
  const noun = formatBusinessType(b.business_type);
  const street = streetPart(b);
  const where = street ? `${noun} at ${street}` : `${noun} in ${b.suburb}`;
  return hours.short ? `${where}. ${hours.short}.` : `${where}.`;
}
