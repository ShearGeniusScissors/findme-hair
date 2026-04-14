#!/usr/bin/env node
/**
 * National Content Enrichment for findme.hair
 *
 * Processes ALL businesses without ai_description, state by state.
 * Generates AI descriptions, detects walk-ins, specialties, and NOT_HAIR exclusions.
 *
 * Usage: node scripts/enrich-national.js [state] [--resume]
 *   state: VIC, NSW, QLD, WA, SA, TAS, ACT, NT (default: all in order)
 *   --resume: skip businesses already processed today
 *
 * Examples:
 *   node scripts/enrich-national.js VIC
 *   node scripts/enrich-national.js          # all states
 *   node scripts/enrich-national.js NSW --resume
 */

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing SUPABASE env'); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1); }

let supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  global: { fetch: (...args) => fetch(...args) },
});
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

const LOG_FILE = '/tmp/enrich-national.log';

// Retry wrapper for Supabase queries — handles fetch failures
async function supabaseQuery(fn, label, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      // Check if Supabase returned an error object (vs thrown error)
      if (result && result.error) {
        throw new Error(result.error.message || JSON.stringify(result.error));
      }
      return result;
    } catch (err) {
      if (attempt === retries) {
        log(`  FAILED after ${retries} retries for ${label}: ${err.message}`);
        return { data: null, error: { message: err.message } };
      }
      log(`  Retry ${attempt}/${retries} for ${label}: ${err.message}`);
      // Recreate client on connection failure
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
        global: { fetch: (...args) => fetch(...args) },
      });
      await sleep(3000 * attempt);
    }
  }
}

const STATE_ORDER = ['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

// ─── NOT_HAIR detection ──────────────────────────────
const NOT_HAIR_PRIMARY = [
  /\bnail salon\b/i, /\bnail bar\b/i, /\bnails? only\b/i,
  /\bbeauty salon\b(?!.*hair)/i, /\bday spa\b/i, /\bmedical spa\b/i, /\bmed ?spa\b/i,
  /\bmassage therap/i, /\bmassage studio\b/i, /\bmassage centre\b/i,
  /\btattoo/i, /\bpiercing studio\b/i,
  /\bskin clinic\b/i, /\bdermal clinic\b/i, /\bcosmetic clinic\b/i,
  /\blaser clinic\b/i, /\blaser hair removal\b/i,
  /\bwaxing studio\b/i, /\bwaxing salon\b/i,
  /\bbrow bar\b/i, /\blash studio\b/i, /\blash bar\b/i,
  /\bdog groom/i, /\bpet groom/i,
];

function isNotHairBusiness(business, websiteText) {
  const corpus = [business.name, websiteText || '', business.scraped_about || ''].join(' ');
  const nameOnly = business.name.toLowerCase();
  // Check name for strong NOT_HAIR signals
  for (const p of NOT_HAIR_PRIMARY) {
    if (p.test(nameOnly)) return true;
  }
  // Check full corpus but only if NO hair keywords present
  const hasHairKeyword = /\bhair/i.test(corpus) || /\bbarber/i.test(corpus) ||
    /\bsalon\b/i.test(corpus) || /\bstylist/i.test(corpus) || /\bhairdress/i.test(corpus) ||
    /\bcolou?r\b/i.test(corpus) || /\bcut and\b/i.test(corpus) || /\bblowdr/i.test(corpus);
  if (!hasHairKeyword) {
    for (const p of NOT_HAIR_PRIMARY) {
      if (p.test(corpus)) return true;
    }
  }
  return false;
}

// ─── Walk-ins detection ──────────────────────────────
const WALKINS_RE = [/walk.?in/i, /no appointment/i, /no booking required/i, /drop.?in/i, /come on in/i, /accept walk/i];
const APPT_RE = [/appointment only/i, /by appointment/i, /bookings? essential/i, /booking required/i, /booking only/i, /please book/i];

function detectWalkIns(text) {
  for (const p of WALKINS_RE) if (p.test(text)) return true;
  for (const p of APPT_RE) if (p.test(text)) return false;
  return null;
}

// ─── Specialty detection ─────────────────────────────
const SPECIALTY_PATTERNS = [
  { tag: 'balayage', patterns: [/balayage/i, /foilayage/i] },
  { tag: 'curly-hair', patterns: [/curly/i, /curl\b/i, /natural hair/i, /textured hair/i] },
  { tag: 'colour-specialist', patterns: [/colou?r/i, /highlight/i, /toning/i, /ombre/i, /vivid/i] },
  { tag: 'extensions', patterns: [/extension/i, /tape.?in/i, /weft/i] },
  { tag: 'barber', patterns: [/barber/i, /fade/i, /clipper/i] },
  { tag: 'kids', patterns: [/kids?/i, /child/i, /family/i] },
  { tag: 'bridal', patterns: [/bridal/i, /wedding/i, /bride/i] },
  { tag: 'mens', patterns: [/men'?s/i, /gents?/i, /\bmale\b/i] },
  { tag: 'japanese', patterns: [/japanese/i, /rebonding/i, /straightening/i] },
  { tag: 'korean', patterns: [/korean/i, /k.?beauty/i] },
  { tag: 'organic', patterns: [/organic/i, /chemical.?free/i, /natural product/i, /vegan/i] },
  { tag: 'mobile', patterns: [/mobile/i, /home visit/i, /at.?home/i] },
  { tag: 'afro', patterns: [/afro/i, /african hair/i, /\blocs?\b/i, /dreadlock/i, /textured.?hair/i] },
  { tag: 'colour-correction', patterns: [/colou?r.?correction/i] },
  { tag: 'keratin', patterns: [/keratin/i, /smoothing treatment/i] },
  { tag: 'highlights', patterns: [/highlight/i, /lowlight/i, /foil/i] },
  { tag: 'blow-dry', patterns: [/blow.?dry/i, /blowout/i] },
  { tag: 'wigs', patterns: [/\bwigs?\b/i, /topper/i, /hair piece/i, /hairpiece/i] },
];

function detectSpecialties(business, corpus) {
  const specialties = new Set();
  if (business.business_type === 'barber') specialties.add('barber');
  for (const { tag, patterns } of SPECIALTY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(corpus)) { specialties.add(tag); break; }
    }
  }
  return [...specialties];
}

// ─── Scrape website ──────────────────────────────────
async function scrapeWebsite(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'findme.hair-bot/1.0 (+https://www.findme.hair)', Accept: 'text/html' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;

    const finalUrl = resp.url;
    const html = await resp.text();
    const $ = cheerio.load(html);

    if (finalUrl.includes('fresha.com') || finalUrl.includes('fresha.co')) {
      const about = $('[data-testid="about-text"], .about-text, p').first().text().trim().slice(0, 1500);
      const services = [];
      $('[data-testid="service-name"], .service-name, .service-item h3').each((_, el) => {
        const name = $(el).text().trim();
        if (name && name.length < 100) services.push(name);
      });
      return { text: about, services, source: 'fresha' };
    }
    if (finalUrl.includes('facebook.com')) {
      return { text: $('meta[name="description"]').attr('content') || '', services: [], source: 'facebook' };
    }
    if (finalUrl.includes('instagram.com')) {
      return { text: $('meta[property="og:description"]').attr('content') || '', services: [], source: 'instagram' };
    }

    $('script, style, noscript, nav, footer, header').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000);
    const metaDesc = $('meta[name="description"]').attr('content') || '';

    const services = [];
    const sels = [
      '[class*="service"] li', '[id*="service"] li',
      '[class*="treatment"] li', '[id*="treatment"] li',
      '[class*="pricing"] li', '[id*="pricing"] li',
      '[class*="service"] h3', '[class*="service"] h4',
    ];
    for (const sel of sels) {
      $(sel).each((_, el) => {
        const name = $(el).text().trim().split('\n')[0].trim();
        if (name && name.length > 2 && name.length < 100) services.push(name);
      });
      if (services.length > 0) break;
    }

    return { text: [metaDesc, bodyText].join('\n\n'), services: [...new Set(services)].slice(0, 30), source: 'website' };
  } catch { return null; }
}

// ─── Fetch Google reviews ────────────────────────────
async function fetchGoogleReviews(placeId) {
  if (!placeId || !GOOGLE_API_KEY) return [];
  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews&key=${GOOGLE_API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.reviews || []).map(r => r.text?.text || '').filter(Boolean).slice(0, 5);
  } catch { return []; }
}

// ─── Generate description ────────────────────────────
async function generateDescription(business, websiteContent, reviews) {
  const typeLabel = { hair_salon: 'hair salon', barber: 'barber shop', unisex: 'unisex salon' }[business.business_type] || 'hair salon';

  const websiteText = websiteContent?.text || business.scraped_about || 'not available';
  const servicesText = websiteContent?.services?.length > 0
    ? websiteContent.services.join(', ')
    : (business.scraped_services || []).join(', ') || 'not available';
  const reviewsText = reviews.length > 0
    ? reviews.map((r, i) => `Review ${i + 1}: "${r}"`).join('\n')
    : 'not available';
  const contentSource = websiteContent?.source || business.content_source || 'minimal';

  const toneGuide = {
    barber: 'masculine, direct, no-nonsense — write like a barber talks',
    hair_salon: 'warm and professional — match to suburb vibe (suburban = friendly, city = polished)',
    unisex: 'inclusive and welcoming — covers everyone',
  }[business.business_type] || 'warm and professional';

  const prompt = `Write a rich directory listing description for this Australian ${typeLabel}.

BUSINESS:
Name: ${business.name}
Type: ${business.business_type}
Location: ${business.suburb}, ${business.state} ${business.postcode}
Content source: ${contentSource}

WEBSITE CONTENT:
${websiteText.slice(0, 3000)}

SERVICES FOUND:
${servicesText}

GOOGLE REVIEWS:
${reviewsText.slice(0, 2000)}

Walk-ins: ${business.walk_ins_welcome === true ? 'Yes' : business.walk_ins_welcome === false ? 'No, appointment only' : 'Unknown'}

TONE: ${toneGuide}

RULES:
- Do NOT mention Google ratings, star ratings, or review scores
- Write as much as the content deserves — if rich content, write 150-250 words. If sparse, write 40-80 words
- Australian English always
- Never fabricate services, prices, products, team members, or claims not in the data
- Match tone to business type and suburb character
- If barber: masculine, direct language. If premium salon: polished. If family/kids: warm, approachable
- Cover these where found: specialties, vibe, who they cater to, experience, products, price range, booking method, parking, team size, point of difference
- Use real customer insights from reviews where available (don't quote directly, synthesise)
- Do NOT end with a generic claim CTA unless content is genuinely sparse
- Do NOT start with "Located in..." — vary your opening
- Each description must feel unique, not templated`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: 'You write directory listing descriptions for findme.hair, Australia\'s hair salon and barber directory. Your descriptions help people find the right salon. Every description must be factual, unique, and genuinely useful. Never fabricate.',
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0]?.text?.trim() || null;
  } catch (err) {
    log(`  AI error: ${err.message}`);
    return null;
  }
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Process single business ─────────────────────────
async function processBusiness(business) {
  // Scrape website
  let websiteContent = null;
  if (business.website_url) {
    websiteContent = await scrapeWebsite(business.website_url);
    if (websiteContent) {
      log(`  Scraped → ${websiteContent.source} (${websiteContent.text.length} chars)`);
    }
  }

  // NOT_HAIR check
  const webText = websiteContent?.text || '';
  if (isNotHairBusiness(business, webText)) {
    log(`  ⚠ NOT_HAIR excluded: ${business.name}`);
    await supabaseQuery(() => supabase.from('businesses').update({ status: 'excluded' }).eq('id', business.id), 'exclude update');
    return { result: 'excluded' };
  }

  // Fetch Google reviews if no rich website content
  let reviews = [];
  if ((!websiteContent || websiteContent.text.length < 100) && business.google_place_id) {
    reviews = await fetchGoogleReviews(business.google_place_id);
    if (reviews.length > 0) log(`  Got ${reviews.length} Google reviews`);
  }

  // Generate description
  const aiDescription = await generateDescription(business, websiteContent, reviews);
  if (!aiDescription) { log(`  SKIP: no description generated`); return { result: 'skip' }; }

  // Detect specialties from all content
  const allText = [
    webText, business.scraped_about || '',
    (websiteContent?.services || []).join(' '), aiDescription,
    business.name || '', reviews.join(' '),
  ].join(' ');
  const specialties = detectSpecialties(business, allText);
  const walkIns = detectWalkIns(allText);

  const update = {
    ai_description: aiDescription,
    specialties: specialties.length > 0 ? specialties : null,
    content_generated_at: new Date().toISOString(),
  };
  if (walkIns !== null && business.walk_ins_welcome === null) {
    update.walk_ins_welcome = walkIns;
    update.walk_ins_source = 'scraped';
  }

  await supabaseQuery(() => supabase.from('businesses').update(update).eq('id', business.id), 'business update');
  return { result: 'ok', walkIns, specialties };
}

// ─── Process a region ────────────────────────────────
async function processRegion(region, regionBusinesses) {
  log(`\n  ── Region: ${region.name} (${regionBusinesses.length} businesses) ──`);

  let enriched = 0, excluded = 0, skipped = 0;
  let walkInsYes = 0, walkInsNo = 0;
  const specialtyCounts = {};

  for (let i = 0; i < regionBusinesses.length; i++) {
    const biz = regionBusinesses[i];
    log(`  [${i + 1}/${regionBusinesses.length}] ${biz.name} (${biz.suburb})`);

    try {
      const { result, walkIns, specialties } = await processBusiness(biz);
      if (result === 'ok') {
        enriched++;
        if (walkIns === true) walkInsYes++;
        if (walkIns === false) walkInsNo++;
        if (specialties) {
          for (const s of specialties) specialtyCounts[s] = (specialtyCounts[s] || 0) + 1;
        }
      } else if (result === 'excluded') {
        excluded++;
      } else {
        skipped++;
      }
    } catch (err) {
      log(`  ERROR: ${err.message}`);
      skipped++;
    }

    // Rate limiting
    if (biz.website_url) await sleep(2000);
    else await sleep(300);
  }

  return { enriched, excluded, skipped, walkInsYes, walkInsNo, specialtyCounts };
}

// ─── Process a state ─────────────────────────────────
async function processState(state, resume) {
  log(`\n${'═'.repeat(60)}`);
  log(`STATE: ${state}`);
  log(`${'═'.repeat(60)}`);

  // Get all regions in this state with unenriched businesses
  const { data: regions } = await supabaseQuery(
    () => supabase.from('regions').select('id, name, slug').eq('state', state).order('name'),
    `regions for ${state}`
  );

  if (!regions || regions.length === 0) {
    log(`  No regions found for ${state}`);
    return null;
  }

  let totalEnriched = 0, totalExcluded = 0, totalSkipped = 0;
  let totalWalkInsYes = 0, totalWalkInsNo = 0;
  const totalSpecialties = {};

  for (const region of regions) {
    // Query businesses without ai_description in this region
    // Supabase limits to 1000 per query, so we paginate
    let allBusinesses = [];
    let offset = 0;
    const pageSize = 500;
    while (true) {
      try {
        const { data, error } = await supabaseQuery(
          () => supabase
            .from('businesses')
            .select('*')
            .eq('status', 'active')
            .eq('region_id', region.id)
            .is('ai_description', null)
            .order('google_rating', { ascending: false, nullsFirst: false })
            .range(offset, offset + pageSize - 1),
          `businesses in ${region.name}`
        );
        if (error) { log(`  ERROR querying ${region.name}: ${error.message}`); break; }
        if (!data || data.length === 0) break;
        allBusinesses = allBusinesses.concat(data);
        if (data.length < pageSize) break;
        offset += pageSize;
      } catch (err) {
        log(`  ERROR querying ${region.name}: ${err.message}`);
        break;
      }
    }

    if (allBusinesses.length === 0) continue;

    // If resume mode, filter out businesses already done today
    if (resume) {
      const today = new Date().toISOString().slice(0, 10);
      allBusinesses = allBusinesses.filter(b => !b.content_generated_at || !b.content_generated_at.startsWith(today));
      if (allBusinesses.length === 0) continue;
    }

    const result = await processRegion(region, allBusinesses);
    totalEnriched += result.enriched;
    totalExcluded += result.excluded;
    totalSkipped += result.skipped;
    totalWalkInsYes += result.walkInsYes;
    totalWalkInsNo += result.walkInsNo;
    for (const [s, c] of Object.entries(result.specialtyCounts)) {
      totalSpecialties[s] = (totalSpecialties[s] || 0) + c;
    }
  }

  // State summary
  log(`\n${'─'.repeat(60)}`);
  log(`${state} COMPLETE`);
  log(`  Enriched: ${totalEnriched}`);
  log(`  Excluded (NOT_HAIR): ${totalExcluded}`);
  log(`  Skipped: ${totalSkipped}`);
  log(`  Walk-ins yes: ${totalWalkInsYes} | Walk-ins no: ${totalWalkInsNo}`);
  log(`  Specialties: ${JSON.stringify(totalSpecialties)}`);
  log(`${'─'.repeat(60)}`);

  return {
    state,
    enriched: totalEnriched,
    excluded: totalExcluded,
    skipped: totalSkipped,
    walkInsYes: totalWalkInsYes,
    walkInsNo: totalWalkInsNo,
    specialties: totalSpecialties,
  };
}

// ─── Git commit after each state ─────────────────────
function gitCommitState(state) {
  try {
    const cwd = path.join(__dirname, '..');
    execSync('git add -A', { cwd });
    execSync(`git commit --allow-empty -m "content: enrichment ${state} complete\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"`, { cwd });
    execSync('git push origin main', { cwd });
    log(`  Git: committed and pushed for ${state}`);
  } catch (err) {
    log(`  Git warning: ${err.message}`);
  }
}

// ─── Main ────────────────────────────────────────────
async function main() {
  log('\n' + '═'.repeat(60));
  log('findme.hair — National Content Enrichment');
  log('═'.repeat(60));

  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const resume = process.argv.includes('--resume');
  const statesToProcess = args.length > 0 ? args.map(s => s.toUpperCase()) : STATE_ORDER;

  log(`States: ${statesToProcess.join(', ')}${resume ? ' (resume mode)' : ''}`);

  const allResults = [];

  for (const state of statesToProcess) {
    const result = await processState(state, resume);
    if (result) {
      allResults.push(result);
      gitCommitState(state);
    }
  }

  // Final national report
  log('\n' + '═'.repeat(60));
  log('NATIONAL FINAL REPORT');
  log('═'.repeat(60));

  let grandEnriched = 0, grandExcluded = 0, grandSkipped = 0;
  let grandWalkInsYes = 0, grandWalkInsNo = 0;
  const grandSpecialties = {};

  for (const r of allResults) {
    log(`${r.state.padEnd(6)} Enriched: ${String(r.enriched).padStart(5)} | Excluded: ${String(r.excluded).padStart(3)} | Walk-ins: ${r.walkInsYes}Y/${r.walkInsNo}N`);
    grandEnriched += r.enriched;
    grandExcluded += r.excluded;
    grandSkipped += r.skipped;
    grandWalkInsYes += r.walkInsYes;
    grandWalkInsNo += r.walkInsNo;
    for (const [s, c] of Object.entries(r.specialties)) {
      grandSpecialties[s] = (grandSpecialties[s] || 0) + c;
    }
  }

  log(`\nTOTAL ENRICHED: ${grandEnriched}`);
  log(`TOTAL EXCLUDED: ${grandExcluded}`);
  log(`TOTAL SKIPPED: ${grandSkipped}`);
  log(`WALK-INS: ${grandWalkInsYes} yes / ${grandWalkInsNo} no`);
  log(`\nSPECIALTIES (businesses with 10+):`);
  const sorted = Object.entries(grandSpecialties).sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sorted) {
    if (count >= 10) log(`  ${tag}: ${count}`);
  }
  log(`\nCompleted at ${new Date().toISOString()}`);
}

main().catch(err => { log(`FATAL: ${err.message}`); console.error(err); process.exit(1); });
