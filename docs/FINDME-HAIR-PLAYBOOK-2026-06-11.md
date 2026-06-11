# THE FINDME.HAIR PLAYBOOK
*Synthesised from 10 research angles · June 2026 · Every number rendered on the site comes live from the DB or Google — nothing invented*

**Hard constraints honoured throughout:** SEO frozen (no URL/title/H1/canonical/schema-structure changes — everything below is additive body content, components, or client-side state), colours frozen (black + gold), real numbers only, no fake urgency, Stripe featured tier stays dormant (but every tactic primes its future pitch), and the site converts on BOTH sides: consumer actions (call / website / book) and free listing claims.

---

## PART 1 — TOP 10 TACTICS (ranked by expected conversion impact)

### 1. Sticky bottom action bar on every salon profile — Call / Directions / Book

**Evidence:** Sticky bottom CTAs = +31% conversions across a 58M-session Contentsquare study (via https://www.amraandelma.com), +25% sales in Conversion Rate Experts' A/B test (https://www.conversion-rate-experts.com/sticky-cta-win-report), and one mobile-only case at +252.9% order completion (https://convertica.org). Phone is the prize: calls convert at 30–50% vs 1–2% for web clicks, 88% of local mobile searchers visit or call within 24 hours, and bottom-centre is the thumb's green zone (Hoober's 1,333-observation study, https://www.smashingmagazine.com). Yelp, Google Maps, Fresha and Booksy all converge on exactly this bar.

**findme.hair implementation:** On all ~13,800 profile pages, mobile-only sticky bottom bar, max 3 buttons: **[Call]** (tel: link, E.164 +61, gold primary), **[Directions]** (Maps deep link — lat/lng already in Supabase), **[Book]** where a booking URL exists, else **[Website]**. Never render a dead button — collapse to 2. Left info slot: "Open now · 4.9★" (state + trust, the salon analogue of Airbnb's price+dates). Pure CSS/server-rendered, ≤64px + `env(safe-area-inset-bottom)`, reserve padding so CLS = 0. Desktop: right-rail pinned card (name, rating chip, open state, the 3 CTAs, and one quiet line beneath: "Own this salon? Claim this free listing"). Component change only — SEO untouched.

### 2. Make the claim funnel live on the profile itself — gold "✓ Claimed" chip, quiet "Unclaimed" state, and empty-data slots that pitch

**Evidence:** Yelp, Tripadvisor, Trustpilot and Google all put the claim entry point ON the business page, because owners find their own listing by googling themselves — and the visible claimed/unclaimed asymmetry is the honest pressure that drives claims (https://business.yelp.com/resources/articles/ultimate-guide-to-claiming-your-yelp-page, https://www.tripadvisor.com/Owners). Domain.com.au proves a supply-side CTA inside a consumer page is standard, not clutter (its "free appraisal" interstitial mid-agent-profile). Yelp's verified-mark data: +24% engagement, +10% calls/clicks on claimed pages. None of the booking-led incumbents (Fresha/Booksy/Treatwell) do on-page claim prompts well — this is findme.hair's open flank.

**findme.hair implementation:** (a) Claimed listings: small gold "✓ Claimed by owner" chip beside the name (gold-on-black fits the frozen palette) + "Details confirmed by the owner" line where true. (b) Unclaimed: NO negative badge in the hero — instead a quiet inline strip after the info module: *"Own or work at [Salon Name]? Claim this free listing — update your photos, hours and booking link."* One gold button: **"Claim my free listing"**. (c) Every empty data slot converts the gap into the pitch: "Hours not listed yet — own this salon? Add them free." (d) Consumer CTAs are never gated by claim state — unclaimed pages stay fully useful (Yelp model). Full funnel spec in Part 3.

### 3. The rating chip, done properly: count + word tier + "on Google" attribution — everywhere a rating shows

**Evidence:** Displaying reviews lifts conversion up to 270%, and the lift peaks at 4.2–4.7 stars — perfection reads as fake (https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/). Baymard: users distrust stars without counts and chose heavily-reviewed 4★ over sparse 5★; sort/rank must weight rating × review volume, never raw average (https://baymard.com/blog/sort-by-customer-ratings). Booking.com's verbal anchor ("8.7 Wonderful") is the proven add. Google is the single most trusted review source (83% read reviews there — BrightLocal 2025), so the attribution borrows the best trust in the market. Places API ToS requires the attribution anyway (https://developers.google.com/maps/documentation/places/web-service/policies).

**findme.hair implementation:** One chip pattern site-wide — profile hero, listing cards, rails: **"4.8 ★ Excellent · 212 reviews on Google"** (word tiers: Excellent ≥4.8, Great ≥4.5, Good ≥4.0; below 4.0 show rating + count plainly, no label). Never round 4.7 to 5. Never stars alone. Add the comparative line on profiles where flattering: *"Among the top-rated of 33 salons in Ballarat Central"* (computed live, threshold-gated — suppress below average, never render an unflattering comparison). All "top rated" sorts use Bayesian weighting (rating × log review count). Add "as of [Month Year]" snapshot language and refresh ratings on a rolling cron to stay inside the Places 30-day caching rule.

### 4. Auto-generated narrative stats paragraph on every profile — the Domain/Zillow pattern, findme.hair's AI-citation weapon

**Evidence:** Domain's killer module is a templated paragraph built from structured data ("Allan Cove has sold 12 properties in the last 12 months, with an average sale price of $900k…") — reads as authored, unique per page, costs nothing (live capture, domain.com.au agent profiles). Zillow runs the same data→prose template at 5M-page scale. This is precisely the page shape AI engines cite — and the 2026-05-22 Brand Radar finding says AI cites individual salon pages, not directories: the win comes from making each of the 13,800 profiles dense with citable real facts (Bookwell's ~33K monthly traffic is profile pages, verified live).

**findme.hair implementation:** Server-rendered paragraph on every profile, all values live from Supabase + Google: *"H.Rose Studio is one of 33 hair salons and barbers listed in Ballarat Central and holds a 5.0-star rating from 29 reviews on Google — among the top-rated in the suburb. It's one of 4 Ballarat Central salons open Saturdays, and takes walk-ins."* Only render clauses whose data exists; every sentence is a fact a human or an AI engine can quote. Body content only — H1, title, schema untouched. Full formula in Part 4.

### 5. Per-listing engagement analytics on every Call / Website / Book / Directions tap — the future featured-tier pitch, built tonight

**Evidence:** Domain gates phone numbers behind a "reveal" click purely to COUNT leads — that count is their entire upsell ("your listing got 47 enquiries"). Yelp defines exactly these three events (calls, website clicks, direction taps) as its Customer Leads metrics (https://www.yelp-support.com). REA's deepest retention loop is owners watching their own numbers — 3M+ Australians track their own property. The dormant $35 featured tier's documented pitch is "your listing got 47 views — feature it"; without per-listing event data that pitch can never be made.

**findme.hair implementation:** Fire an analytics event (listing_id + action type) on every tap of Call, Website, Book, Directions — profile and card level. Don't gate anything (no phone-reveal friction). Surface the real number back to owners post-claim ("Your page was viewed N times this month") and in claim-nurture emails. This is the quiet tactic that makes the entire monetisation plan possible — ship it with Tactic 1 since the buttons are being rebuilt anyway.

### 6. Server-rendered "Nearby salons" + "More salons in [Suburb]" link rails on every profile — the orphan fix with a measured +7%

**Evidence:** The single highest-evidence safe SEO change available: SearchPilot's split test on an 8,000-page directory-shaped site — adding links from each location page to its 6 nearest neighbours produced **+7% organic traffic** to linked pages (https://www.searchpilot.com/resources/case-studies/seo-split-test-lessons-nearby-location-links). Ahrefs: orphan pages underperform even when sitemapped because they receive no PageRank. Every vertical incumbent runs the module (Fresha 8-salon carousel, Treatwell 3 with distance). It is also bounce recovery — users who don't convert on this salon stay in the directory.

**findme.hair implementation:** Two modules on every profile, server-rendered plain `<a href>` (Next.js SSR — never client-only mounts): (a) "Salons nearby" — 6–10 geographically closest profiles (Haversine on existing lat/lng), rendered as cards with photo, rating chip, distance ("0.8 km"); (b) "More salons in [Suburb]" — sibling links + one link up to the suburb page with its count. Anchor text = salon name + suburb, entity-rich. Add a Playwright assertion to `06_Operations/seo-regression-tests`: every profile contains ≥6 nearby-salon hrefs.

### 7. Suburb "at a glance" data block + one data-rich sentence above the grid

**Evidence:** Domain's market-trends table and Zillow's data→prose intro are the moat modules of the two biggest directory businesses in the country — real, dated, scannable numbers competitors can't fake (live captures + archived __NEXT_DATA__). John Mueller explicitly prefers 1–2 informative sentences above the listing grid over text blobs below it (https://www.seroundtable.com/google-content-bottom-ecommerce-category-pages-27171.html). Realtor.com's answer-first question heading ("What are the best neighborhoods in Austin? Some of the best are…") is built for snippet and AI citation.

**findme.hair implementation:** (a) One sentence above the grid: *"Compare 33 hair salons and barbers in Ballarat Central — real Google ratings, opening hours and booking links. (Updated [date])"* — live count, freshness stamp. (b) "[Suburb] at a glance" stat block: salon vs barber split, average Google rating across N total reviews, how many open Saturdays/Sundays, walk-in-friendly count, specialist-tag counts, most-reviewed salon. (c) Answer-first block: *"Which are the highest-rated salons in Ballarat Central?"* answered in one sentence naming the top 3 by weighted rating, each linked to its profile — pushes equity and entity association exactly where the AI-citation finding says it pays. (d) Keep the existing "About hair salons in [Suburb]" prose below the grid untouched — SearchPilot showed removing category text loses traffic. All additive; H1 and titles frozen.

### 8. Listing-card upgrade: photo, open-now dot, tap-to-call icon, identical attribute slots, weighted default sort

**Evidence:** Baymard: grid usability swings abandonment from 17–33% to 67–90%; every card must show the same essential attributes in the same sequence — users dismiss cards missing an attribute others show (https://baymard.com/blog/list-item-design-ecommerce). Photos drive +42% direction requests / +35% website clicks (BrightLocal GMB study); a card-level review snippet is the scent differentiator on Yelp/TA city pages; Yelp's card formula (thumb + name + rating + count + category + distance + one differentiator) is the proven scan unit. Default sort must not be alphabetical (Baymard: A–Z reads as a phone book and front-loads low-signal rows).

**findme.hair implementation:** Card spec (identical slots, every card): real photo thumbnail or branded black/gold placeholder (~80px, next/image, explicit dimensions) · name + suburb top-left · rating chip per Tactic 3 (consistent placeholder where no rating — never collapse the row) · type badge (already exists) · "Open now" green dot / "Closed · opens Tue 9am" where hours exist · first sentence of the AI description · max 2 service tags · 48dp tap-to-call icon right-aligned (card body links to profile; icons spaced to prevent mis-taps) · distance when geolocation granted. Default order = weighted rating × volume with claimed/photo-rich boosted; no-data listings normalised lower, never hidden. Max 3 badge types per grid (Open now / Walk-ins / ✓ Claimed) — more reads as clutter (NN/g).

### 9. Filter bottom sheet + map toggle on suburb pages — URL-less, lazy, list-first

**Evidence:** NN/g: mobile faceted search belongs in a bottom sheet with results visible behind it; apply button must carry the live count ("Show 18 salons"), never bare "Apply". Baymard: 38% of sites fail card/filter symmetry — anything shown on a card must be filterable. Domain ships List|Map as a toggle, not a default split; NN/g: list default always (denser, faster); Google Maps JS is a 200–400KB LCP/INP killer — load only on toggle tap. Critically, Google attributes ~half of crawl problems to faceted nav: filters must mint NO new crawlable URLs (https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation) — which the SEO freeze requires anyway.

**findme.hair implementation:** Surface the existing /search facets (type, service, open-now, walk-ins, 4★+, claimed) on every suburb/region page as a bottom sheet behind a floating "Filters (2)" pill; applied-filter chips at top of results, individually removable, + clear-all; state kept client-side only — zero new URLs. When a filter is applied, echo that attribute on each card (Baymard contextual rule). Floating bottom-centre "Map" pill toggles a full-screen lazy-initialised map with a swipeable bottom card carousel, pin ↔ card two-way linked (Airbnb pattern). The full server-rendered listing grid stays in the HTML regardless — crawlability never depends on the sheet or the map.

### 10. Photos as inventory and as claim-bait: real-count mosaic where they exist, designed pitch where they don't

**Evidence:** Photo volume is a proven lever — Airbnb pro photography = +19% bookings; Yelp businesses with ≥10 photos get up to 200% more views at the same review count (https://www.airbnb.com/e/pro-photography; Yelp stats via https://www.wiserreview.com). Airbnb's 5-photo mosaic + "Show all N" communicates depth without a click; the count itself is social proof. The incumbents leave non-paying venues as photo-less skeletons (Bookwell's unbookable tier, verified live) — findme.hair can out-build that tier across all 13,800.

**findme.hair implementation:** ≥5 photos (Google Places / owner uploads): mosaic hero + "See all 14 photos" (real count). 1–2 photos: single wide hero — never fake tiles, never stock. Zero photos: a designed black/gold empty state that IS the claim pitch: *"Photos are managed by the salon. Own [Salon Name]? Add yours free."* On the for-salons page, the quantified argument: "Businesses with 10+ photos get up to 200% more views" (attributed, third-party — real, citable). All images next/image with explicit dimensions (CLS = 0), lazy below fold.

---

## PART 2 — SALON PROFILE PAGE SPEC

The profile page is the asset: Bookwell's ~33K monthly visits land on profiles, AI engines cite individual salon pages, and owners google themselves into this exact page. It must convert three audiences at once — the consumer (call/book), the AI crawler (citable facts), and the owner (claim). Top to bottom, mobile-first:

**Viewport 1 (the page must sell in the first screen — NN/g: 57% of attention):**
1. **Breadcrumb** (exists — untouched) and **H1 salon name** (frozen) with the status chip beside it: gold "✓ Claimed by owner" or nothing in the hero for unclaimed (the unclaimed prompt lives lower — TA's grey label next to the name cheapens the page).
2. **Rating chip:** "4.9 ★ Excellent · 29 reviews on Google · as of June 2026" — anchor-links down to the review block.
3. **Live state line:** "Open now · closes 5:00 PM" / "Closed · opens tomorrow 8am" — the single most decision-relevant honest urgency on the page.
4. **Address + suburb**, type badge, top service tags as chips.
5. **Action row:** Book Now (gold, primary, where booking URL exists) · Call · Website · Directions. One visually dominant button per context (GoodUI #18); the rest outline style. Microcopy beneath: *"Booking opens the salon's own booking page. Calls go straight to the salon."* — kills the who-am-I-dealing-with anxiety unique to directories.

**Photo block:** per Tactic 10 — mosaic / single hero / claim-bait empty state.

**Highlights box** (Booking.com "Property highlights" pattern — 4–6 icon facts, only render what's real): rating, "Walk-ins welcome", specialty chips, wheelchair/parking attributes from Places, "✓ Claimed & verified" where true.

**The narrative paragraph** (Tactic 4 — formula in Part 4): the suburb-context fact block, server-rendered, unique per page.

**About** (existing AI-rewritten description — keep visible, not accordioned; this is the primary descriptive content and Bookwell's editorial spec is the bar: locality landmark + specialties + audience, ~150–200 words).

**Services/specialties:** chips for unclaimed listings ("Known for: balayage, men's cuts"); claimed salons that add a menu get the Treatwell compression — "Cuts (8) from $45" accordion, popular services first (Booksy). Empty state: *"Prices not listed yet — own this salon? Add your menu free."*

**Hours:** full weekly table in an accordion (server-rendered HTML — collapsed content carries full indexing weight under mobile-first, per Mueller/Illyes), with the open-now state always visible above. Empty state = claim prompt.

**Reviews block:** big rating + count + "on Google" logo attribution. If review text is available via Places API: 2–3 verbatim snippets with author name adjacent (ToS), linked out — keeps trust on-page instead of exporting it. If not stored: rating + count + "Read all reviews on Google" link. Never a synthesised histogram, never paraphrased sentiment.

**Owner interstitial (unclaimed pages)** — the Domain appraisal-interstitial slot: *"Own or work at [Salon Name]? Claim this free listing to update your details, add photos and see how many people viewed your page."* + **"Claim my free listing"** + three reassurance bullets (GoodUI #15): *Free forever · Takes 2 minutes · You control photos, hours & booking links.* Claimed pages: this slot renders the owner block ("Managed by [name] · details confirmed [date]").

**Map:** static image or lazy-init on tap — never load Maps JS on page load.

**"Salons nearby" card rail + "More salons in [Suburb]" links** (Tactic 6) — above the footer, server-rendered.

**Static FAQ-shaped block** from real data only ("Does X take walk-ins? — Yes, walk-ins welcome." / address/parking) — plain HTML, no new schema (frozen), gives the scannable Q&A shape without UGC (interactive Q&A is deliberately NOT built — dead on GBP, cold-start at 13,800 listings).

**Sticky bottom bar** (Tactic 1) persists throughout; desktop right-rail card scroll-pins with the claim line at its foot.

**Guardrails per template change:** diff rendered HTML before/after — H1/title/canonical/schema byte-identical, every previously-present `<a href>` still present, new links server-rendered; verify one profile via GSC URL Inspection; add Playwright assertions (nearby-links count, tel: link, sticky bar) to the regression suite before reporting done.

---

## PART 3 — SUBURB PAGE + CLAIM FUNNEL SPEC

### Suburb page (top to bottom)

1. **H1 + count headline** (exists, frozen) — count-first is already the right REA/Domain pattern.
2. **One data sentence above the grid** (Mueller placement): *"Compare 33 hair salons and barbers in Ballarat Central — real Google ratings, opening hours and booking links. (Updated 11 June 2026)"*
3. **"[Suburb] at a glance" stat block** (Tactic 7): the salon-edition market-trends table. Screenshot-able, AI-quotable, regenerates from Supabase.
4. **Answer-first block:** *"Which are the highest-rated salons in Ballarat Central?"* → one sentence, top 3 named and linked (weighted rating, min review threshold).
5. **Card rails above the full grid** (Domain listing-rails rhythm): "Top rated in Ballarat Central" · "Open this Saturday" · "Walk-ins welcome" — 2–3 horizontal rails, real data only, each card per the Tactic 8 spec.
6. **The full grid** — every active listing's `<a href>` server-rendered in the HTML. If a page ever needs pagination: real `?page=2` anchors, each self-canonical — never a JS-only Load More (Googlebot doesn't click buttons).
7. **Filters pill + bottom sheet, Map toggle pill** (Tactic 9) — floating, bottom-centre, URL-less.
8. **Mid-page claim interleave** (Zillow/Domain conversion-interleave pattern), directly under the top-rated rail: *"Run one of these salons? Claim your free listing to update photos, hours and booking links."*
9. **Existing "About hair salons in [Suburb]" prose** — kept, below grid, not grown. Editorial hand-grade upgrades (naming actual salon strips, Domain's "Welcome to Richmond" depth) reserved for the top-200-traffic suburbs over time — and these editorial blocks are the natural home for the occasional ShearGenius cross-link where genuinely relevant (e.g. a "what your stylist's scissors say about the salon" aside linking to sheargenius.com.au — editorial, never footer/sitewide).
10. **Nearby suburbs upgraded to counted links** (Zillow child-geography pattern): "Collingwood — 19 salons · 4.6★ avg" instead of bare names; plus category × location browse links in-body ("Barbers in Ballarat Central").

### Claim funnel (3 screens, one thumb)

**Entry points (in priority order):** unclaimed-profile interstitial + empty-data-slot prompts (the #1 channel — owners google themselves) · suburb-page interleave · for-salons page · transactional email when a listing's data changes ("your listing was updated — claim it to control it") · **the channel no competitor has:** Matt and Aaron physically stand in hundreds of these salons every week — a QR card "Claim your free findme.hair listing" handed over at the chair, plus ClickSend SMS to existing run clients.

**Screen 1 — Confirm:** salon prefilled from the page they came from (never make them search), photo/name/address shown. Button: **"Yes, this is my salon"**.

**Screen 2 — Verify (friction ladder, lowest first):**
- Email matching the listing's website domain → magic link (existing flow, stays primary).
- No website/domain match → SMS code to the phone number already ON the listing (verifies against public data, not user input — Yelp's anti-fraud trick).
- Neither → short manual-review form: "We'll verify within 2 business days."
- One field per screen. No passwords. No GBP-grade video/card-hold friction — unjustified at this fraud-risk level and it kills claim rates.

**Screen 3 — Success = straight into edit mode** with a 3-item checklist: ① Add photos (first — the 200%-views stat justifies the ordering) ② Confirm hours & services ③ Add your booking link. Log every step to `claim_events`.

**Post-claim retention (and the featured-tier primer):** monthly "Your page got N views, M calls this month" email from real event data (Tactic 5). This is the exact muscle that later sells the $35 featured tier — "your listing got 47 views and 9 calls; feature it to top your suburb" — without a single change needed at activation beyond flipping the Stripe switch and adding a small labelled "Featured" badge on the same card design at top of sort (the REA/Domain-proven, trust-safe rendering).

---

## PART 4 — COPY FORMULAS

### Suburb-page intro formula
> *"Compare [LIVE_COUNT] hair salons and barbers in [Suburb] — real Google ratings, opening hours and booking links. (Updated [DATE])"*

At-a-glance block, only clauses with data:
> *"[Suburb] has [N] hair salons and [M] barbers. The average rating is [X.X] stars across [TOTAL] Google reviews. [S] are open Saturdays, [W] take walk-ins, and [C] specialise in colour."*

Answer-first block:
> *"**Which are the highest-rated salons in [Suburb]?** [Salon A], [Salon B] and [Salon C] are currently the highest-rated of [Suburb]'s [N] listed salons, based on Google ratings and review volume."*

Rules: counts always live (the homepage DB number is the source of truth — never a frozen figure); round DOWN ("13,800+" not "15,000" — understated precision reads as honesty); every block carries its date.

### Profile-page narrative formula (assemble only true clauses, in this order)
1. **Position:** *"[Salon] is one of [N] hair salons and barbers listed in [Suburb]."*
2. **Rating (where ≥4.0 and count ≥5):** *"It holds a [X.X]-star rating from [N] reviews on Google"* + comparative clause only when flattering: *"— among the top-rated in the suburb."*
3. **Distinctive real fact:** *"It's one of only [N] [Suburb] salons open Sundays"* / *"one of [N] taking walk-ins"* / *"the most-reviewed salon in [Suburb]."*
4. **Service identity:** *"The salon is known for [specialty tags]."*
5. **Claim state:** *"Details confirmed by the owner"* or omit.

Worked example: *"H.Rose Studio is one of 33 hair salons and barbers listed in Ballarat Central and holds a 5.0-star rating from 29 reviews on Google — among the top-rated in the suburb. It's one of 4 Ballarat Central salons open Saturdays, and is known for colour and balayage work."*

### Claim CTA wording (locked)
- **The question that self-selects owners** (Google/TA pattern): *"Own or work at [Salon Name]?"*
- **The button, first-person possessive** (+90% CTR vs second-person, ContentVerve via https://unbounce.com): **"Claim my free listing"** — never "Submit", never "Claim listing".
- **The benefit triplet** (the line every major converged on): *"Update your details · Add photos · See how many people viewed your page."*
- **Reassurance bullets:** *Free forever · Takes 2 minutes · You control what customers see.*
- **Empty-slot variants:** *"Hours not listed yet — own this salon? Add them free."* / *"Photos are managed by the salon. Own [Salon Name]? Add yours free."*
- **Never:** "before someone else does", any price implication, any urgency that isn't the neutral fact of the unclaimed state itself.

---

## PART 5 — WHAT NOT TO DO (evidence-backed)

1. **No fake urgency — ever, in any form.** No "3 people viewing", no "booking fast", no countdowns. Booking.com's pressure widgets earned CMA undertakings, a €413M Spanish fine and a Dutch class action; the ACCC polices the identical line in Australia and findme.hair has zero real-time booking data to make any such claim true. The honest replacements are state, not pressure: "Open now · closes 5:30pm", "Walk-ins welcome", "Recently claimed" — all real, all rendered.

2. **Never show a naked star, a rounded star, or a synthesised review.** Stars without counts are actively distrusted (Baymard); 4.7 rounded to 5 lands in the perfection-reads-as-fake zone (Spiegel); a fabricated rating histogram or AI-invented review sentiment violates both the real-numbers rule and Google's Places ToS (attribution required, author names adjacent, no stale caching, max 5 reviews). And never selectively suppress low-rated listings — filtering negatives is itself an ACL violation; show all operating listings' real ratings or none.

3. **Don't let tonight's UX break the SEO that's frozen.** The three silent killers: (a) scroll-triggered lazy-loading of listing cards/links — Googlebot doesn't scroll; links that mount on scroll don't exist, and the orphan fix evaporates; (b) JS-only "Load More" replacing crawlable listing anchors — Googlebot doesn't click; (c) filters that mint parameter URLs — faceted nav is ~half of all crawl problems Google sees. Every listing `<a href>` server-rendered, filters client-side only, native `loading="lazy"` for images only. And ship in small batches per template with rendered-HTML diffs — Mueller: even "design-only" changes move rankings when DOM order and internal links shift.

4. **Don't remove or demote existing copy.** SearchPilot measured traffic LOSS from deleting category text. The "About hair salons in [Suburb]" blocks, existing browse links, and all current crawlable anchors stay. Tonight is additive-only — same discipline as the frozen H1s/titles/canonicals/schema.

5. **No badge clutter, and never conflate "verified" with "paid".** 1–3 trust-signal types beat 7+ (Baymard); cap grid badges at three. Yelp's paid "Verified" badge triggered a documented trust backlash — findme.hair's claimed/verified marks must always mean data truth (owner-claimed, Places-verified operating), free forever; "Featured" (when the dormant tier wakes) is a clearly-labelled placement product, visually distinct, never blended with verification. Also skip generic Norton-style seal rows — CXL: on an already-credible premium design they add anxiety, and consumers never pay on findme.hair anyway.

6. **Don't copy the incumbents' worst habits.** No Yelp-style competitor ads on profiles (the clean, ad-free profile is the differentiator AND strengthens the future featured pitch); no Tripadvisor interstitials/email-capture popups; no map-by-default (NN/g: list first; Maps JS kills LCP/INP for zero SEO value); no Cylex-style claim buried under "report incorrect data"; no GBP-grade verification friction; no alphabetical default sort; no generic "popular cities" footer link farms (SearchPilot tested: no uplift — spend the link budget on nearby/same-suburb contextual modules, which tested +7%); no interactive Q&A build (dead on GBP, cold-start poison at this scale).

7. **Don't ship dead ends or dead buttons.** Every profile gets a working primary CTA even with zero integration (Bookwell's "Call to book — phone bookings only" honesty); empty data slots render the claim pitch, never a blank; zero-results searches recover with nearest suburbs + counts (users abandon after 3–5 failed queries, half of sites give no path); a 2-button sticky bar beats a 3-button bar with one button that goes nowhere.

---

**Sequencing for tonight and the week:** Tactics 1 + 5 ship together first (sticky bar + event tracking — one component, the biggest consumer lift and the monetisation data layer in one pass). Tactics 2 + 3 + 8 are the second wave (claim mechanic, rating chips, card upgrade — both conversion goals move). Tactics 4 + 6 + 7 are the SEO/AI-citation compounders (narrative paragraphs, link rails, suburb data blocks) — server-rendered, batch-deployed per template with rendered-HTML diffs and new Playwright assertions in `06_Operations/seo-regression-tests` before any "done" is reported. Tactics 9 + 10 round out the polish. The annual "FindMe Hair Top Rated" badge program (top 10% by real Google rating, embeddable widget → backlinks + claims flywheel) is the post-redesign moat-builder — the one piece no booking-led incumbent is structurally positioned to copy.