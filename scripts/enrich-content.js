#!/usr/bin/env node
/**
 * Content Enrichment Pipeline for findme.hair
 *
 * Scrapes salon websites, generates AI descriptions via Claude,
 * and detects specialties for territory businesses.
 *
 * Usage: node scripts/enrich-content.js [territory-index]
 *   territory-index: 0-8 (optional, runs all if omitted)
 *
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ─── Config ────────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}
if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

const LOG_FILE = '/tmp/content-enrichment.log';

// ─── Territories ───────────────────────────────────────
const TERRITORIES = [
  {
    name: 'Ballarat',
    state: 'VIC',
    suburbs: [
      'Ballarat', 'Ballarat Central', 'Ballarat East', 'Ballarat North',
      'Wendouree', 'Sebastopol', 'Alfredton', 'Buninyong', 'Delacombe',
      'Mount Clear', 'Lake Wendouree', 'Canadian', 'Mount Helen',
    ],
  },
  {
    name: 'Geelong & Surf Coast',
    state: 'VIC',
    suburbs: [
      'Geelong', 'Geelong West', 'Newtown', 'Belmont', 'Highton',
      'Torquay', 'Ocean Grove', 'Leopold', 'Lara', 'Grovedale',
      'Corio', 'Norlane', 'Waurn Ponds', 'Armstrong Creek', 'Drysdale',
      'Barwon Heads', 'Anglesea', 'Queenscliff', 'Point Lonsdale',
      'Portarlington', 'Jan Juc',
    ],
  },
  {
    name: 'Melbourne West',
    state: 'VIC',
    suburbs: [
      'Bacchus Marsh', 'Melton', 'Caroline Springs', 'Derrimut',
      'Deer Park', 'Tarneit', 'Truganina', 'Wyndham Vale', 'Werribee',
      'Hoppers Crossing', 'Williams Landing', 'Point Cook', 'Laverton',
      'Laverton North', 'Altona Meadows', 'Altona North', 'Altona',
      'Williamstown', 'Newport',
    ],
  },
  {
    name: 'Tasmania',
    state: 'TAS',
    suburbs: [
      'Hobart', 'Sandy Bay', 'North Hobart', 'South Hobart', 'Battery Point',
      'Glenorchy', 'Kingston', 'Bellerive', 'New Town', 'Moonah',
      'Rosny Park', 'Howrah', 'Claremont', 'Sorell',
      'Launceston', 'Invermay', 'Mowbray', 'Kings Meadows', 'Prospect',
      'Riverside', 'Newnham', 'Trevallyn', 'East Launceston',
      'Devonport', 'Burnie', 'Ulverstone', 'Wynyard', 'Penguin',
      'Sheffield', 'Deloraine', 'George Town',
    ],
  },
  {
    name: 'Horsham & Maryborough',
    state: 'VIC',
    suburbs: [
      'Horsham', 'Maryborough', 'Castlemaine', 'Kyneton', 'Daylesford',
    ],
  },
  {
    name: 'Mildura',
    state: 'VIC',
    suburbs: ['Mildura', 'Red Cliffs', 'Irymple', 'Merbein'],
  },
  {
    name: 'Warrnambool & Mt Gambier',
    state: null, // Mixed VIC/SA
    suburbs: [
      'Warrnambool', 'Mount Gambier', 'Portland', 'Hamilton',
      'Koroit', 'Camperdown', 'Colac', 'Terang',
    ],
  },
  {
    name: 'Bendigo',
    state: 'VIC',
    suburbs: [
      'Bendigo', 'Golden Square', 'Kangaroo Flat', 'Strathdale',
      'Eaglehawk', 'Epsom', 'Flora Hill', 'Spring Gully',
    ],
  },
  {
    name: 'Sunbury',
    state: 'VIC',
    suburbs: [
      'Sunbury', 'Gisborne', 'Riddells Creek', 'Romsey',
      'Lancefield', 'Woodend', 'Macedon',
    ],
  },
];

// ─── Specialty detection patterns ──────────────────────
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

// ─── Service quality filter ──────────────────────────
const NAV_JUNK = new Set([
  'home', 'about', 'contact', 'gallery', 'blog', 'shop', 'menu', 'team', 'faq',
  'book', 'booking', 'call', 'email', 'instagram', 'facebook', 'gift card',
  'book now', 'call us', 'contact us', 'our team', 'meet the team', 'find us',
  'login', 'sign in', 'sign up', 'register', 'cart', 'checkout', 'search',
  'back to top', 'read more', 'learn more', 'view all', 'see more', 'more info',
  'privacy', 'terms', 'sitemap', 'careers', 'jobs',
]);

const RETAIL_BRANDS = new Set([
  'biolage', 'matrix', 'kms', 'muk', 'nak', 'goldwell', 'wella', 'schwarzkopf',
  'kerasilk', 'fanola', 'dermalogica', 'revitafoam', '12 reasons', 'quidad',
  'mermade hair', 'silver bullet', 'natural look', 'ori lab', 'genetix',
  'keracolor', 'eco minerals', 'azure tan', 'mine tan', 'the collagen co',
  'olaplex', 'redken', 'joico', 'milkshake', 'moroccanoil', 'kevin murphy',
  'de lorenzo', 'aveda', 'pureology', 'loreal', "l'oreal", 'tigi', 'sexy hair',
  'nak haircare', 'matrix styling', 'nak hair',
]);

const NON_HAIR_SERVICES = [
  /\bwax(ing)?\b/i, /\btann(ing|ed)?\b/i, /\blash(es)?\b/i, /\bbrow(s)?\b/i,
  /\bfacial(s)?\b/i, /\bmassage\b/i, /\bnails?\b/i, /\bspray tan\b/i,
  /\bfull brow\b/i, /\bbrow tint\b/i, /\blash lift\b/i, /\blash tint\b/i,
  /\bmanicure\b/i, /\bpedicure\b/i, /\bgel nails?\b/i, /\bacrylic\b/i,
  /\bmicroderm/i, /\bbotox\b/i, /\binjectable/i, /\blaser\b/i,
];

const ACCESSORY_PATTERNS = [
  /\bbrush(es)?\b/i, /\baccessori/i, /\bstyling wax\b/i,
  /\bgift\s*(card|voucher|certificate)/i,
];

const HAIR_SERVICE_KEYWORDS = [
  /\bcut\b/i, /\btrim\b/i, /\bblow/i, /\bdry\b/i, /\bcolou?r\b/i,
  /\bhighlight/i, /\bbalayage/i, /\btint\b/i, /\bperm\b/i,
  /\bstraighten/i, /\bkeratin\b/i, /\btreatment\b/i, /\bstyl(e|ing)\b/i,
  /\bupstyle/i, /\bextension/i, /\bweave\b/i, /\bfoil/i, /\btoner\b/i,
  /\bgloss\b/i, /\bmen/i, /\bwomen/i, /\bkids?\b/i, /\bchild/i,
  /\bsenior\b/i, /\bstudent\b/i, /\bwash\b/i, /\bshampoo\b/i,
  /\bcondition/i, /\bset\b/i, /\bwave\b/i, /\brelax\b/i, /\bfade\b/i,
  /\bclipper/i, /\bshave\b/i, /\bbeard\b/i, /\bshape\b/i, /\bhair\b/i,
  /\bbraid/i, /\bcornrow/i, /\bdread/i, /\bombre/i, /\bvivid/i,
  /\brebond/i, /\bblowout/i, /\bfringe/i, /\bbang/i, /\blayer/i,
];

const HAS_PRICE = /\$|from\s+\d|price/i;

function isQualityService(item) {
  const lower = item.toLowerCase().trim();

  // Too short or too long
  if (lower.length < 3 || lower.length > 120) return false;

  // Navigation junk (exact match)
  if (NAV_JUNK.has(lower)) return false;

  // Retail brand (exact match)
  if (RETAIL_BRANDS.has(lower)) return false;

  // Non-hair service
  for (const p of NON_HAIR_SERVICES) {
    if (p.test(lower) && !HAIR_SERVICE_KEYWORDS.some(h => h.test(lower))) return false;
  }

  // Accessories/retail
  for (const p of ACCESSORY_PATTERNS) {
    if (p.test(lower)) return false;
  }

  // Passes if it has a price or contains a hair keyword
  if (HAS_PRICE.test(item)) return true;
  for (const p of HAIR_SERVICE_KEYWORDS) {
    if (p.test(lower)) return true;
  }

  // Reject anything that didn't match a hair keyword
  return false;
}

function filterServices(services) {
  if (!services || services.length === 0) return null;
  const filtered = services.filter(isQualityService);
  return filtered.length >= 3 ? filtered : null;
}

// NOT_HAIR indicators — if these dominate, the business is not a hair salon
const NOT_HAIR_PATTERNS = [
  /\bnails?\b/i, /\bmanicure\b/i, /\bpedicure\b/i, /\bgel nails\b/i,
  /\blash(es)?\b/i, /\bbrow(s)?\b/i, /\bwaxing\b/i, /\bmassage\b/i,
  /\bfacial(s)?\b/i, /\bskin\b/i, /\bbeauty therap/i, /\bday spa\b/i,
  /\btattoo\b/i, /\bpiercing\b/i, /\bcosmetic\b/i, /\bbotox\b/i,
  /\binjectable/i, /\blaser\b/i, /\bmicroderm/i, /\bdermal/i,
];

// ─── Helpers ───────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Business type verification ────────────────────────
function classifyBusinessType(business, scrapedAbout, scrapedServices, fullPageText) {
  const corpus = [
    scrapedAbout || '',
    (scrapedServices || []).join(' '),
    fullPageText || '',
    business.name || '',
  ].join(' ');

  // Count hair-related signals
  const hairSignals = [
    /\bhair/i, /\bsalon\b/i, /\bbarber/i, /\bhairdress/i, /\bhaircut/i,
    /\bcolou?r\b/i, /\bstyl(e|ing|ist)/i, /\bbalayage/i, /\bfoil/i,
    /\bblowdr/i, /\btrim\b/i, /\bfade\b/i, /\bbeard/i, /\bshave\b/i,
    /\bcurl/i, /\bextension/i, /\bkeratin/i, /\btoner\b/i, /\bperm\b/i,
  ];
  let hairCount = 0;
  for (const p of hairSignals) if (p.test(corpus)) hairCount++;

  // Count NOT_HAIR signals
  let notHairCount = 0;
  const notHairReasons = [];
  for (const p of NOT_HAIR_PATTERNS) {
    if (p.test(corpus)) {
      notHairCount++;
      notHairReasons.push(p.source.replace(/\\b/g, '').replace(/[()]/g, ''));
    }
  }

  // Decision: if NOT_HAIR signals dominate and hair signals are weak
  if (notHairCount >= 3 && hairCount <= 1) {
    return { isHair: false, reason: `primarily ${notHairReasons.slice(0, 3).join(', ')}` };
  }

  // Name-based checks for businesses without websites
  const nameLower = business.name.toLowerCase();
  const nameNotHair = [
    /\bnail/i, /\bbeauty\b/i, /\blash/i, /\bspa\b/i, /\bskin\b/i,
    /\btattoo/i, /\bpiercing/i, /\bcosmetic/i, /\bmassage/i,
  ];
  let nameNotHairCount = 0;
  for (const p of nameNotHair) if (p.test(nameLower)) nameNotHairCount++;

  const nameHair = [/hair/i, /barber/i, /salon/i, /styl/i, /cut/i];
  let nameHairCount = 0;
  for (const p of nameHair) if (p.test(nameLower)) nameHairCount++;

  // If name strongly suggests non-hair and no website to verify
  if (nameNotHairCount >= 1 && nameHairCount === 0 && !scrapedAbout && !scrapedServices) {
    return { isHair: false, reason: `name suggests non-hair: "${business.name}"`, uncertain: true };
  }

  return { isHair: true };
}

// ─── Website scraping ──────────────────────────────────
async function scrapeWebsite(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'findme.hair-bot/1.0 (+https://www.findme.hair)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!resp.ok) return null;

    const finalUrl = resp.url;
    const html = await resp.text();
    const $ = cheerio.load(html);

    // Detect redirects to booking platforms
    const isFresha = finalUrl.includes('fresha.com') || finalUrl.includes('fresha.co');
    const isFacebook = finalUrl.includes('facebook.com');
    const isInstagram = finalUrl.includes('instagram.com');

    let aboutText = '';
    let services = [];

    if (isFresha) {
      // Extract from Fresha page
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
      // Regular salon website
      // Meta description
      const metaDesc = $('meta[name="description"]').attr('content') || '';

      // About text — look in common sections
      const aboutSelectors = [
        '[class*="about"]', '[id*="about"]',
        '[class*="story"]', '[id*="story"]',
        '[class*="team"]', '[id*="team"]',
        '[class*="philosophy"]', '[id*="philosophy"]',
        '[class*="welcome"]', '[id*="welcome"]',
      ];
      for (const sel of aboutSelectors) {
        const text = $(sel).text().trim();
        if (text && text.length > 30 && text.length < 2000) {
          aboutText = text.slice(0, 1000);
          break;
        }
      }
      if (!aboutText) {
        // Fallback: first substantial paragraph
        aboutText = metaDesc || $('main p, .content p, article p').first().text().trim().slice(0, 500);
      }

      // Services — look in common sections
      const serviceSelectors = [
        '[class*="service"] li', '[id*="service"] li',
        '[class*="treatment"] li', '[id*="treatment"] li',
        '[class*="menu"] li', '[id*="menu"] li',
        '[class*="pricing"] li', '[id*="pricing"] li',
        '[class*="service"] h3', '[class*="service"] h4',
        '[class*="treatment"] h3', '[class*="treatment"] h4',
      ];
      for (const sel of serviceSelectors) {
        $(sel).each((_, el) => {
          const name = $(el).text().trim().split('\n')[0].trim();
          if (name && name.length > 2 && name.length < 100) {
            services.push(name);
          }
        });
        if (services.length > 0) break;
      }
    }

    // Dedupe services
    services = [...new Set(services)].slice(0, 30);

    // Get full page text for classification (truncated)
    const fullPageText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);

    return {
      aboutText: aboutText.replace(/\s+/g, ' ').trim().slice(0, 1000) || null,
      services: services.length > 0 ? services : null,
      source: isFresha ? 'fresha' : isFacebook ? 'facebook' : isInstagram ? 'instagram' : 'website',
      fullPageText,
    };
  } catch (err) {
    return null;
  }
}

// ─── AI description generation ─────────────────────────
async function generateDescription(business, scrapedAbout, scrapedServices) {
  const servicesStr = scrapedServices?.length > 0
    ? scrapedServices.join(', ')
    : 'not available';
  const aboutStr = scrapedAbout || 'not available';

  const typeLabel = {
    hair_salon: 'hair salon',
    barber: 'barber shop',
    unisex: 'unisex salon',
  }[business.business_type] || 'hair salon';

  const userPrompt = `Write a 2-3 sentence description for this Australian ${typeLabel} for a directory listing.

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
- Do not invent services not in the data`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: 'You are writing directory listing descriptions for findme.hair, Australia\'s hair salon and barber directory. Write concise, factual, unique descriptions that help people find the right salon. Never fabricate services or claims not supported by the data provided. Focus on what makes this salon unique.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    return response.content[0]?.text?.trim() || null;
  } catch (err) {
    log(`  AI error for ${business.name}: ${err.message}`);
    return null;
  }
}

// ─── Specialty detection ───────────────────────────────
function detectSpecialties(business, scrapedAbout, scrapedServices, aiDescription) {
  const specialties = new Set();

  // Always tag barbers
  if (business.business_type === 'barber') {
    specialties.add('barber');
  }

  // Build searchable text corpus
  const corpus = [
    scrapedAbout || '',
    (scrapedServices || []).join(' '),
    aiDescription || '',
    business.name || '',
    business.description || '',
  ].join(' ').toLowerCase();

  for (const { tag, patterns } of SPECIALTY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(corpus)) {
        specialties.add(tag);
        break;
      }
    }
  }

  return [...specialties];
}

// ─── Walk-ins detection ──────────────────────────────────
const WALKINS_PATTERNS = [
  /walk.?in/i, /no appointment/i, /no booking required/i, /drop.?in/i,
  /come on in/i, /just come in/i, /open to walk/i, /accept walk/i,
];
const APPT_ONLY_PATTERNS = [
  /appointment only/i, /by appointment/i, /bookings? essential/i,
  /booking required/i, /booking only/i, /appointments only/i,
  /please book/i, /book online to avoid/i,
];

function detectWalkIns(corpus) {
  for (const p of WALKINS_PATTERNS) if (p.test(corpus)) return true;
  for (const p of APPT_ONLY_PATTERNS) if (p.test(corpus)) return false;
  return null;
}

// ─── Process single business ───────────────────────────
async function processBusiness(business) {
  let scrapedAbout = null;
  let scrapedServices = null;
  let contentSource = 'minimal';
  let fullPageText = null;

  // TIER 1: Has website
  if (business.website_url) {
    const scraped = await scrapeWebsite(business.website_url);
    if (scraped) {
      scrapedAbout = scraped.aboutText;
      scrapedServices = scraped.services;
      contentSource = scraped.source;
      fullPageText = scraped.fullPageText;
      log(`  Scraped ${business.name} → ${scraped.source} (about: ${scrapedAbout?.length || 0} chars, services: ${scrapedServices?.length || 0})`);
    } else {
      log(`  Scrape failed for ${business.name} (${business.website_url})`);
      contentSource = business.google_rating ? 'google_data' : 'minimal';
    }
  }
  // TIER 2: Google data
  else if (business.google_rating) {
    contentSource = 'google_data';
  }
  // TIER 3: Minimal
  else {
    contentSource = 'minimal';
  }

  // ─── Business type verification ────────────────────
  const classification = classifyBusinessType(business, scrapedAbout, scrapedServices, fullPageText);
  if (!classification.isHair) {
    if (classification.uncertain) {
      // Flag for manual review
      const flags = business.verification_flags || [];
      if (!flags.includes('needs_manual_review')) flags.push('needs_manual_review');
      await supabase
        .from('businesses')
        .update({ verification_flags: flags, scraped_at: new Date().toISOString() })
        .eq('id', business.id);
      log(`  ⚠ FLAGGED for review: ${business.name} — ${classification.reason}`);
      return { contentSource, hasAiDescription: false, specialties: [], excluded: false, flagged: true, excludeReason: classification.reason };
    } else {
      // Exclude — not a hair business
      const flags = business.verification_flags || [];
      if (!flags.includes('excluded_not_hair')) flags.push('excluded_not_hair');
      await supabase
        .from('businesses')
        .update({ status: 'excluded', verification_flags: flags, scraped_at: new Date().toISOString() })
        .eq('id', business.id);
      log(`  ✗ EXCLUDED: ${business.name} (${business.suburb}) — ${classification.reason}`);
      return { contentSource, hasAiDescription: false, specialties: [], excluded: true, flagged: false, excludeReason: classification.reason };
    }
  }

  // Filter services to only real hair services
  scrapedServices = filterServices(scrapedServices);

  // Save scraped data
  const scrapeUpdate = {
    scraped_about: scrapedAbout,
    scraped_services: scrapedServices,
    scraped_at: new Date().toISOString(),
    content_source: contentSource,
  };

  await supabase
    .from('businesses')
    .update(scrapeUpdate)
    .eq('id', business.id);

  // Generate AI description
  const aiDescription = await generateDescription(business, scrapedAbout, scrapedServices);

  // Detect specialties
  const specialties = detectSpecialties(business, scrapedAbout, scrapedServices, aiDescription);

  // Detect walk-ins
  const walkInsCorpus = [scrapedAbout || '', aiDescription || '', (scrapedServices || []).join(' ')].join(' ');
  const walkIns = detectWalkIns(walkInsCorpus);

  // Save AI content
  const contentUpdate = {
    ai_description: aiDescription,
    specialties: specialties.length > 0 ? specialties : null,
    content_generated_at: new Date().toISOString(),
    ...(walkIns !== null && { walk_ins_welcome: walkIns, walk_ins_source: 'scraped' }),
  };

  await supabase
    .from('businesses')
    .update(contentUpdate)
    .eq('id', business.id);

  return {
    contentSource,
    hasAiDescription: !!aiDescription,
    specialties,
    excluded: false,
    flagged: false,
  };
}

// ─── Process territory ─────────────────────────────────
async function processTerritory(territory) {
  log(`\n${'═'.repeat(50)}`);
  log(`Processing territory: ${territory.name}`);
  log(`${'═'.repeat(50)}`);

  // Build query — fetch businesses in these suburbs
  let query = supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .in('suburb', territory.suburbs)
    .is('ai_description', null) // Skip already processed
    .order('google_rating', { ascending: false, nullsFirst: false });

  // Filter by state if specified (avoids cross-state suburb name collisions)
  if (territory.state) {
    query = query.eq('state', territory.state);
  }

  const { data: businesses, error } = await query;
  if (error) {
    log(`ERROR fetching businesses: ${error.message}`);
    return null;
  }

  log(`Found ${businesses.length} businesses to process`);

  const stats = {
    total: businesses.length,
    websiteScraped: 0,
    googleOnly: 0,
    minimal: 0,
    aiGenerated: 0,
    excluded: 0,
    flagged: 0,
    excludedList: [],
    flaggedList: [],
    specialtiesFound: {},
  };

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    log(`[${i + 1}/${businesses.length}] ${biz.name} (${biz.suburb})`);

    try {
      const result = await processBusiness(biz);

      if (result.excluded) {
        stats.excluded++;
        stats.excludedList.push({ name: biz.name, suburb: biz.suburb, reason: result.excludeReason });
        continue;
      }
      if (result.flagged) {
        stats.flagged++;
        stats.flaggedList.push({ name: biz.name, suburb: biz.suburb, reason: result.excludeReason });
        continue;
      }

      if (result.contentSource === 'website' || result.contentSource === 'fresha' || result.contentSource === 'facebook' || result.contentSource === 'instagram') {
        stats.websiteScraped++;
      } else if (result.contentSource === 'google_data') {
        stats.googleOnly++;
      } else {
        stats.minimal++;
      }

      if (result.hasAiDescription) stats.aiGenerated++;

      for (const s of result.specialties) {
        stats.specialtiesFound[s] = (stats.specialtiesFound[s] || 0) + 1;
      }
    } catch (err) {
      log(`  ERROR processing ${biz.name}: ${err.message}`);
    }

    // Rate limiting: 2s between scrapes, ~100ms between AI calls
    if (biz.website_url) {
      await sleep(2000);
    } else {
      await sleep(150);
    }
  }

  log(`\nTerritory ${territory.name} complete:`);
  log(`  Total: ${stats.total}, Website: ${stats.websiteScraped}, Google: ${stats.googleOnly}, Minimal: ${stats.minimal}`);
  log(`  AI descriptions generated: ${stats.aiGenerated}`);
  log(`  Excluded (NOT_HAIR): ${stats.excluded}`);
  if (stats.excludedList.length > 0) {
    for (const e of stats.excludedList) {
      log(`    ✗ ${e.name} (${e.suburb}) — ${e.reason}`);
    }
  }
  log(`  Flagged for review: ${stats.flagged}`);
  if (stats.flaggedList.length > 0) {
    for (const f of stats.flaggedList) {
      log(`    ⚠ ${f.name} (${f.suburb}) — ${f.reason}`);
    }
  }
  log(`  Specialties: ${JSON.stringify(stats.specialtiesFound)}`);

  return stats;
}

// ─── Main ──────────────────────────────────────────────
async function main() {
  log('\n' + '╔' + '═'.repeat(50) + '╗');
  log('║  findme.hair Content Enrichment Pipeline         ║');
  log('╚' + '═'.repeat(50) + '╝');
  log(`Started at ${new Date().toISOString()}`);

  const startIdx = parseInt(process.argv[2]) || 0;
  const endIdx = process.argv[3] ? parseInt(process.argv[3]) : TERRITORIES.length;

  const allStats = [];

  for (let i = startIdx; i < endIdx; i++) {
    const territory = TERRITORIES[i];
    if (!territory) break;

    const stats = await processTerritory(territory);
    if (stats) allStats.push({ name: territory.name, ...stats });
  }

  // ─── Final report ──────────────────────────────────
  log('\n' + '═'.repeat(60));
  log('FINAL REPORT');
  log('═'.repeat(60));

  log('\nTerritory                | Total | Website | Google | Minimal | AI Gen | Excluded | Flagged');
  log('-'.repeat(95));

  let grandTotal = 0, grandWebsite = 0, grandGoogle = 0, grandMinimal = 0, grandAi = 0, grandExcluded = 0, grandFlagged = 0;
  const allSpecialties = {};

  for (const s of allStats) {
    log(`${s.name.padEnd(25)}| ${String(s.total).padStart(5)} | ${String(s.websiteScraped).padStart(7)} | ${String(s.googleOnly).padStart(6)} | ${String(s.minimal).padStart(7)} | ${String(s.aiGenerated).padStart(6)} | ${String(s.excluded).padStart(8)} | ${String(s.flagged).padStart(7)}`);
    grandTotal += s.total;
    grandWebsite += s.websiteScraped;
    grandGoogle += s.googleOnly;
    grandMinimal += s.minimal;
    grandAi += s.aiGenerated;
    grandExcluded += s.excluded;
    grandFlagged += s.flagged;
    for (const [k, v] of Object.entries(s.specialtiesFound)) {
      allSpecialties[k] = (allSpecialties[k] || 0) + v;
    }
  }

  log('-'.repeat(95));
  log(`${'TOTAL'.padEnd(25)}| ${String(grandTotal).padStart(5)} | ${String(grandWebsite).padStart(7)} | ${String(grandGoogle).padStart(6)} | ${String(grandMinimal).padStart(7)} | ${String(grandAi).padStart(6)} | ${String(grandExcluded).padStart(8)} | ${String(grandFlagged).padStart(7)}`);

  log('\nTop specialties found:');
  const sorted = Object.entries(allSpecialties).sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sorted.slice(0, 20)) {
    log(`  ${tag}: ${count}`);
  }

  log(`\nTotal AI descriptions generated: ${grandAi}`);
  log(`Total excluded (NOT_HAIR): ${grandExcluded}`);
  log(`Total flagged for manual review: ${grandFlagged}`);
  log(`Completed at ${new Date().toISOString()}`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  console.error(err);
  process.exit(1);
});
