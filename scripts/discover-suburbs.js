#!/usr/bin/env node
/**
 * Discover every suburb inside a region that has at least one hair salon or
 * barber. Uses the Google Places (New) API's searchText endpoint across a
 * wide geographic bias, extracts every unique locality/sublocality from the
 * results, then upserts those suburbs into the `suburbs` table.
 *
 * Usage:
 *   node scripts/discover-suburbs.js --region=ballarat
 *   node scripts/discover-suburbs.js --region=geelong
 */

require('dotenv').config({ path: '.env.local' });
const { requireEnv, pgClient, slugify, sleep } = require('./_pipeline-lib');

requireEnv([
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_DB_PASSWORD',
  'GOOGLE_PLACES_API_KEY',
]);

// Region definitions.
//
// Regions with a `suburbs` array use EXPLICIT suburb lists — discovery
// geocodes each entry directly instead of letting Google Places text search
// pick suburbs. This is required for "Melbourne West" / "Adelaide North"
// style regions where the phrase also happens to be a real suburb name and
// Places returns the wrong geographic area (e.g. "Melbourne West VIC" matches
// the suburb "West Melbourne" in the CBD, not Werribee/Altona/Williamstown).
//
// Regions without `suburbs` use the Places text search discovery path —
// works well for distinct place names like Ballarat, Hobart, Bendigo.
const REGION_CENTRES = {
  // Phase 0 — regional VIC (pilot territories, already done)
  ballarat: { name: 'Ballarat', state: 'VIC', lat: -37.5622, lng: 143.8503, radius: 25000 },
  'ballarat-cbd': {
    name: 'Ballarat CBD', state: 'VIC', lat: -37.5622, lng: 143.8503, radius: 5000,
    suburbs: ['Ballarat Central', 'Golden Point', 'Soldiers Hill', 'Black Hill', 'Lake Wendouree', 'Lake Gardens', 'Redan', 'Bakery Hill', 'Ballarat East', 'Eureka', 'Newington'],
  },
  wendouree: {
    name: 'Wendouree', state: 'VIC', lat: -37.5395, lng: 143.8267, radius: 3000,
    suburbs: ['Wendouree', 'Invermay Park', 'Miners Rest', 'Mitchell Park', 'Cardigan', 'Cardigan Village', 'Winter Valley'],
  },
  sebastopol: {
    name: 'Sebastopol', state: 'VIC', lat: -37.5900, lng: 143.8600, radius: 3000,
    suburbs: ['Sebastopol', 'Delacombe', 'Mount Clear', 'Mount Helen', 'Buninyong', 'Smythes Creek', 'Canadian', 'Bonshaw'],
  },
  alfredton: {
    name: 'Alfredton', state: 'VIC', lat: -37.5500, lng: 143.8000, radius: 3000,
    suburbs: ['Alfredton', 'Lucas', 'Nerrina', 'Brown Hill', 'Warrenheip', 'Enfield', 'Learmonth', 'Windermere'],
  },
  'ballarat-east': {
    name: 'Ballarat East', state: 'VIC', lat: -37.5600, lng: 143.8700, radius: 3000,
    suburbs: ['Ballarat East', 'Brown Hill', 'Eureka', 'Canadian', 'Invermay', 'Ballarat North'],
  },
  geelong: { name: 'Geelong', state: 'VIC', lat: -38.1499, lng: 144.3617, radius: 30000 },

  // Phase 1 — Melbourne metro (explicit suburb lists)
  'melbourne-west': {
    name: 'Melbourne West', state: 'VIC', lat: -37.85, lng: 144.76, radius: 18000,
    suburbs: [
      'Werribee', 'Point Cook', 'Altona', 'Altona North', 'Altona Meadows',
      'Williamstown', 'Newport', 'Yarraville', 'Seddon', 'Spotswood',
      'Footscray', 'West Footscray', 'Sunshine', 'Sunshine North', 'Sunshine West',
      'Hoppers Crossing', 'Tarneit', 'Wyndham Vale', 'Truganina', 'Laverton',
      'Maidstone', 'Braybrook', 'Kingsville', 'Maribyrnong',
    ],
  },
  'melbourne-cbd': {
    name: 'Melbourne CBD', state: 'VIC', lat: -37.8136, lng: 144.9631, radius: 5000,
    suburbs: ['Melbourne', 'Docklands', 'Southbank', 'South Wharf', 'West Melbourne', 'East Melbourne'],
  },
  'melbourne-inner-north': {
    name: 'Melbourne Inner North', state: 'VIC', lat: -37.78, lng: 144.98, radius: 6000,
    suburbs: [
      'Fitzroy', 'Fitzroy North', 'Collingwood', 'Abbotsford', 'Brunswick',
      'Brunswick East', 'Brunswick West', 'Northcote', 'Thornbury', 'Carlton',
      'Carlton North', 'North Melbourne', 'Parkville', 'Clifton Hill', 'Princes Hill',
    ],
  },
  'melbourne-inner-south': {
    name: 'Melbourne Inner South', state: 'VIC', lat: -37.84, lng: 144.99, radius: 5000,
    suburbs: [
      'St Kilda', 'St Kilda East', 'St Kilda West', 'Balaclava', 'South Yarra',
      'Prahran', 'Windsor', 'Richmond', 'Cremorne', 'Albert Park', 'Middle Park',
      'South Melbourne', 'Port Melbourne', 'Elwood', 'Toorak',
    ],
  },
  'melbourne-east': {
    name: 'Melbourne East', state: 'VIC', lat: -37.82, lng: 145.12, radius: 15000,
    suburbs: [
      'Box Hill', 'Doncaster', 'Ringwood', 'Croydon', 'Mitcham', 'Blackburn',
      'Nunawading', 'Balwyn', 'Camberwell', 'Hawthorn', 'Kew', 'Glen Iris',
      'Burwood', 'Forest Hill', 'Vermont', 'Bulleen', 'Templestowe', 'Malvern',
    ],
  },
  'melbourne-north': {
    name: 'Melbourne North', state: 'VIC', lat: -37.73, lng: 145.05, radius: 15000,
    suburbs: [
      'Heidelberg', 'Preston', 'Reservoir', 'Epping', 'Bundoora', 'Coburg',
      'Pascoe Vale', 'Fawkner', 'Broadmeadows', 'Craigieburn', 'Glenroy',
      'Thomastown', 'Greensborough', 'Eltham', 'Ivanhoe', 'Mill Park', 'South Morang',
    ],
  },
  'melbourne-south-east': {
    name: 'Melbourne South East', state: 'VIC', lat: -37.98, lng: 145.22, radius: 20000,
    suburbs: [
      'Dandenong', 'Dandenong North', 'Frankston', 'Frankston South', 'Cranbourne',
      'Pakenham', 'Berwick', 'Narre Warren', 'Clayton', 'Oakleigh', 'Springvale',
      'Chelsea', 'Mentone', 'Cheltenham', 'Moorabbin', 'Bentleigh', 'Caulfield',
      'Glen Waverley', 'Mount Waverley', 'Carnegie', 'Mulgrave', 'Keysborough',
    ],
  },
  'mornington-peninsula': {
    name: 'Mornington Peninsula', state: 'VIC', lat: -38.22, lng: 145.05, radius: 20000,
    suburbs: [
      'Mornington', 'Rosebud', 'Sorrento', 'Rye', 'Hastings', 'Dromana',
      'Mount Martha', 'Portsea', 'Balnarring', 'Somerville', 'Mount Eliza',
      'Tyabb', 'Red Hill', 'Crib Point',
    ],
  },
  'yarra-valley': {
    name: 'Yarra Valley', state: 'VIC', lat: -37.65, lng: 145.52, radius: 20000,
    suburbs: [
      'Healesville', 'Lilydale', 'Yarra Glen', 'Warburton', 'Yarra Junction',
      'Coldstream', 'Chirnside Park', 'Mooroolbark', 'Seville', 'Woori Yallock',
      'Monbulk', 'Olinda',
    ],
  },

  // Phase 2 — Regional VIC (text-search discovery, distinct place names)
  bendigo: { name: 'Bendigo', state: 'VIC', lat: -36.7570, lng: 144.2794, radius: 20000 },
  shepparton: { name: 'Shepparton', state: 'VIC', lat: -36.3833, lng: 145.4000, radius: 15000 },
  warrnambool: { name: 'Warrnambool', state: 'VIC', lat: -38.3817, lng: 142.4856, radius: 15000 },
  mildura: { name: 'Mildura', state: 'VIC', lat: -34.1871, lng: 142.1586, radius: 15000 },

  // Phase 2b — Extended regional VIC towns
  colac: { name: 'Colac', state: 'VIC', lat: -38.3377, lng: 143.5853, radius: 12000 },
  portland: { name: 'Portland', state: 'VIC', lat: -38.3440, lng: 141.6040, radius: 12000 },
  horsham: { name: 'Horsham', state: 'VIC', lat: -36.7104, lng: 142.1999, radius: 12000 },
  hamilton: { name: 'Hamilton', state: 'VIC', lat: -37.7440, lng: 142.0199, radius: 12000 },
  ararat: { name: 'Ararat', state: 'VIC', lat: -37.2832, lng: 142.9285, radius: 10000 },
  stawell: { name: 'Stawell', state: 'VIC', lat: -37.0566, lng: 142.7766, radius: 10000 },
  wodonga: { name: 'Wodonga', state: 'VIC', lat: -36.1213, lng: 146.8880, radius: 15000 },
  wangaratta: { name: 'Wangaratta', state: 'VIC', lat: -36.3579, lng: 146.3076, radius: 12000 },
  traralgon: { name: 'Traralgon', state: 'VIC', lat: -38.1954, lng: 146.5401, radius: 15000 },
  sale: { name: 'Sale', state: 'VIC', lat: -38.1077, lng: 147.0658, radius: 12000 },
  bairnsdale: { name: 'Bairnsdale', state: 'VIC', lat: -37.8440, lng: 147.6077, radius: 12000 },
  echuca: { name: 'Echuca', state: 'VIC', lat: -36.1432, lng: 144.7517, radius: 12000 },
  'swan-hill': { name: 'Swan Hill', state: 'VIC', lat: -35.3378, lng: 143.5544, radius: 10000 },
  kerang: { name: 'Kerang', state: 'VIC', lat: -35.7237, lng: 143.9197, radius: 8000 },
  donald: { name: 'Donald', state: 'VIC', lat: -36.3667, lng: 142.9833, radius: 8000 },
  'ballarat-surrounds': { name: 'Ballarat Surrounds', state: 'VIC', lat: -37.7000, lng: 143.5000, radius: 20000 },
  'geelong-surrounds': { name: 'Geelong Surrounds', state: 'VIC', lat: -38.2000, lng: 144.0000, radius: 20000 },
  'apollo-bay': { name: 'Apollo Bay', state: 'VIC', lat: -38.7599, lng: 143.6715, radius: 10000 },
  'lakes-entrance': { name: 'Lakes Entrance', state: 'VIC', lat: -37.8811, lng: 147.9810, radius: 10000 },
  omeo: { name: 'Omeo', state: 'VIC', lat: -37.1001, lng: 147.5999, radius: 8000 },
  cobram: { name: 'Cobram', state: 'VIC', lat: -35.9222, lng: 145.6479, radius: 8000 },
  yarrawonga: { name: 'Yarrawonga', state: 'VIC', lat: -36.0224, lng: 145.9988, radius: 8000 },
  korumburra: { name: 'Korumburra', state: 'VIC', lat: -38.4333, lng: 145.8167, radius: 8000 },
  leongatha: { name: 'Leongatha', state: 'VIC', lat: -38.4742, lng: 145.9485, radius: 8000 },
  wonthaggi: { name: 'Wonthaggi', state: 'VIC', lat: -38.6024, lng: 145.5930, radius: 8000 },
  drouin: { name: 'Drouin', state: 'VIC', lat: -38.1333, lng: 145.8500, radius: 8000 },
  warragul: { name: 'Warragul', state: 'VIC', lat: -38.1636, lng: 145.9285, radius: 10000 },
  trafalgar: { name: 'Trafalgar', state: 'VIC', lat: -38.2167, lng: 146.1667, radius: 8000 },
  foster: { name: 'Foster', state: 'VIC', lat: -38.6500, lng: 146.1833, radius: 8000 },

  // Phase 9 — Melbourne West missing suburbs + Sunbury Run
  'bacchus-marsh': {
    name: 'Bacchus Marsh', state: 'VIC', lat: -37.6742, lng: 144.4371, radius: 8000,
    suburbs: ['Bacchus Marsh', 'Maddingley', 'Darley'],
  },
  melton: {
    name: 'Melton', state: 'VIC', lat: -37.6830, lng: 144.5794, radius: 8000,
    suburbs: ['Melton', 'Melton South', 'Melton West', 'Aintree'],
  },
  'caroline-springs': {
    name: 'Caroline Springs', state: 'VIC', lat: -37.7380, lng: 144.6350, radius: 5000,
    suburbs: ['Caroline Springs'],
  },
  'deer-park': {
    name: 'Deer Park', state: 'VIC', lat: -37.7741, lng: 144.6785, radius: 5000,
    suburbs: ['Deer Park'],
  },
  'laverton-north': {
    name: 'Laverton North', state: 'VIC', lat: -37.8200, lng: 144.7800, radius: 4000,
    suburbs: ['Laverton North'],
  },
  sunbury: {
    name: 'Sunbury', state: 'VIC', lat: -37.5762, lng: 144.7129, radius: 8000,
    suburbs: ['Sunbury', 'Diggers Rest'],
  },
  gisborne: {
    name: 'Gisborne', state: 'VIC', lat: -37.4898, lng: 144.5896, radius: 6000,
    suburbs: ['Gisborne', 'New Gisborne', 'Riddells Creek', 'Macedon', 'Mount Macedon'],
  },
  woodend: {
    name: 'Woodend', state: 'VIC', lat: -37.3522, lng: 144.5274, radius: 8000,
    suburbs: ['Woodend', 'Romsey', 'Lancefield'],
  },
  kyneton: {
    name: 'Kyneton', state: 'VIC', lat: -37.2442, lng: 144.4516, radius: 8000,
    suburbs: ['Kyneton', 'Malmsbury', 'Trentham'],
  },
  castlemaine: {
    name: 'Castlemaine', state: 'VIC', lat: -37.0685, lng: 144.2136, radius: 10000,
    suburbs: ['Castlemaine', 'Chewton', 'Harcourt', 'Newstead'],
  },
  daylesford: {
    name: 'Daylesford', state: 'VIC', lat: -37.3496, lng: 144.1441, radius: 8000,
    suburbs: ['Daylesford', 'Hepburn Springs', 'Hepburn', 'Creswick'],
  },
  'maryborough-vic': {
    name: 'Maryborough', state: 'VIC', lat: -37.0529, lng: 143.7352, radius: 8000,
    suburbs: ['Maryborough', 'Dunolly', 'Avoca', 'Talbot'],
  },

  // Phase 3 — Tasmania (text-search discovery)
  hobart: { name: 'Hobart', state: 'TAS', lat: -42.8821, lng: 147.3272, radius: 20000 },
  launceston: { name: 'Launceston', state: 'TAS', lat: -41.4332, lng: 147.1441, radius: 20000 },
  devonport: { name: 'Devonport', state: 'TAS', lat: -41.1806, lng: 146.3479, radius: 15000 },
  burnie: { name: 'Burnie', state: 'TAS', lat: -41.0654, lng: 145.9048, radius: 15000 },

  // Phase 4 — South Australia (explicit suburb lists for the 4 quadrants)
  'adelaide-cbd': {
    name: 'Adelaide CBD', state: 'SA', lat: -34.9285, lng: 138.6007, radius: 5000,
    suburbs: ['Adelaide', 'North Adelaide'],
  },
  'adelaide-north': {
    name: 'Adelaide North', state: 'SA', lat: -34.75, lng: 138.62, radius: 15000,
    suburbs: [
      'Salisbury', 'Elizabeth', 'Tea Tree Gully', 'Modbury', 'Golden Grove',
      'Mawson Lakes', 'Parafield Gardens', 'Paralowie', 'Ingle Farm',
    ],
  },
  'adelaide-south': {
    name: 'Adelaide South', state: 'SA', lat: -35.13, lng: 138.51, radius: 15000,
    suburbs: [
      'Morphett Vale', 'Noarlunga Centre', 'Christies Beach', 'Seaford',
      'Aldinga Beach', 'Brighton', 'Marion', 'Hallett Cove',
    ],
  },
  'adelaide-east': {
    name: 'Adelaide East', state: 'SA', lat: -34.92, lng: 138.68, radius: 10000,
    suburbs: ['Norwood', 'Campbelltown', 'Burnside', 'Magill', 'Stepney', 'Kensington', 'Payneham'],
  },
  'adelaide-west': {
    name: 'Adelaide West', state: 'SA', lat: -34.92, lng: 138.52, radius: 10000,
    suburbs: ['Glenelg', 'West Lakes', 'Henley Beach', 'Semaphore', 'Port Adelaide', 'Findon', 'West Beach'],
  },
  barossa: { name: 'Barossa Valley', state: 'SA', lat: -34.52, lng: 138.94, radius: 20000 },
  'mount-gambier': { name: 'Mount Gambier', state: 'SA', lat: -37.83, lng: 140.78, radius: 15000 },

  // Phase 5 — NT / ACT
  darwin: { name: 'Darwin', state: 'NT', lat: -12.4634, lng: 130.8456, radius: 15000 },
  canberra: { name: 'Canberra', state: 'ACT', lat: -35.2809, lng: 149.1300, radius: 15000 },

  // ═══════════════════════════════════════════════════════════════════
  // Phase 6 — NSW (Sydney metro zones + regional)
  // ═══════════════════════════════════════════════════════════════════
  'sydney-cbd': {
    name: 'Sydney CBD', state: 'NSW', lat: -33.8688, lng: 151.2093, radius: 3000,
    suburbs: ['Sydney CBD', 'Haymarket', 'Pyrmont', 'Ultimo',
      'Surry Hills', 'Darlinghurst', 'Potts Point', 'Kings Cross',
      'Woolloomooloo', 'Chippendale', 'Redfern', 'Waterloo'],
  },
  'sydney-inner-west': {
    name: 'Sydney Inner West', state: 'NSW', lat: -33.89, lng: 151.15, radius: 8000,
    suburbs: ['Newtown', 'Glebe', 'Leichhardt', 'Annandale',
      'Balmain', 'Rozelle', 'Drummoyne', 'Five Dock', 'Ashfield',
      'Summer Hill', 'Marrickville', 'Dulwich Hill', 'Petersham',
      'Stanmore', 'Enmore', 'St Peters', 'Sydenham', 'Tempe',
      'Camperdown', 'Forest Lodge', 'Lilyfield', 'Haberfield',
      'Croydon', 'Burwood', 'Strathfield', 'Homebush'],
  },
  'sydney-eastern-suburbs': {
    name: 'Sydney Eastern Suburbs', state: 'NSW', lat: -33.90, lng: 151.25, radius: 8000,
    suburbs: ['Bondi', 'Bondi Junction', 'Bondi Beach',
      'Double Bay', 'Rose Bay', 'Vaucluse', 'Watsons Bay',
      'Paddington', 'Woollahra', 'Edgecliff', 'Randwick',
      'Coogee', 'Maroubra', 'Kingsford', 'Kensington',
      'Eastgardens', 'Mascot', 'Zetland', 'Moore Park',
      'Centennial Park', 'Queens Park', 'Bronte', 'Waverley',
      'Tamarama', 'Clovelly', 'South Coogee'],
  },
  'sydney-north-shore': {
    name: 'Sydney North Shore', state: 'NSW', lat: -33.82, lng: 151.20, radius: 10000,
    suburbs: ['North Sydney', 'Crows Nest', 'St Leonards',
      'Artarmon', 'Chatswood', 'Lane Cove', 'Longueville',
      'Northwood', 'Ryde', 'Meadowbank', 'Gladesville',
      'Hunters Hill', 'Mosman', 'Neutral Bay', 'Cremorne',
      'Cammeray', 'Naremburn', 'Willoughby', 'Castlecrag',
      'Middle Cove', 'Northbridge', 'Forestville', 'Frenchs Forest',
      'Belrose', 'Davidson', 'Terrey Hills', 'Pymble',
      'Gordon', 'Killara', 'Lindfield', 'Roseville',
      'St Ives', 'Turramurra', 'Wahroonga', 'Waitara',
      'Hornsby', 'Asquith', 'Mount Colah', 'Berowra'],
  },
  'sydney-northern-beaches': {
    name: 'Sydney Northern Beaches', state: 'NSW', lat: -33.75, lng: 151.28, radius: 12000,
    suburbs: ['Manly', 'Dee Why', 'Brookvale', 'Warringah',
      'Freshwater', 'Curl Curl', 'Collaroy', 'Narrabeen',
      'Mona Vale', 'Newport', 'Avalon', 'Palm Beach',
      'Balgowlah', 'Seaforth', 'Clontarf', 'Fairlight',
      'Queenscliff', 'Allambie Heights', 'Beacon Hill',
      'Cromer', 'Wheeler Heights', 'Elanora Heights',
      'Ingleside', 'Warriewood', 'Bilgola'],
  },
  'sydney-west': {
    name: 'Sydney West', state: 'NSW', lat: -33.8688, lng: 150.90, radius: 15000,
    suburbs: ['Parramatta', 'Westmead', 'Merrylands',
      'Granville', 'Auburn', 'Lidcombe', 'Berala',
      'Regents Park', 'Woodville', 'Guildford', 'Yennora',
      'Fairfield', 'Cabramatta', 'Canley Vale', 'Canley Heights',
      'Wetherill Park', 'Smithfield', 'Prairiewood',
      'Bossley Park', 'Edensor Park', 'St Johns Park',
      'Wakeley', 'Greenfield Park', 'Abbotsbury',
      'Blacktown', 'Seven Hills', 'Toongabbie', 'Kings Langley',
      'Baulkham Hills', 'Castle Hill', 'Pennant Hills',
      'Cherrybrook', 'Dural', 'Kellyville', 'Rouse Hill',
      'Stanhope Gardens', 'The Ponds', 'Schofields',
      'Riverstone', 'Windsor', 'Richmond', 'Penrith',
      'Kingswood', 'Werrington', 'St Marys', 'Mount Druitt',
      'Rooty Hill', 'Doonside', 'Quakers Hill'],
  },
  'sydney-south-west': {
    name: 'Sydney South West', state: 'NSW', lat: -33.95, lng: 150.90, radius: 15000,
    suburbs: ['Liverpool', 'Moorebank', 'Casula', 'Warwick Farm',
      'Lurnea', 'Cartwright', 'Miller', 'Green Valley',
      'Hinchinbrook', 'Hoxton Park', 'Prestons', 'Edmondson Park',
      'Ingleburn', 'Minto', 'Campbelltown', 'Macquarie Fields',
      'Glenfield', 'Caringbah', 'Miranda', 'Cronulla',
      'Sutherland', 'Jannali', 'Como', 'Gymea',
      'Hurstville', 'Kogarah', 'Rockdale', 'Banksia',
      'Arncliffe', 'Wolli Creek', 'Kingsgrove', 'Beverly Hills',
      'Penshurst', 'Mortdale', 'Oatley', 'Lugarno',
      'Padstow', 'Revesby', 'Panania', 'Bankstown',
      'Yagoona', 'Greenacre', 'Lakemba', 'Wiley Park',
      'Punchbowl', 'Roselands', 'Canterbury', 'Campsie',
      'Belmore', 'Condell Park', 'Bass Hill'],
  },
  'sydney-inner-south': {
    name: 'Sydney Inner South', state: 'NSW', lat: -33.92, lng: 151.18, radius: 6000,
    suburbs: ['Alexandria', 'Erskineville', 'Beaconsfield',
      'Rosebery', 'Zetland', 'Hillsdale', 'Pagewood',
      'Botany', 'Banksmeadow', 'Port Botany'],
  },

  // Regional NSW
  newcastle: { name: 'Newcastle', state: 'NSW', lat: -32.9283, lng: 151.7817, radius: 20000 },
  wollongong: { name: 'Wollongong', state: 'NSW', lat: -34.4278, lng: 150.8931, radius: 20000 },
  'central-coast': { name: 'Central Coast', state: 'NSW', lat: -33.4333, lng: 151.3333, radius: 20000 },
  albury: { name: 'Albury', state: 'NSW', lat: -36.0737, lng: 146.9135, radius: 15000 },
  'wagga-wagga': { name: 'Wagga Wagga', state: 'NSW', lat: -35.1082, lng: 147.3598, radius: 15000 },
  orange: { name: 'Orange', state: 'NSW', lat: -33.2833, lng: 149.1000, radius: 12000 },
  dubbo: { name: 'Dubbo', state: 'NSW', lat: -32.2569, lng: 148.6011, radius: 12000 },
  tamworth: { name: 'Tamworth', state: 'NSW', lat: -31.0833, lng: 150.9167, radius: 12000 },
  'port-macquarie': { name: 'Port Macquarie', state: 'NSW', lat: -31.4333, lng: 152.9167, radius: 12000 },
  'coffs-harbour': { name: 'Coffs Harbour', state: 'NSW', lat: -30.2986, lng: 153.1094, radius: 12000 },
  lismore: { name: 'Lismore', state: 'NSW', lat: -28.8167, lng: 153.2833, radius: 12000 },
  ballina: { name: 'Ballina', state: 'NSW', lat: -28.8644, lng: 153.5619, radius: 10000 },
  'byron-bay': { name: 'Byron Bay', state: 'NSW', lat: -28.6474, lng: 153.6020, radius: 10000 },
  'tweed-heads': { name: 'Tweed Heads', state: 'NSW', lat: -28.1744, lng: 153.5478, radius: 12000 },
  griffith: { name: 'Griffith', state: 'NSW', lat: -34.2885, lng: 146.0591, radius: 10000 },
  bathurst: { name: 'Bathurst', state: 'NSW', lat: -33.4194, lng: 149.5778, radius: 12000 },

  // ═══════════════════════════════════════════════════════════════════
  // Phase 7 — QLD (Brisbane metro zones + regional)
  // ═══════════════════════════════════════════════════════════════════
  'brisbane-cbd': {
    name: 'Brisbane CBD', state: 'QLD', lat: -27.4698, lng: 153.0251, radius: 3000,
    suburbs: ['Brisbane CBD', 'Spring Hill', 'Fortitude Valley',
      'New Farm', 'Teneriffe', 'Newstead', 'Bowen Hills',
      'Herston', 'Kelvin Grove', 'Red Hill', 'Paddington',
      'Petrie Terrace', 'Milton', 'Toowong', 'Auchenflower'],
  },
  'brisbane-inner-south': {
    name: 'Brisbane Inner South', state: 'QLD', lat: -27.50, lng: 153.02, radius: 8000,
    suburbs: ['South Brisbane', 'West End', 'Highgate Hill',
      'Annerley', 'Woolloongabba', 'Kangaroo Point',
      'East Brisbane', 'Coorparoo', 'Camp Hill', 'Greenslopes',
      'Holland Park', 'Mount Gravatt', 'Tarragindi', 'Salisbury',
      'Moorooka', 'Rocklea', 'Yeronga', 'Yeerongpilly',
      'Tennyson', 'Graceville', 'Chelmer', 'Sherwood',
      'Corinda', 'Oxley', 'Darra', 'Wacol', 'Inala',
      'Durack', 'Calamvale', 'Stretton', 'Sunnybank',
      'Sunnybank Hills', 'Runcorn', 'Carindale', 'Belmont',
      'Tingalpa', 'Wynnum', 'Manly', 'Lota', 'Birkdale'],
  },
  'brisbane-north': {
    name: 'Brisbane North', state: 'QLD', lat: -27.38, lng: 153.02, radius: 12000,
    suburbs: ['Chermside', 'Aspley', 'Stafford', 'Gordon Park',
      'Lutwyche', 'Windsor', 'Wilston', 'Newmarket',
      'Alderley', 'Enoggera', 'Gaythorne', 'Mitchelton',
      'Everton Park', 'Ferny Grove', 'Keperra', 'The Gap',
      'Ashgrove', 'Bardon', 'Taringa', 'Indooroopilly',
      'Fig Tree Pocket', 'Kenmore', 'Chapel Hill', 'Pullenvale',
      'Brookfield', 'Moggill', 'Bellbowrie', 'Jindalee',
      'Middle Park', 'Sinnamon Park', 'Sumner', 'Doolandella',
      'Forest Lake', 'Riverhills', 'Mount Ommaney',
      'Bridgeman Downs', 'Albany Creek', 'Eatons Hill',
      'Bald Hills', 'Bracken Ridge', 'Sandgate', 'Shorncliffe',
      'Deagon', 'Boondall', 'Zillmere', 'Geebung',
      'Virginia', 'Nudgee', 'Banyo', 'Northgate',
      'Nundah', 'Clayfield', 'Ascot', 'Hamilton',
      'Hendra', 'Wavell Heights', 'Kedron', 'Wooloowin'],
  },
  'brisbane-east': {
    name: 'Brisbane East', state: 'QLD', lat: -27.47, lng: 153.12, radius: 10000,
    suburbs: ['Capalaba', 'Alexandra Hills', 'Thorneside',
      'Ormiston', 'Cleveland', 'Redland Bay', 'Victoria Point',
      'Sheldon', 'Chandler', 'Wakerley', 'Murarrie',
      'Hemmant', 'Lytton', 'Wynnum West', 'Gumdale',
      'Ransome', 'Bridgeman Downs'],
  },
  'gold-coast': {
    name: 'Gold Coast', state: 'QLD', lat: -28.0167, lng: 153.40, radius: 25000,
    suburbs: ['Surfers Paradise', 'Broadbeach', 'Burleigh Heads',
      'Palm Beach', 'Coolangatta', 'Southport', 'Labrador',
      'Biggera Waters', 'Runaway Bay', 'Arundel', 'Parkwood',
      'Molendinar', 'Nerang', 'Robina', 'Varsity Lakes',
      'Mudgeeraba', 'Worongary', 'Tallai', 'Bonogin',
      'Elanora', 'Currumbin', 'Tugun', 'Bilinga',
      'Miami', 'Mermaid Beach', 'Mermaid Waters',
      'Clear Island Waters', 'Benowa', 'Carrara',
      'Merrimac', 'Helensvale', 'Coomera', 'Hope Island',
      'Oxenford', 'Upper Coomera', 'Pimpama', 'Ormeau',
      'Yatala', 'Beenleigh', 'Springwood', 'Slacks Creek',
      'Kingston', 'Logan Central', 'Woodridge', 'Browns Plains',
      'Marsden', 'Loganlea', 'Meadowbrook', 'Logan Reserve'],
  },
  'sunshine-coast': {
    name: 'Sunshine Coast', state: 'QLD', lat: -26.65, lng: 153.0667, radius: 25000,
    suburbs: ['Noosa Heads', 'Noosaville', 'Tewantin', 'Cooroy',
      'Nambour', 'Maroochydore', 'Mooloolaba', 'Buddina',
      'Kawana Waters', 'Bokarina', 'Warana', 'Birtinya',
      'Caloundra', 'Kings Beach', 'Bulcock Beach', 'Pelican Waters',
      'Little Mountain', 'Sippy Downs', 'Mountain Creek',
      'Buderim', 'Forest Glen', 'Palmwoods', 'Maleny',
      'Landsborough', 'Glass House Mountains', 'Beerwah',
      'Cooroibah', 'Pomona', 'Cooran', 'Tinbeerwah'],
  },

  // Regional QLD
  townsville: { name: 'Townsville', state: 'QLD', lat: -19.2590, lng: 146.8169, radius: 20000 },
  cairns: { name: 'Cairns', state: 'QLD', lat: -16.9186, lng: 145.7781, radius: 20000 },
  toowoomba: { name: 'Toowoomba', state: 'QLD', lat: -27.5598, lng: 151.9507, radius: 15000 },
  mackay: { name: 'Mackay', state: 'QLD', lat: -21.1411, lng: 149.1861, radius: 15000 },
  rockhampton: { name: 'Rockhampton', state: 'QLD', lat: -23.3791, lng: 150.5100, radius: 15000 },
  bundaberg: { name: 'Bundaberg', state: 'QLD', lat: -24.8661, lng: 152.3489, radius: 15000 },
  'hervey-bay': { name: 'Hervey Bay', state: 'QLD', lat: -25.29, lng: 152.85, radius: 12000 },
  gladstone: { name: 'Gladstone', state: 'QLD', lat: -23.8427, lng: 151.2549, radius: 12000 },

  // ═══════════════════════════════════════════════════════════════════
  // Phase 8 — WA (Perth metro zones)
  // ═══════════════════════════════════════════════════════════════════
  'perth-cbd': {
    name: 'Perth CBD', state: 'WA', lat: -31.9505, lng: 115.8605, radius: 3000,
    suburbs: ['Perth CBD', 'Northbridge', 'Leederville',
      'North Perth', 'Mount Lawley', 'Highgate', 'East Perth',
      'West Perth', 'Subiaco', 'Shenton Park', 'Nedlands',
      'Crawley', 'Floreat', 'City Beach'],
  },
  'perth-north': {
    name: 'Perth North', state: 'WA', lat: -31.80, lng: 115.85, radius: 15000,
    suburbs: ['Joondalup', 'Edgewater', 'Kingsley', 'Woodvale',
      'Beldon', 'Craigie', 'Hillarys', 'Padbury',
      'Duncraig', 'Karrinyup', 'Gwelup', 'Innaloo',
      'Scarborough', 'Doubleview', 'Stirling', 'Balga',
      'Nollamara', 'Mirrabooka', 'Westminster', 'Morley',
      'Noranda', 'Beechboro', 'Bassendean', 'Bayswater',
      'Maylands', 'Inglewood', 'Bedford', 'Osborne Park',
      'Wembley', 'Glendalough', 'Tuart Hill', 'Yokine',
      'Coolbinia', 'Menora', 'Joondanna', 'Herdsman',
      'Wanneroo', 'Landsdale', 'Ballajura', 'Malaga',
      'Whiteman', 'Ellenbrook', 'The Vines', 'Upper Swan',
      'Mundaring', 'Midland', 'Guildford', 'Ashfield',
      'Redcliffe', 'Belmont', 'Cloverdale', 'Kewdale'],
  },
  'perth-south': {
    name: 'Perth South', state: 'WA', lat: -32.05, lng: 115.85, radius: 15000,
    suburbs: ['Fremantle', 'Hilton', 'Hamilton Hill',
      'Spearwood', 'Coogee', 'Cockburn Central', 'Success',
      'Atwell', 'Jandakot', 'South Lake', 'Bibra Lake',
      'Yangebup', 'Munster', 'Beeliar', 'Rockingham',
      'Mandurah', 'Warnbro', 'Safety Bay', 'Baldivis',
      'Wellard', 'Armadale', 'Gosnells', 'Canning Vale',
      'Thornlie', 'Huntingdale', 'Maddington', 'Kenwick',
      'Beckenham', 'Cannington', 'Riverton', 'Willetton',
      'Leeming', 'Bull Creek', 'Booragoon', 'Myaree',
      'Melville', 'Applecross', 'Palmyra', 'East Fremantle',
      'Bicton', 'Murdoch', 'Kardinya', 'Winthrop',
      'Bateman', 'Shelley', 'Ferndale', 'Lynwood',
      'Langford', 'Victoria Park', 'South Perth', 'Como'],
  },
  'perth-east': {
    name: 'Perth East', state: 'WA', lat: -31.95, lng: 116.05, radius: 12000,
    suburbs: ['Kalamunda', 'Forrestfield', 'High Wycombe',
      'Maida Vale', 'Wattle Grove', 'Lesmurdie', 'Carmel',
      'Pickering Brook', 'Swan View', 'Midvale', 'Helena Valley',
      'Baskerville', 'Herne Hill', 'Millendon', 'Stratton'],
  },
  'perth-west': {
    name: 'Perth West', state: 'WA', lat: -31.92, lng: 115.75, radius: 8000,
    suburbs: ['Cottesloe', 'Peppermint Grove', 'Claremont',
      'Swanbourne', 'North Fremantle', 'East Fremantle',
      'Bicton', 'Attadale', 'Applecross', 'Ardross',
      'Mount Pleasant', 'Booragoon', 'Alfred Cove',
      'Melville', 'Palmyra', 'Karrakatta', 'Floreat',
      'Wembley Downs', 'City Beach', 'Churchlands',
      'Woodlands', 'Hamersley', 'Balcatta', 'Carine',
      'Duncraig', 'Warwick', 'Greenwood', 'Madeley'],
  },

  // Regional WA
  bunbury: { name: 'Bunbury', state: 'WA', lat: -33.3271, lng: 115.6414, radius: 15000 },
  geraldton: { name: 'Geraldton', state: 'WA', lat: -28.7774, lng: 114.6152, radius: 15000 },
  kalgoorlie: { name: 'Kalgoorlie', state: 'WA', lat: -30.7489, lng: 121.4658, radius: 12000 },
  albany: { name: 'Albany', state: 'WA', lat: -35.0228, lng: 117.8814, radius: 12000 },
  busselton: { name: 'Busselton', state: 'WA', lat: -33.6554, lng: 115.3469, radius: 12000 },
  'margaret-river': { name: 'Margaret River', state: 'WA', lat: -33.9632, lng: 115.075, radius: 10000 },
  broome: { name: 'Broome', state: 'WA', lat: -17.9614, lng: 122.2359, radius: 12000 },
  'port-hedland': { name: 'Port Hedland', state: 'WA', lat: -20.37, lng: 118.59, radius: 10000 },
  karratha: { name: 'Karratha', state: 'WA', lat: -20.7364, lng: 116.846, radius: 10000 },
};

async function searchText(query, centre) {
  const body = {
    textQuery: query,
    locationBias: {
      circle: { center: { latitude: centre.lat, longitude: centre.lng }, radius: centre.radius },
    },
    maxResultCount: 20,
  };
  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.types',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Places searchText ${resp.status}: ${text}`);
  }
  const json = await resp.json();
  return json.places || [];
}

async function geocode(suburbName, state) {
  const q = encodeURIComponent(`${suburbName} ${state} Australia`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${process.env.GOOGLE_PLACES_API_KEY}&region=au`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const json = await resp.json();
  const result = json.results?.[0];
  if (!result) return null;
  const comps = result.address_components || [];
  const postcode = comps.find((c) => c.types.includes('postal_code'))?.long_name ?? null;
  return {
    lat: result.geometry?.location?.lat ?? null,
    lng: result.geometry?.location?.lng ?? null,
    postcode,
  };
}

function suburbFromPlace(place) {
  const comps = place.addressComponents || [];
  const find = (t) => comps.find((c) => (c.types || []).includes(t))?.longText;
  return find('locality') || find('sublocality') || find('sublocality_level_1');
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith('--region='));
  if (!arg) {
    console.error('Usage: node scripts/discover-suburbs.js --region=<slug>');
    process.exit(1);
  }
  const regionSlug = arg.split('=')[1];
  const centre = REGION_CENTRES[regionSlug];
  if (!centre) {
    console.error(`Unknown region: ${regionSlug}. Known: ${Object.keys(REGION_CENTRES).join(', ')}`);
    process.exit(1);
  }

  console.log(`📍 Discovering suburbs in ${centre.name}, ${centre.state}`);

  const pg = pgClient();
  await pg.connect();

  // Make sure the region row exists
  const reg = await pg.query(
    `INSERT INTO regions (name, state, slug) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, slug`,
    [centre.name, centre.state, regionSlug],
  );
  const regionId = reg.rows[0].id;

  const suburbSet = new Map(); // key: region-scoped slug -> { name, state }
  let apiCalls = 0;

  if (Array.isArray(centre.suburbs) && centre.suburbs.length > 0) {
    // Explicit suburb list — skip Places text discovery, go straight to geocoding
    console.log(`  → using explicit suburb list (${centre.suburbs.length} suburbs)`);
    for (const name of centre.suburbs) {
      const suburbSlug = slugify(`${regionSlug}-${name}`);
      suburbSet.set(suburbSlug, { name, state: centre.state });
    }
  } else {
    // Discovery via Google Places text search
    const queries = [
      `hair salon in ${centre.name} ${centre.state}`,
      `barber in ${centre.name} ${centre.state}`,
      `hairdresser in ${centre.name} ${centre.state}`,
    ];
    for (const q of queries) {
      console.log(`  → searching: ${q}`);
      const places = await searchText(q, centre);
      apiCalls++;
      places.forEach((p) => {
        const s = suburbFromPlace(p);
        if (s) {
          // Prefix with regionSlug so Richmond in Melbourne and Richmond in Tassie
          // don't collide on the globally-unique suburbs.slug column.
          const suburbSlug = slugify(`${regionSlug}-${s}`);
          suburbSet.set(suburbSlug, { name: s, state: centre.state });
        }
      });
      await sleep(150);
    }
  }

  console.log(`  → found ${suburbSet.size} unique suburbs`);

  let inserted = 0;
  let skipped = 0;
  for (const [slug, info] of suburbSet) {
    const geo = await geocode(info.name, info.state);
    apiCalls++;
    await sleep(100);
    try {
      const { rowCount } = await pg.query(
        `INSERT INTO suburbs (name, region_id, state, slug, postcode, lat, lng)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET postcode = EXCLUDED.postcode, lat = EXCLUDED.lat, lng = EXCLUDED.lng
         WHERE suburbs.postcode IS NULL OR suburbs.lat IS NULL`,
        [info.name, regionId, info.state, slug, geo?.postcode, geo?.lat, geo?.lng],
      );
      if (rowCount > 0) {
        inserted++;
        console.log(`    + ${info.name} (${geo?.postcode ?? '—'})`);
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`    ✗ ${info.name}: ${err.message}`);
    }
  }

  console.log(
    `\n✅ Discovered ${suburbSet.size} suburbs (${inserted} new, ${skipped} already present). ${apiCalls} Google API calls.`,
  );

  await pg.end();
}

main().catch((err) => {
  console.error('❌ discover-suburbs failed:', err);
  process.exit(1);
});
