#!/usr/bin/env node
/**
 * Fix Enrichment Gaps
 *
 * Two passes:
 *   Pass 1 — Enrich businesses with ai_description IS NULL (never processed)
 *   Pass 2 — Re-scrape businesses with content_source='google_data' that have a website_url
 *
 * Queries by region_id so no business is missed due to suburb-name mismatches.
 *
 * Usage: node scripts/fix-enrichment-gaps.js
 */

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing SUPABASE env'); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

const LOG_FILE = '/tmp/fix-enrichment-gaps.log';

// All region slugs belonging to the 9 enriched territories
const REGION_SLUGS = [
  // Ballarat
  'ballarat', 'ballarat-cbd', 'ballarat-east', 'ballarat-surrounds', 'alfredton', 'wendouree',
  // Geelong
  'geelong', 'geelong-surrounds',
  // Melbourne West
  'melbourne-west', 'melton', 'caroline-springs', 'bacchus-marsh',
  // Tasmania
  'hobart', 'launceston', 'burnie', 'devonport',
  // Horsham & Maryborough
  'horsham', 'maryborough-vic', 'castlemaine', 'kyneton', 'daylesford',
  // Mildura
  'mildura',
  // Warrnambool & Mt Gambier
  'warrnambool', 'mount-gambier', 'portland', 'hamilton', 'colac',
  // Bendigo
  'bendigo',
  // Sunbury
  'sunbury', 'gisborne',
];

// ─── Patterns (copied from enrich-content.js) ────────
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

const NOT_HAIR_PATTERNS = [
  /\bnails?\b/i, /\bmanicure\b/i, /\bpedicure\b/i, /\bgel nails\b/i,
  /\blash(es)?\b/i, /\bbrow(s)?\b/i, /\bwaxing\b/i, /\bmassage\b/i,
  /\bfacial(s)?\b/i, /\bskin\b/i, /\bbeauty therap/i, /\bday spa\b/i,
  /\btattoo\b/i, /\bpiercing\b/i, /\bcosmetic\b/i, /\bbotox\b/i,
  /\binjectable/i, /\blaser\b/i, /\bmicroderm/i, /\bdermal/i,
];

// ─── Helpers ──────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Scraping ─────────────────────────────────────────
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

    const isFresha = finalUrl.includes('fresha.com') || finalUrl.includes('fresha.co');
    const isFacebook = finalUrl.includes('facebook.com');
    const isInstagram = finalUrl.includes('instagram.com');

    let aboutText = '';
    let services = [];

    if (isFresha) {
      aboutText = $('[data-testid="about-text"], .about-text, p').first().text().trim().slice(0, 1000);
      $('[data-testid="service-name"], .service-name, .service-item h3, .service-item h4').each((_, el) => {
        const name = $(el).text().trim();
        if (name && name.length < 100) services.push(name);
      });
    } else if (isFacebook) {
      aboutText = $('meta[name="description"]').attr('content') || '';
    } else if (isInstagram) {
      aboutText = $('meta[property="og:description"]').attr('content') || '';
    } else {
      const metaDesc = $('meta[name="description"]').attr('content') || '';
      const aboutSelectors = [
        '[class*="about"]', '[id*="about"]', '[class*="story"]', '[id*="story"]',
        '[class*="team"]', '[id*="team"]', '[class*="philosophy"]', '[id*="philosophy"]',
        '[class*="welcome"]', '[id*="welcome"]',
      ];
      for (const sel of aboutSelectors) {
        const text = $(sel).text().trim();
        if (text && text.length > 30 && text.length < 2000) { aboutText = text.slice(0, 1000); break; }
      }
      if (!aboutText) aboutText = metaDesc || $('main p, .content p, article p').first().text().trim().slice(0, 500);

      const serviceSelectors = [
        '[class*="service"] li', '[id*="service"] li', '[class*="treatment"] li', '[id*="treatment"] li',
        '[class*="menu"] li', '[id*="menu"] li', '[class*="pricing"] li', '[id*="pricing"] li',
        '[class*="service"] h3', '[class*="service"] h4', '[class*="treatment"] h3', '[class*="treatment"] h4',
      ];
      for (const sel of serviceSelectors) {
        $(sel).each((_, el) => {
          const name = $(el).text().trim().split('\n')[0].trim();
          if (name && name.length > 2 && name.length < 100) services.push(name);
        });
        if (services.length > 0) break;
      }
    }

    services = [...new Set(services)].slice(0, 30);
    const fullPageText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);

    return {
      aboutText: aboutText.replace(/\s+/g, ' ').trim().slice(0, 1000) || null,
      services: services.length > 0 ? services : null,
      source: isFresha ? 'fresha' : isFacebook ? 'facebook' : isInstagram ? 'instagram' : 'website',
      fullPageText,
    };
  } catch { return null; }
}

// ─── Classification ───────────────────────────────────
function classifyBusinessType(business, scrapedAbout, scrapedServices, fullPageText) {
  const corpus = [scrapedAbout || '', (scrapedServices || []).join(' '), fullPageText || '', business.name || ''].join(' ');
  const hairSignals = [/\bhair/i,/\bsalon\b/i,/\bbarber/i,/\bhairdress/i,/\bhaircut/i,/\bcolou?r\b/i,/\bstyl(e|ing|ist)/i,/\bbalayage/i,/\bfoil/i,/\bblowdr/i,/\btrim\b/i,/\bfade\b/i,/\bbeard/i,/\bshave\b/i,/\bcurl/i,/\bextension/i,/\bkeratin/i,/\btoner\b/i,/\bperm\b/i];
  let hairCount = 0;
  for (const p of hairSignals) if (p.test(corpus)) hairCount++;
  let notHairCount = 0;
  const notHairReasons = [];
  for (const p of NOT_HAIR_PATTERNS) { if (p.test(corpus)) { notHairCount++; notHairReasons.push(p.source.replace(/\\b/g, '').replace(/[()]/g, '')); } }
  if (notHairCount >= 3 && hairCount <= 1) return { isHair: false, reason: `primarily ${notHairReasons.slice(0,3).join(', ')}` };

  const nameLower = business.name.toLowerCase();
  const nameNotHair = [/\bnail/i,/\bbeauty\b/i,/\blash/i,/\bspa\b/i,/\bskin\b/i,/\btattoo/i,/\bpiercing/i,/\bcosmetic/i,/\bmassage/i];
  let nameNotHairCount = 0;
  for (const p of nameNotHair) if (p.test(nameLower)) nameNotHairCount++;
  const nameHair = [/hair/i,/barber/i,/salon/i,/styl/i,/cut/i];
  let nameHairCount = 0;
  for (const p of nameHair) if (p.test(nameLower)) nameHairCount++;
  if (nameNotHairCount >= 1 && nameHairCount === 0 && !scrapedAbout && !scrapedServices)
    return { isHair: false, reason: `name suggests non-hair: "${business.name}"`, uncertain: true };

  return { isHair: true };
}

// ─── AI Description ───────────────────────────────────
async function generateDescription(business, scrapedAbout, scrapedServices) {
  const servicesStr = scrapedServices?.length > 0 ? scrapedServices.join(', ') : 'not available';
  const aboutStr = scrapedAbout || 'not available';
  const typeLabel = { hair_salon: 'hair salon', barber: 'barber shop', unisex: 'unisex salon' }[business.business_type] || 'hair salon';

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: 'You are writing directory listing descriptions for findme.hair, Australia\'s hair salon and barber directory. Write concise, factual, unique descriptions that help people find the right salon. Never fabricate services or claims not supported by the data provided. Focus on what makes this salon unique.',
      messages: [{ role: 'user', content: `Write a 2-3 sentence description for this Australian ${typeLabel} for a directory listing.

Business name: ${business.name}
Type: ${business.business_type}
Location: ${business.suburb}, ${business.state}
Google rating: ${business.google_rating ?? 'not available'} from ${business.google_review_count ?? 0} reviews
Website about text: ${aboutStr}
Services found: ${servicesStr}

Requirements:
- Mention location naturally
- Mention any genuine specialties found
- If high rated (4.5+) mention reputation
- If barber shop, use barber language
- 2-3 sentences max
- Australian English
- Do not invent services not in the data` }],
    });
    return response.content[0]?.text?.trim() || null;
  } catch (err) { log(`  AI error for ${business.name}: ${err.message}`); return null; }
}

// ─── Specialty Detection ──────────────────────────────
function detectSpecialties(business, scrapedAbout, scrapedServices, aiDescription) {
  const specialties = new Set();
  if (business.business_type === 'barber') specialties.add('barber');
  const corpus = [scrapedAbout || '', (scrapedServices || []).join(' '), aiDescription || '', business.name || '', business.description || ''].join(' ').toLowerCase();
  for (const { tag, patterns } of SPECIALTY_PATTERNS) {
    for (const pattern of patterns) { if (pattern.test(corpus)) { specialties.add(tag); break; } }
  }
  return [...specialties];
}

// ─── Process single business ──────────────────────────
async function processBusiness(business, mode) {
  let scrapedAbout = business.scraped_about || null;
  let scrapedServices = business.scraped_services || null;
  let contentSource = business.content_source || 'minimal';
  let fullPageText = null;

  // Scrape website if: (a) never scraped, or (b) re-scrape mode for missed websites
  const shouldScrape = business.website_url && (mode === 'not_enriched' || mode === 'missed_website');

  if (shouldScrape) {
    const scraped = await scrapeWebsite(business.website_url);
    if (scraped) {
      scrapedAbout = scraped.aboutText;
      scrapedServices = scraped.services;
      contentSource = scraped.source;
      fullPageText = scraped.fullPageText;
      log(`  Scraped ${business.name} → ${scraped.source} (about: ${scrapedAbout?.length || 0} chars, services: ${scrapedServices?.length || 0})`);
    } else {
      log(`  Scrape failed for ${business.name} (${business.website_url})`);
      if (mode === 'not_enriched') {
        contentSource = business.google_rating ? 'google_data' : 'minimal';
      }
      // For missed_website mode, keep existing content_source if scrape fails
      if (mode === 'missed_website') return { changed: false };
    }
  } else if (!business.website_url && mode === 'not_enriched') {
    contentSource = business.google_rating ? 'google_data' : 'minimal';
  }

  // Business type verification
  const classification = classifyBusinessType(business, scrapedAbout, scrapedServices, fullPageText);
  if (!classification.isHair) {
    if (classification.uncertain) {
      const flags = business.verification_flags || [];
      if (!flags.includes('needs_manual_review')) flags.push('needs_manual_review');
      await supabase.from('businesses').update({ verification_flags: flags, scraped_at: new Date().toISOString() }).eq('id', business.id);
      log(`  ⚠ FLAGGED: ${business.name} — ${classification.reason}`);
      return { changed: true, excluded: false, flagged: true, contentSource };
    } else {
      const flags = business.verification_flags || [];
      if (!flags.includes('excluded_not_hair')) flags.push('excluded_not_hair');
      await supabase.from('businesses').update({ status: 'excluded', verification_flags: flags, scraped_at: new Date().toISOString() }).eq('id', business.id);
      log(`  ✗ EXCLUDED: ${business.name} — ${classification.reason}`);
      return { changed: true, excluded: true, flagged: false, contentSource };
    }
  }

  // Generate AI description
  const aiDescription = await generateDescription(business, scrapedAbout, scrapedServices);
  const specialties = detectSpecialties(business, scrapedAbout, scrapedServices, aiDescription);

  await supabase.from('businesses').update({
    scraped_about: scrapedAbout,
    scraped_services: scrapedServices,
    scraped_at: new Date().toISOString(),
    content_source: contentSource,
    ai_description: aiDescription,
    specialties: specialties.length > 0 ? specialties : null,
    content_generated_at: new Date().toISOString(),
  }).eq('id', business.id);

  return { changed: true, excluded: false, flagged: false, contentSource, hasAi: !!aiDescription, specialties };
}

// ─── Main ─────────────────────────────────────────────
async function main() {
  log('\n' + '╔' + '═'.repeat(50) + '╗');
  log('║  Fix Enrichment Gaps                             ║');
  log('╚' + '═'.repeat(50) + '╝');

  // Get region IDs
  const { data: regions } = await supabase.from('regions').select('id, slug, name').in('slug', REGION_SLUGS);
  if (!regions || regions.length === 0) { log('No regions found!'); return; }
  const regionIds = regions.map(r => r.id);
  log(`Found ${regions.length} regions covering ${REGION_SLUGS.length} slugs`);

  // ─── PASS 1: Not enriched (ai_description IS NULL) ───
  log('\n══ PASS 1: Businesses with no AI description ══');
  const { data: notEnriched, error: e1 } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .in('region_id', regionIds)
    .is('ai_description', null)
    .order('google_rating', { ascending: false, nullsFirst: false });

  if (e1) { log(`ERROR: ${e1.message}`); return; }
  log(`Found ${notEnriched.length} businesses to enrich`);

  let pass1Stats = { total: 0, scraped: 0, google: 0, minimal: 0, ai: 0, excluded: 0, flagged: 0 };

  for (let i = 0; i < notEnriched.length; i++) {
    const biz = notEnriched[i];
    log(`[P1 ${i+1}/${notEnriched.length}] ${biz.name} (${biz.suburb})`);
    try {
      const result = await processBusiness(biz, 'not_enriched');
      if (result.excluded) { pass1Stats.excluded++; }
      else if (result.flagged) { pass1Stats.flagged++; }
      else {
        pass1Stats.total++;
        if (['website','fresha','facebook','instagram'].includes(result.contentSource)) pass1Stats.scraped++;
        else if (result.contentSource === 'google_data') pass1Stats.google++;
        else pass1Stats.minimal++;
        if (result.hasAi) pass1Stats.ai++;
      }
    } catch (err) { log(`  ERROR: ${err.message}`); }
    await sleep(biz.website_url ? 2000 : 150);
  }

  log(`\nPass 1 complete: ${pass1Stats.total} processed, ${pass1Stats.scraped} scraped, ${pass1Stats.google} google, ${pass1Stats.minimal} minimal, ${pass1Stats.ai} AI descriptions, ${pass1Stats.excluded} excluded, ${pass1Stats.flagged} flagged`);

  // ─── PASS 2: Missed websites (content_source='google_data' but has website_url) ───
  log('\n══ PASS 2: Missed websites (google_data with website_url) ══');
  const { data: missedWebsites, error: e2 } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .in('region_id', regionIds)
    .eq('content_source', 'google_data')
    .not('website_url', 'is', null)
    .order('google_rating', { ascending: false, nullsFirst: false });

  if (e2) { log(`ERROR: ${e2.message}`); return; }
  log(`Found ${missedWebsites.length} businesses with websites not scraped`);

  let pass2Stats = { total: 0, upgraded: 0, failed: 0, excluded: 0 };

  for (let i = 0; i < missedWebsites.length; i++) {
    const biz = missedWebsites[i];
    log(`[P2 ${i+1}/${missedWebsites.length}] ${biz.name} (${biz.suburb}) — ${biz.website_url}`);
    try {
      const result = await processBusiness(biz, 'missed_website');
      if (!result.changed) { pass2Stats.failed++; }
      else if (result.excluded) { pass2Stats.excluded++; }
      else { pass2Stats.total++; pass2Stats.upgraded++; }
    } catch (err) { log(`  ERROR: ${err.message}`); }
    await sleep(2000);
  }

  log(`\nPass 2 complete: ${pass2Stats.upgraded} upgraded to website, ${pass2Stats.failed} scrape failures, ${pass2Stats.excluded} excluded`);

  // ─── Final summary ──────────────────────────────────
  log('\n' + '═'.repeat(60));
  log('FIX COMPLETE');
  log('═'.repeat(60));
  log(`Pass 1 (not enriched): ${notEnriched.length} found → ${pass1Stats.ai} AI descriptions generated`);
  log(`Pass 2 (missed websites): ${missedWebsites.length} found → ${pass2Stats.upgraded} upgraded`);
  log(`Excluded: ${pass1Stats.excluded + pass2Stats.excluded}`);
  log(`Completed at ${new Date().toISOString()}`);
}

main().catch(err => { log(`FATAL: ${err.message}`); console.error(err); process.exit(1); });
