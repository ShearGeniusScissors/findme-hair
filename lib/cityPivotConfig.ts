import type { AuState } from '@/types/database';

export interface CityConfig {
  name: string;
  slug: string;
  state: AuState;
  suburbs: string[];
}

// Shared 16-city set used across all city-pivot routes.
// Suburbs are the same as best-hairdresser/best-barber/mobile-hairdresser for cross-link symmetry.
export const PIVOT_CITIES: CityConfig[] = [
  { name: 'Melbourne', slug: 'melbourne', state: 'VIC', suburbs: ['melbourne', 'south yarra', 'fitzroy', 'richmond', 'carlton', 'collingwood', 'prahran', 'st kilda', 'brunswick', 'windsor'] },
  { name: 'Sydney', slug: 'sydney', state: 'NSW', suburbs: ['sydney', 'surry hills', 'bondi', 'paddington', 'newtown', 'darlinghurst', 'mosman', 'double bay', 'manly', 'balmain'] },
  { name: 'Brisbane', slug: 'brisbane', state: 'QLD', suburbs: ['brisbane', 'fortitude valley', 'south brisbane', 'west end', 'paddington', 'new farm', 'bulimba', 'woolloongabba', 'ascot', 'indooroopilly'] },
  { name: 'Perth', slug: 'perth', state: 'WA', suburbs: ['perth', 'subiaco', 'leederville', 'fremantle', 'mount lawley', 'claremont', 'nedlands', 'victoria park', 'scarborough', 'cottesloe'] },
  { name: 'Adelaide', slug: 'adelaide', state: 'SA', suburbs: ['adelaide', 'norwood', 'unley', 'glenelg', 'prospect', 'hyde park', 'north adelaide', 'burnside', 'henley beach', 'mitcham'] },
  { name: 'Hobart', slug: 'hobart', state: 'TAS', suburbs: ['hobart', 'north hobart', 'battery point', 'sandy bay', 'new town', 'moonah', 'glenorchy', 'kingston', 'bellerive', 'rosny'] },
  { name: 'Darwin', slug: 'darwin', state: 'NT', suburbs: ['darwin', 'stuart park', 'parap', 'fannie bay', 'nightcliff', 'casuarina', 'palmerston', 'rapid creek', 'woolner', 'larrakeyah'] },
  { name: 'Canberra', slug: 'canberra', state: 'ACT', suburbs: ['canberra', 'braddon', 'kingston', 'manuka', 'woden', 'belconnen', 'civic', 'dickson', 'fyshwick', 'griffith'] },
  { name: 'Ballarat', slug: 'ballarat', state: 'VIC', suburbs: ['ballarat', 'ballarat central', 'ballarat east', 'ballarat north', 'wendouree', 'lake wendouree', 'alfredton', 'mount pleasant', 'sebastopol', 'buninyong'] },
  { name: 'Geelong', slug: 'geelong', state: 'VIC', suburbs: ['geelong', 'geelong west', 'newtown', 'belmont', 'highton', 'pakington street', 'ocean grove', 'leopold', 'corio', 'grovedale'] },
  { name: 'Newcastle', slug: 'newcastle', state: 'NSW', suburbs: ['newcastle', 'newcastle east', 'hamilton', 'charlestown', 'lambton', 'merewether', 'adamstown', 'the junction', 'darby street', 'beaumont street'] },
  { name: 'Wollongong', slug: 'wollongong', state: 'NSW', suburbs: ['wollongong', 'fairy meadow', 'corrimal', 'thirroul', 'figtree', 'shellharbour', 'unanderra', 'dapto', 'bulli', 'austinmer'] },
  { name: 'Gold Coast', slug: 'gold-coast', state: 'QLD', suburbs: ['gold coast', 'surfers paradise', 'broadbeach', 'burleigh heads', 'palm beach', 'coolangatta', 'robina', 'southport', 'mermaid beach', 'currumbin'] },
  { name: 'Sunshine Coast', slug: 'sunshine-coast', state: 'QLD', suburbs: ['sunshine coast', 'maroochydore', 'noosa', 'mooloolaba', 'caloundra', 'buderim', 'nambour', 'coolum', 'noosaville', 'alexandra headland'] },
  { name: 'Townsville', slug: 'townsville', state: 'QLD', suburbs: ['townsville', 'north ward', 'south townsville', 'cranbrook', 'kirwan', 'aitkenvale', 'hyde park', 'pimlico', 'castletown', 'belgian gardens'] },
  { name: 'Cairns', slug: 'cairns', state: 'QLD', suburbs: ['cairns', 'cairns north', 'edge hill', 'parramatta park', 'manunda', 'westcourt', 'earlville', 'smithfield', 'palm cove', 'trinity beach'] },
];
