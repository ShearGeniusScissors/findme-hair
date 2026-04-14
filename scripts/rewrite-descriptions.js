#!/usr/bin/env node
/**
 * Full AI Description Rewrite for findme.hair
 *
 * Rewrites ai_description for ALL enriched businesses using the approved
 * quality standard. Fetches website content live, falls back to scraped_about
 * and Google reviews.
 *
 * Usage: node scripts/rewrite-descriptions.js [territory-index] [end-index]
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
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing SUPABASE env'); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

const LOG_FILE = '/tmp/rewrite-descriptions.log';

// ─── Skip list (already approved) ─────────────────────
const SKIP_SLUGS = new Set([
  'carmen-co-hair-studio-lucas',
  'therapy-hair-lounge-ballarat-central',
  'buninyong-hair-and-beauty-buninyong',
  'uncle-tonys-barbershop-wendouree',
  'salon-luka-lucas',
  'bespoke-colour-studio-ballarat-central',
]);

// ─── Region slugs per territory ───────────────────────
const TERRITORY_REGIONS = [
  { name: 'Ballarat', slugs: ['ballarat', 'ballarat-surrounds'] },
  { name: 'Geelong & Surf Coast', slugs: ['geelong', 'geelong-surrounds', 'surf-coast', 'bellarine'] },
  { name: 'Melbourne West', slugs: ['melbourne-west', 'melton', 'bacchus-marsh', 'caroline-springs', 'deer-park', 'laverton-north'] },
  { name: 'Tasmania', slugs: ['hobart', 'launceston', 'devonport', 'burnie'] },
  { name: 'Horsham & Maryborough', slugs: ['horsham', 'maryborough-vic', 'kyneton', 'castlemaine', 'daylesford'] },
  { name: 'Mildura', slugs: ['mildura'] },
  { name: 'Warrnambool & Mt Gambier', slugs: ['warrnambool', 'mount-gambier', 'colac', 'hamilton', 'portland'] },
  { name: 'Bendigo', slugs: ['bendigo'] },
  { name: 'Sunbury', slugs: ['sunbury', 'gisborne', 'woodend'] },
];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Scrape website ───────────────────────────────────
async function scrapeAllPages(url) {
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

    if (isFresha) {
      const about = $('[data-testid="about-text"], .about-text, p').first().text().trim().slice(0, 1500);
      const services = [];
      $('[data-testid="service-name"], .service-name, .service-item h3').each((_, el) => {
        const name = $(el).text().trim();
        if (name && name.length < 100) services.push(name);
      });
      return { text: about, services, source: 'fresha' };
    }
    if (isFacebook) {
      return { text: $('meta[name="description"]').attr('content') || '', services: [], source: 'facebook' };
    }
    if (isInstagram) {
      return { text: $('meta[property="og:description"]').attr('content') || '', services: [], source: 'instagram' };
    }

    // Full page text extraction
    $('script, style, noscript, nav, footer, header').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000);
    const metaDesc = $('meta[name="description"]').attr('content') || '';

    // Services
    const services = [];
    const serviceSelectors = [
      '[class*="service"] li', '[id*="service"] li',
      '[class*="treatment"] li', '[id*="treatment"] li',
      '[class*="pricing"] li', '[id*="pricing"] li',
      '[class*="service"] h3', '[class*="service"] h4',
    ];
    for (const sel of serviceSelectors) {
      $(sel).each((_, el) => {
        const name = $(el).text().trim().split('\n')[0].trim();
        if (name && name.length > 2 && name.length < 100) services.push(name);
      });
      if (services.length > 0) break;
    }

    return { text: [metaDesc, bodyText].join('\n\n'), services: [...new Set(services)].slice(0, 30), source: 'website' };
  } catch { return null; }
}

// ─── Fetch Google reviews ─────────────────────────────
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

// ─── Generate description ─────────────────────────────
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

// ─── Walk-ins detection ───────────────────────────────
const WALKINS_RE = [/walk.?in/i, /no appointment/i, /no booking required/i, /drop.?in/i, /come on in/i, /accept walk/i];
const APPT_RE = [/appointment only/i, /by appointment/i, /bookings? essential/i, /booking required/i, /booking only/i, /please book/i];

function detectWalkIns(text) {
  for (const p of WALKINS_RE) if (p.test(text)) return true;
  for (const p of APPT_RE) if (p.test(text)) return false;
  return null;
}

// ─── Specialty detection ──────────────────────────────
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
  const lower = corpus.toLowerCase();
  for (const { tag, patterns } of SPECIALTY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) { specialties.add(tag); break; }
    }
  }
  return [...specialties];
}

// ─── Process single business ──────────────────────────
async function processBusiness(business) {
  // Scrape website
  let websiteContent = null;
  if (business.website_url) {
    websiteContent = await scrapeAllPages(business.website_url);
    if (websiteContent) {
      log(`  Scraped → ${websiteContent.source} (${websiteContent.text.length} chars)`);
    } else {
      log(`  Scrape failed: ${business.website_url}`);
    }
  }

  // Fetch Google reviews if no rich website content
  let reviews = [];
  if ((!websiteContent || websiteContent.text.length < 100) && business.google_place_id) {
    reviews = await fetchGoogleReviews(business.google_place_id);
    if (reviews.length > 0) log(`  Got ${reviews.length} Google reviews`);
  }

  // Generate description
  const aiDescription = await generateDescription(business, websiteContent, reviews);
  if (!aiDescription) { log(`  SKIP: no description generated`); return false; }

  // Detect specialties from all content
  const allText = [
    websiteContent?.text || '', business.scraped_about || '',
    (websiteContent?.services || []).join(' '), aiDescription,
    business.name || '', reviews.join(' '),
  ].join(' ');
  const specialties = detectSpecialties(business, allText);

  // Detect walk-ins
  const walkIns = detectWalkIns(allText);

  // Update
  const update = {
    ai_description: aiDescription,
    specialties: specialties.length > 0 ? specialties : null,
    content_generated_at: new Date().toISOString(),
  };
  if (walkIns !== null && business.walk_ins_welcome === null) {
    update.walk_ins_welcome = walkIns;
    update.walk_ins_source = 'scraped';
  }

  await supabase.from('businesses').update(update).eq('id', business.id);
  return true;
}

// ─── Process territory ────────────────────────────────
async function processTerritory(territory) {
  log(`\n${'═'.repeat(50)}`);
  log(`Territory: ${territory.name}`);
  log(`${'═'.repeat(50)}`);

  // Get region IDs
  const regionIds = [];
  for (const slug of territory.slugs) {
    const { data } = await supabase.from('regions').select('id').eq('slug', slug).maybeSingle();
    if (data) regionIds.push(data.id);
  }

  if (regionIds.length === 0) {
    log(`  No regions found for slugs: ${territory.slugs.join(', ')}`);
    return { name: territory.name, total: 0, rewritten: 0 };
  }

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .in('region_id', regionIds)
    .order('google_rating', { ascending: false, nullsFirst: false });

  if (error) { log(`  ERROR: ${error.message}`); return { name: territory.name, total: 0, rewritten: 0 }; }

  // Filter out skip list and already-rewritten (catchup mode)
  const catchup = process.argv[4] === '--catchup';
  const today = new Date().toISOString().slice(0, 10);
  const toProcess = businesses.filter(b => {
    if (SKIP_SLUGS.has(b.slug)) return false;
    if (catchup && b.content_generated_at && b.content_generated_at.startsWith(today)) return false;
    return true;
  });
  const skipped = businesses.length - toProcess.length;
  log(`Found ${businesses.length} businesses, processing ${toProcess.length} (skipping ${skipped}${catchup ? ' incl. already done today' : ''})`);

  let rewritten = 0;
  let walkInsFound = 0;
  let apptOnly = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const biz = toProcess[i];
    log(`[${i + 1}/${toProcess.length}] ${biz.name} (${biz.suburb})`);

    try {
      const success = await processBusiness(biz);
      if (success) rewritten++;
    } catch (err) {
      log(`  ERROR: ${err.message}`);
    }

    // Rate limiting
    if (biz.website_url) await sleep(2000);
    else await sleep(300);
  }

  log(`\n${territory.name} done: ${rewritten}/${toProcess.length} rewritten`);
  return { name: territory.name, total: toProcess.length, rewritten };
}

// ─── Main ─────────────────────────────────────────────
async function main() {
  log('\n' + '═'.repeat(50));
  log('findme.hair — Full Description Rewrite');
  log('═'.repeat(50));

  const startIdx = parseInt(process.argv[2]) || 0;
  const endIdx = process.argv[3] ? parseInt(process.argv[3]) : TERRITORY_REGIONS.length;

  const results = [];
  for (let i = startIdx; i < endIdx; i++) {
    const territory = TERRITORY_REGIONS[i];
    if (!territory) break;
    const result = await processTerritory(territory);
    results.push(result);
  }

  log('\n' + '═'.repeat(50));
  log('FINAL REPORT');
  log('═'.repeat(50));
  let grandTotal = 0, grandRewritten = 0;
  for (const r of results) {
    log(`${r.name.padEnd(30)} ${r.rewritten}/${r.total}`);
    grandTotal += r.total;
    grandRewritten += r.rewritten;
  }
  log(`\nTOTAL: ${grandRewritten}/${grandTotal} descriptions rewritten`);
  log(`Completed at ${new Date().toISOString()}`);
}

main().catch(err => { log(`FATAL: ${err.message}`); console.error(err); process.exit(1); });
