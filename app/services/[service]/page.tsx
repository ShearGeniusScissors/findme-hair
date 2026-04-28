import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BusinessCard from '@/components/BusinessCard';
import JsonLd from '@/components/JsonLd';
import { stateName, titleCase } from '@/lib/geo';
import { supabaseServerAnon } from '@/lib/supabase';
import type { Business, BusinessType } from '@/types/database';

export const revalidate = 3600; // ISR — regenerate at most once per hour

interface ServiceConfig {
  slug: string;
  name: string;
  h1: string;
  description: string;
  metaDescription: string;
  businessTypes: BusinessType[];
  nameKeywords?: string[]; // search business names for these keywords
  specialtyTag?: string; // matches businesses.specialties[] column
  content: {
    intro: string;
    whatToLook: string[];
    closing: string;
    proTip?: { text: string; linkText: string; linkHref: string };
  };
}

const SERVICES: ServiceConfig[] = [
  {
    slug: 'mobile-hairdresser',
    name: 'Mobile Hairdressers',
    h1: 'Mobile Hairdressers in Australia',
    description: 'Hair stylists who come to you',
    metaDescription: 'Find mobile hairdressers near you. Stylists who come to your home or office across Australia. Verified listings with reviews.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['mobile'],
    specialtyTag: 'mobile',
    content: {
      intro: 'Mobile hairdressers bring the salon experience to your home, office, or event. They\'re ideal for busy professionals, new parents, people with mobility challenges, or anyone who prefers the convenience of at-home service.',
      whatToLook: [
        'Check if they bring their own equipment (basin, chair, dryer)',
        'Ask about travel fees — most charge extra beyond a certain radius',
        'Verify they carry professional-grade products',
        'Confirm they have public liability insurance',
      ],
      closing: 'Mobile hairdressing is one of the fastest-growing segments of the Australian hair industry. Many experienced salon stylists now offer mobile services alongside their regular bookings.',
      proTip: { text: 'Mobile stylists need reliable tools that stay sharp between salon visits. Professional scissors benefit from regular sharpening —', linkText: 'ShearGenius offers Australia-wide mail-in sharpening', linkHref: 'https://www.sheargenius.com.au/pages/hairdressing-scissor-sharpening-service' },
    },
  },
  {
    slug: 'balayage-specialist',
    name: 'Balayage Specialists',
    h1: 'Balayage Specialists in Australia',
    description: 'Expert balayage colourists',
    metaDescription: 'Find balayage specialists near you. Expert colourists across Australia with verified reviews and online booking.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['balayage', 'colour', 'color'],
    specialtyTag: 'balayage',
    content: {
      intro: 'Balayage is a freehand colour technique that creates natural, sun-kissed highlights. Unlike traditional foil highlights, balayage is painted directly onto the hair for a softer, more blended result. It\'s one of the most requested services in Australian salons.',
      whatToLook: [
        'Ask to see their portfolio — balayage is a skill that varies hugely between stylists',
        'Check if they offer a consultation before booking (essential for colour changes)',
        'Ask about maintenance — good balayage grows out gracefully over 8-12 weeks',
        'Enquire about the products they use (Olaplex, Redken, etc.)',
      ],
      closing: 'The best balayage stylists have years of colour training and regularly update their techniques. Look for salons that specifically list balayage as a service, not just general colouring.',
    },
  },
  {
    slug: 'curly-hair-specialist',
    name: 'Curly Hair Specialists',
    h1: 'Curly Hair Specialists in Australia',
    description: 'Stylists trained in curly and textured hair',
    metaDescription: 'Find curly hair specialists near you. Stylists trained in DevaCurl, curly cuts, and textured hair across Australia.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['curl', 'curly', 'texture', 'natural'],
    specialtyTag: 'curly-hair',
    content: {
      intro: 'Curly hair needs a specialist touch. Standard cutting techniques designed for straight hair can ruin curl patterns and create unwanted bulk. Curly hair specialists understand curl types, shrinkage, and how to cut for shape and bounce.',
      whatToLook: [
        'Ask if they cut curly hair dry — this is the gold standard for curly cuts',
        'Check if they\'re trained in specific methods (DevaCurl, Lorraine Massey, Ouidad)',
        'Look for stylists who understand different curl types (2A through 4C)',
        'Ask about their experience with chemical-free styling and diffusing techniques',
      ],
      closing: 'The curly hair movement in Australia has grown significantly, and more stylists are specialising in textured hair. If you\'ve had bad experiences with hairdressers who don\'t understand your curls, a specialist will change your perspective.',
    },
  },
  {
    slug: 'colour-correction',
    name: 'Colour Correction Specialists',
    h1: 'Colour Correction Specialists in Australia',
    description: 'Fixing hair colour gone wrong',
    metaDescription: 'Find colour correction specialists near you. Expert colourists who fix colour disasters across Australia. Verified reviews.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['colour', 'color', 'correction'],
    specialtyTag: 'colour-correction',
    content: {
      intro: 'Colour correction is the process of fixing hair colour that hasn\'t turned out as expected — whether from a salon mistake, at-home dye, or accumulated colour build-up. It\'s one of the most technically demanding services in hairdressing.',
      whatToLook: [
        'Always book a consultation first — good colourists won\'t commit to a fix without seeing your hair',
        'Expect multiple sessions for major corrections (dark to light can take 3-4 visits)',
        'Ask about pricing upfront — corrections are charged by time, typically $100-$200/hour',
        'Check their reviews specifically for colour correction work',
      ],
      closing: 'Colour correction requires deep knowledge of chemistry and colour theory. It\'s not a service to bargain-hunt for — an experienced colourist who charges more will almost certainly deliver a better result and preserve your hair\'s health.',
    },
  },
  {
    slug: 'barber',
    name: 'Barber Shops',
    h1: 'Barber Shops in Australia',
    description: 'Traditional and modern barber shops',
    metaDescription: 'Find barber shops near you. Men\'s haircuts, fades, and traditional shaves across Australia. Verified listings with reviews.',
    businessTypes: ['barber'],
    specialtyTag: 'barber',
    content: {
      intro: 'Australian barber shops range from traditional old-school shops with hot towel shaves to modern style bars offering fades, designs, and grooming services. Whether you want a classic short back and sides or a contemporary skin fade, there\'s a barber for you.',
      whatToLook: [
        'Walk-in vs booking — some barbers are walk-in only, while others take appointments',
        'Ask about their specialties — fades, razor work, and beard grooming are all distinct skills',
        'Check if they offer hot towel shaves (not all barbers do anymore)',
        'Look at recent reviews mentioning the specific barber you\'d see',
      ],
      closing: 'The Australian barbering scene has experienced a renaissance, with a new generation of skilled barbers blending traditional techniques with modern trends. Visit our directory to find the highest-rated barbers in your area.',
      proTip: { text: 'A great barber invests in quality tools. Professional Japanese steel barber scissors make a noticeable difference in cut precision — look for brands like', linkText: 'ShearGenius', linkHref: 'https://www.sheargenius.com.au/pages/barber-scissors' },
    },
  },
  {
    slug: 'bridal-hair',
    name: 'Bridal Hair Specialists',
    h1: 'Bridal Hair Specialists in Australia',
    description: 'Wedding and event hair stylists',
    metaDescription: 'Find bridal hair specialists near you. Wedding hairstylists with trials, on-location service, and bridal party packages across Australia.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['bridal', 'wedding', 'event'],
    specialtyTag: 'bridal',
    content: {
      intro: 'Your wedding day hairstyle needs to last from morning to midnight, look perfect in photos, and make you feel incredible. Bridal hair specialists understand the unique demands of wedding styling — from updos that survive dancing to styles that complement your veil and dress.',
      whatToLook: [
        'Always book a trial run 4-6 weeks before the wedding',
        'Ask if they offer on-location service (most bridal stylists do)',
        'Check bridal party pricing — packages for bridesmaids and mothers are common',
        'Ask about their experience with veils, hairpieces, and accessories',
      ],
      closing: 'Book your bridal stylist early — the best specialists are booked 6-12 months in advance, especially during peak wedding season (October to April in Australia).',
    },
  },
  {
    slug: 'kids-hairdresser',
    name: 'Kids Hairdressers',
    h1: 'Kids Hairdressers in Australia',
    description: 'Child-friendly hair salons',
    metaDescription: 'Find kids hairdressers near you. Child-friendly salons with experience cutting children\'s hair across Australia. Patient stylists, fun environments.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['kids', 'children', 'child', 'junior', 'little'],
    specialtyTag: 'kids',
    content: {
      intro: 'Getting a child\'s hair cut can be stressful for both parent and child. Kids hairdressers specialise in making the experience fun, fast, and tear-free. They understand how to work with wiggly toddlers and nervous first-timers.',
      whatToLook: [
        'Look for salons with entertainment — iPads, toys, or themed chairs help keep kids calm',
        'Ask if they offer first-haircut certificates or keepsakes',
        'Check if appointments are short (15-20 minutes is ideal for young children)',
        'Ask about experience with sensory-sensitive children',
      ],
      closing: 'Many regular salons also welcome children, but a dedicated kids hairdresser makes the experience smoother. Check reviews from other parents before booking.',
    },
  },
  {
    slug: 'mens-haircut',
    name: 'Men\'s Haircuts',
    h1: 'Men\'s Haircut Specialists in Australia',
    description: 'Barbers and salons for men',
    metaDescription: 'Find men\'s haircut specialists near you. Barbers and salons offering fades, clipper cuts, and modern men\'s styling across Australia.',
    businessTypes: ['barber', 'unisex'],
    nameKeywords: ['men', 'gents', 'gentleman'],
    specialtyTag: 'mens',
    content: {
      intro: 'Whether you want a classic short back and sides, a modern skin fade, or a textured crop, finding the right barber or stylist for men\'s hair makes all the difference. Australia has a thriving men\'s grooming scene with options for every style and budget.',
      whatToLook: [
        'Decide between a traditional barber (walk-in, quick, affordable) or a salon stylist (appointment, detailed, higher-end)',
        'Ask about beard grooming services if you need them — not all barbers offer razor shaves',
        'Check if they offer scalp treatments or hair loss consultations',
        'Look at photos of recent work, especially for fades and detailed cuts',
      ],
      closing: 'Men\'s haircuts in Australia typically range from $25 for a basic barber cut to $70+ at premium salons. Regular visits every 3-4 weeks keep fades and short styles looking sharp.',
      proTip: { text: 'The best barbers and stylists maintain their scissors with regular professional sharpening. Quality hairdressing scissors from Japanese steel last decades with proper care —', linkText: 'ShearGenius offers scissors and sharpening Australia-wide', linkHref: 'https://www.sheargenius.com.au' },
    },
  },
  {
    slug: 'ladies-cut',
    name: 'Ladies Haircuts',
    h1: 'Ladies Haircut Specialists in Australia',
    description: 'Salons for women\'s cuts and styling',
    metaDescription: 'Find ladies haircut specialists near you. Hair salons offering bobs, layers, long-hair styling, and precision cuts across Australia. Verified listings.',
    businessTypes: ['hair_salon', 'unisex'],
    content: {
      intro: 'A great ladies haircut is the foundation of every style — the cut determines how your hair falls, how long it lasts between salon visits, and how much effort you need at home. Whether you want a sharp bob, soft layers, a pixie, or length with movement, finding a stylist who listens and understands your hair is worth the search.',
      whatToLook: [
        'Look at the stylist\'s portfolio — do they cut the shape you\'re after?',
        'Ask about consultation time — a good ladies cut starts with 5–10 minutes of discussion before any scissors come out',
        'Check if they specialise in your hair texture (fine, thick, curly, wavy)',
        'Ask whether they cut dry or wet — dry cutting suits curls and fringe detail; wet cutting suits precision bobs',
      ],
      closing: 'Ladies haircuts in Australia typically range from $65 for a trim at a local salon to $200+ at a senior stylist in a premium salon. Most stylists recommend a cut every 8–12 weeks to keep the shape fresh.',
      proTip: { text: 'Precision cutting relies on sharp, well-balanced scissors. Senior stylists often invest in Japanese-steel shears that hold an edge for years —', linkText: 'ShearGenius offers professional scissors and Australia-wide sharpening', linkHref: 'https://www.sheargenius.com.au' },
    },
  },
  {
    slug: 'hair-extensions',
    name: 'Hair Extension Specialists',
    h1: 'Hair Extension Specialists in Australia',
    description: 'Tape-in, clip-in, and bonded extensions',
    metaDescription: 'Find hair extension specialists near you. Tape-in, micro-bead, and bonded extension experts across Australia with verified reviews.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['extension', 'extensions', 'tape-in', 'tape in'],
    specialtyTag: 'extensions',
    content: {
      intro: 'Hair extensions can add length, volume, or both — but they require a specialist touch. Poorly applied extensions can damage your natural hair, while well-fitted ones look completely seamless. The key is finding an experienced extension technician.',
      whatToLook: [
        'Ask what method they use — tape-in, micro-bead, keratin bond, and clip-in all have different pros and cons',
        'Check the quality of hair they supply — 100% Remy human hair is the gold standard',
        'Ask about maintenance visits — most extensions need adjustment every 6-8 weeks',
        'Request before-and-after photos of their extension work',
      ],
      closing: 'Extensions are an investment — expect to pay $500-$2,000+ depending on the method and amount of hair. Always choose quality over price to protect your natural hair.',
    },
  },
  {
    slug: 'japanese-hairdresser',
    name: 'Japanese Hairdressers',
    h1: 'Japanese Hairdressers in Australia',
    description: 'Japanese-trained stylists and salons',
    metaDescription: 'Find Japanese hairdressers near you. Japanese-trained stylists offering precision cuts, Japanese straightening, and Asian hair expertise across Australia.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['japanese', 'japan'],
    specialtyTag: 'japanese',
    content: {
      intro: 'Japanese hairdressers are renowned for their precision cutting, attention to detail, and expertise with Asian hair types. Japanese-trained stylists often spend years in apprenticeship before cutting clients, resulting in exceptional technical skill.',
      whatToLook: [
        'Ask if the stylist trained in Japan — Japanese salon apprenticeships are among the most rigorous in the world',
        'Japanese stylists excel at layering and texturising for movement and natural fall',
        'Enquire about Japanese thermal straightening (also called Yuko or thermal reconditioning)',
        'Many Japanese salons include a head spa or scalp treatment with every service',
      ],
      closing: 'Japanese hairdressers in Australia are particularly popular in Sydney and Melbourne, where there are established communities. Their attention to detail and customer service is consistently rated highly.',
      proTip: { text: 'Japanese-trained stylists demand the best tools. Most use scissors forged from Japanese Hitachi steel — the same ATS-314 alloy used by', linkText: 'ShearGenius professional hairdressing scissors', linkHref: 'https://www.sheargenius.com.au' },
    },
  },
  {
    slug: 'korean-hair-salon',
    name: 'Korean Hair Salons',
    h1: 'Korean Hair Salons in Australia',
    description: 'Korean-style salons and stylists',
    metaDescription: 'Find Korean hair salons near you. Korean-trained stylists offering K-style cuts, perms, and colour across Australia.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['korean', 'korea', 'k-beauty'],
    specialtyTag: 'korean',
    content: {
      intro: 'Korean hair salons bring the latest K-beauty trends to Australia. Known for their expertise in volume perms, root perms, and the coveted "Korean glass hair" look, these salons stay ahead of trends through close connection to Seoul\'s style scene.',
      whatToLook: [
        'Korean salons are known for "see-through bangs" and layered cuts that frame the face',
        'Ask about their perm techniques — Korean down perms and C-curl perms are signature services',
        'Many Korean salons offer colour techniques popular in Korea like "inner colour" and "balayage highlights"',
        'Check if they offer hair and scalp treatments — Korean salons often provide comprehensive care',
      ],
      closing: 'Korean hair salons are growing rapidly in Australian cities, especially Sydney\'s Strathfield and Melbourne\'s CBD. They offer a different approach to styling that many clients find refreshing.',
    },
  },
  {
    slug: 'wedding-hair',
    name: 'Wedding Hair Stylists',
    h1: 'Wedding Hair Stylists in Australia',
    description: 'On-location wedding and bridal party hair',
    metaDescription: 'Find wedding hair stylists near you. On-location bridal and bridal party styling with trials across Australia. Book early for peak season.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['wedding', 'bridal', 'bride'],
    specialtyTag: 'bridal',
    content: {
      intro: 'Your wedding hair needs to be picture-perfect from the first look to the last dance. Wedding hair stylists specialise in styles that photograph beautifully, stay put all day, and work with your dress, veil, and accessories.',
      whatToLook: [
        'Book a trial 4-8 weeks before the wedding to test your style with your accessories',
        'Confirm they offer on-location service — most wedding stylists travel to your venue or getting-ready location',
        'Ask about bridal party packages for bridesmaids, mother of the bride, and flower girls',
        'Discuss timeline — an experienced wedding stylist knows how to schedule multiple styles on the morning',
      ],
      closing: 'Peak wedding season in Australia runs October to April. The best wedding hair stylists book 6-12 months in advance, so start your search early. Always read reviews from other brides.',
    },
  },
  {
    slug: 'colour-specialist',
    name: 'Colour Specialists',
    h1: 'Hair Colour Specialists in Australia',
    description: 'Expert hair colourists near you',
    metaDescription: 'Find hair colour specialists near you. Expert colourists offering balayage, highlights, full colour, and toning across Australia. Verified reviews.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['colour', 'color', 'colourist', 'colorist'],
    specialtyTag: 'colour-specialist',
    content: {
      intro: 'Hair colour is both an art and a science. A skilled colour specialist understands colour theory, chemistry, and how different products interact with your natural hair. Whether you want a subtle refresh, dramatic transformation, or corrective work, finding the right colourist makes all the difference.',
      whatToLook: [
        'Always book a consultation before your first colour appointment — a good colourist will assess your hair health and history',
        'Ask to see their portfolio on Instagram or in-salon — colour work varies hugely between stylists',
        'Discuss maintenance expectations upfront — some techniques grow out gracefully, others need regular touch-ups',
        'Ask about the products they use — professional-grade colour brands matter for hair health and longevity',
      ],
      closing: 'Australia has some of the world\'s best colourists, with many salons specialising in techniques like balayage, lived-in colour, and fashion colours. Find your perfect match in our directory.',
    },
  },
  {
    slug: 'keratin-treatment',
    name: 'Keratin Treatment Specialists',
    h1: 'Keratin Treatment Specialists in Australia',
    description: 'Smoothing and anti-frizz treatments',
    metaDescription: 'Find keratin treatment specialists near you. Professional smoothing treatments, Brazilian blowouts, and anti-frizz services across Australia.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['keratin', 'smoothing', 'brazilian'],
    specialtyTag: 'keratin',
    content: {
      intro: 'Keratin treatments smooth and strengthen hair by infusing it with a protective protein layer. They\'re ideal for frizzy, unruly, or damaged hair, and can cut styling time in half. Results typically last 3-6 months depending on the treatment and your hair type.',
      whatToLook: [
        'Ask about the specific product used — formaldehyde-free options are safer and now widely available',
        'Discuss your expectations honestly — keratin treatments reduce frizz but won\'t make curly hair poker-straight',
        'Ask about aftercare requirements — most treatments require sulfate-free shampoo and a 48-72 hour setting period',
        'Check if the treatment is compatible with colour-treated or highlighted hair',
      ],
      closing: 'Keratin treatments have evolved significantly in recent years, with newer formulations offering better results with fewer chemicals. A specialist who stays current with the latest products will deliver the best outcome for your hair type.',
    },
  },
  {
    slug: 'highlights',
    name: 'Highlights Specialists',
    h1: 'Hair Highlights Specialists in Australia',
    description: 'Foil highlights, lowlights, and dimension',
    metaDescription: 'Find highlights specialists near you. Foil highlights, lowlights, and multi-tonal colour experts across Australia. Verified reviews and online booking.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['highlight', 'highlights', 'foils'],
    specialtyTag: 'highlights',
    content: {
      intro: 'Highlights add dimension, movement, and brightness to your hair. From subtle babylights to bold chunky foils, there are dozens of techniques to choose from. A skilled highlights specialist can create a completely customised look that flatters your skin tone and features.',
      whatToLook: [
        'Bring reference photos — the same word ("highlights") can mean very different things to different people',
        'Ask about the technique they recommend for your hair — foils, balayage, babylights, and cap highlights all create different effects',
        'Discuss placement carefully — face-framing highlights suit almost everyone and brighten the complexion',
        'Ask about toner — most highlight services need a toner to achieve the final shade',
      ],
      closing: 'Well-placed highlights can make hair look thicker, healthier, and more vibrant. Find a specialist who takes the time to customise your placement and formulation rather than using a one-size-fits-all approach.',
    },
  },
  {
    slug: 'blow-dry',
    name: 'Blow-Dry Specialists',
    h1: 'Blow-Dry Bars & Specialists in Australia',
    description: 'Professional blow-dry, styling and finishing',
    metaDescription: 'Find blow-dry bars and stylists near you in Australia. Bouncy blowouts, sleek finishes, occasion styling. Verified salons with real Google reviews.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['blow', 'dry', 'blow-dry', 'blowout'],
    specialtyTag: 'blow-dry',
    content: {
      intro: 'A professional blow-dry transforms how your hair looks and feels — soft, bouncy, smooth, or sleek depending on your finish. Blow-dry specialists know exactly which round brush, nozzle angle, and tension to use for your hair type and the look you want.',
      whatToLook: [
        'Confirm whether the price includes wash, treatment and styling',
        'Tell the stylist your hair type and desired finish before they start',
        'Ask about heat-protect products — essential for hair longevity',
        'Find out how long the blow-dry lasts (a good one survives an overnight)',
      ],
      closing: 'A skilled blow-dry artist can make hair look professionally styled in 30-45 minutes. For occasions, weddings, or just a confidence reset, book a specialist rather than relying on a generic salon blowout.',
    },
  },
  {
    slug: 'afro',
    name: 'Afro & Textured Hair Specialists',
    h1: 'Afro & Textured Hair Specialists in Australia',
    description: 'Stylists trained in afro, kinky, coily and textured hair',
    metaDescription: 'Find afro and textured hair specialists near you in Australia. Cornrows, braids, twists, locs, silk presses and natural curl care by trained stylists.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['afro', 'textured', 'natural', 'african', 'braids'],
    specialtyTag: 'afro',
    content: {
      intro: 'Textured hair — types 3C through 4C — needs specialist care. Many mainstream salons lack the training, products and time to work with afro-textured hair properly. A specialist understands shrinkage, curl pattern, and how to cut, condition and style natural hair without damage.',
      whatToLook: [
        'Ask if they regularly work with your specific hair type and pattern',
        'Confirm they stock products formulated for textured hair (Mielle, Cantu, As I Am, Camille Rose, etc.)',
        'Discuss heat use — silk presses and blow-dries need careful technique to avoid heat damage',
        'For braids, locs and protective styles, ask about scalp tension and finishing care',
      ],
      closing: 'Textured-hair salons in Australia have grown significantly — major cities now have dedicated specialists across braiding, locs, silk-pressing and natural curl care. Specialists almost always deliver better results than mainstream salons that "do all hair types".',
    },
  },
  {
    slug: 'organic',
    name: 'Organic & Natural Hair Salons',
    h1: 'Organic & Natural Hair Salons in Australia',
    description: 'Ammonia-free, low-tox and organic colour specialists',
    metaDescription: 'Find organic and natural hair salons near you in Australia. Ammonia-free colour, plant-based dyes, low-tox treatments and chemical-conscious stylists.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['organic', 'natural', 'ammonia-free', 'henna'],
    specialtyTag: 'organic',
    content: {
      intro: 'Organic hair salons use lower-tox, plant-based or ammonia-free formulations for colour, treatments and styling. Ideal for sensitive scalps, allergies, pregnancy, or anyone wanting to reduce chemical exposure without sacrificing results.',
      whatToLook: [
        'Ask which specific organic brand they use (O&M, Original Mineral, Hairstory, herbatint, etc.)',
        'Clarify what "organic" means at that salon — practices vary widely',
        'For colour, ammonia-free does not mean colour-free — discuss expected results',
        'Check if they offer a patch test 48 hours before colour service',
      ],
      closing: 'The organic hair scene in Australia has matured beyond niche — most capital cities now have several dedicated organic salons. Senior stylists trained in lower-tox techniques can deliver results equal to or better than conventional salons.',
    },
  },
  {
    slug: 'wigs',
    name: 'Wig & Hair Replacement Specialists',
    h1: 'Wig & Hair Replacement Specialists in Australia',
    description: 'Wig fitting, customisation and hair replacement services',
    metaDescription: 'Find wig and hair replacement specialists near you in Australia. Custom wig fitting, lace-front styling, medical wigs and hair systems by trained professionals.',
    businessTypes: ['hair_salon', 'unisex'],
    nameKeywords: ['wig', 'wigs', 'hair replacement', 'topper'],
    specialtyTag: 'wigs',
    content: {
      intro: 'A specialist wig stylist customises wigs, hair toppers and hair systems to look natural — colour-matching, cutting, fitting and styling. Whether for medical reasons, alopecia, fashion or convenience, a specialist makes the difference between a wig that looks like a wig and one that looks like your own hair.',
      whatToLook: [
        'Ask about their experience with medical clients (chemotherapy, alopecia areata)',
        'For lace-front wigs, confirm they offer customisation and bleaching of the lace',
        'Discuss material — human hair vs. premium synthetic each have trade-offs',
        'Ask about ongoing maintenance, washing and re-styling appointments',
      ],
      closing: 'A skilled wig specialist transforms a stock wig into something that looks completely natural. For medical hair loss, many salons partner with the Australian Cancer Council Wig Service — ask about subsidised options.',
    },
  },
];

export function generateStaticParams() {
  return SERVICES.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>;
}): Promise<Metadata> {
  const { service } = await params;
  const config = SERVICES.find((s) => s.slug === service);
  if (!config) return { title: 'Service not found — findme.hair', robots: { index: false } };

  const path = `https://www.findme.hair/services/${config.slug}`;
  return {
    title: `${config.name} Near You — findme.hair`,
    description: config.metaDescription,
    alternates: {
      canonical: path,
      languages: { 'en-AU': path, 'x-default': path },
    },
    openGraph: {
      title: `${config.name} — findme.hair`,
      description: config.metaDescription,
      url: path,
      siteName: 'findme.hair',
      locale: 'en_AU',
      type: 'website',
      images: [{ url: 'https://www.findme.hair/og-image.jpg', width: 1200, height: 630 }],
    },
  };
}

async function getServiceBusinesses(config: ServiceConfig): Promise<Business[]> {
  const supabase = supabaseServerAnon();

  // If we have a specialty tag, prefer that — it's the most accurate filter
  if (config.specialtyTag) {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .contains('specialties', [config.specialtyTag])
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('google_rating', { ascending: false, nullsFirst: false })
      .order('google_review_count', { ascending: false, nullsFirst: false })
      .limit(24);
    return (data ?? []) as Business[];
  }

  if (!config.nameKeywords) {
    // Simple type filter (one or many types, no keyword refinement)
    let q = supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active');
    q = config.businessTypes.length === 1
      ? q.eq('business_type', config.businessTypes[0])
      : q.in('business_type', config.businessTypes);
    const { data } = await q
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('google_rating', { ascending: false, nullsFirst: false })
      .order('google_review_count', { ascending: false, nullsFirst: false })
      .limit(24);
    return (data ?? []) as Business[];
  }

  // Name keyword search within type
  const typeFilter = config.businessTypes.length === 1
    ? `business_type.eq.${config.businessTypes[0]}`
    : config.businessTypes.map((t) => `business_type.eq.${t}`).join(',');

  const nameFilter = (config.nameKeywords ?? [])
    .map((k) => `name.ilike.%${k}%`)
    .join(',');

  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .or(typeFilter)
    .or(nameFilter)
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(24);

  return (data ?? []) as Business[];
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  const config = SERVICES.find((s) => s.slug === service);
  if (!config) notFound();

  const businesses = await getServiceBusinesses(config);

  return (
    <main className="min-h-screen bg-[var(--color-surface)]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.findme.hair/' },
          { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://www.findme.hair/search' },
          { '@type': 'ListItem', position: 3, name: config.name },
        ],
      }} />
      {businesses.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${config.h1}`,
          numberOfItems: businesses.length,
          itemListElement: businesses.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `https://www.findme.hair/salon/${b.slug}`,
            name: b.name,
          })),
        }} />
      )}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `What does a ${config.name.toLowerCase().replace(/s$/, '')} do?`, acceptedAnswer: { '@type': 'Answer', text: config.content.intro } },
          { '@type': 'Question', name: `What should I look for in a ${config.name.toLowerCase().replace(/s$/, '')}?`, acceptedAnswer: { '@type': 'Answer', text: config.content.whatToLook.join(' ') } },
          { '@type': 'Question', name: `Where can I find a ${config.name.toLowerCase()} in Australia?`, acceptedAnswer: { '@type': 'Answer', text: `${config.name} are listed across every Australian state on findme.hair. Use the listings above or browse by city to find one near you.` } },
        ],
      }} />

      {/* Breadcrumb */}
      <div className="bg-[var(--color-white)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-gold-dark)]">Home</Link>
            <ChevronIcon />
            <Link href="/search" className="hover:text-[var(--color-gold-dark)]">Browse</Link>
            <ChevronIcon />
            <span className="text-[var(--color-ink)] font-medium">{config.name}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[var(--color-white)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-editorial-overline">Australia-wide</p>
          <h1
            className="mt-3 text-3xl text-[var(--color-ink)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {config.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-light)] leading-relaxed">
            {config.content.intro}
          </p>
        </div>
      </div>

      {/* Listings */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {businesses.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-[var(--color-ink-muted)]">
              We&rsquo;re building our {config.name.toLowerCase()} listings. Browse all salons below.
            </p>
            <Link href="/search" className="mt-4 inline-block btn-gold text-sm !py-2 !px-5">
              Browse all listings
            </Link>
          </div>
        )}

        {/* What to look for */}
        <section className="mt-14 card p-8">
          <h2
            className="text-xl text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            What to look for in {config.name.toLowerCase()}
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-light)]">
            {config.content.whatToLook.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--color-gold)] mt-0.5">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[var(--color-ink-light)] leading-relaxed">
            {config.content.closing}
          </p>
          {config.content.proTip && (
            <p className="mt-3 text-sm text-[var(--color-ink-muted)] italic">
              {config.content.proTip.text}{' '}
              <a href={config.content.proTip.linkHref} target="_blank" rel="noopener" className="text-[var(--color-gold-dark)] hover:text-[var(--color-gold)] not-italic">
                {config.content.proTip.linkText}
              </a>.
            </p>
          )}
        </section>

        {/* Cross-links to other services */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Browse by service type
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SERVICES.filter((s) => s.slug !== config.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>

        {/* City links */}
        <section className="mt-8 card p-8">
          <h2
            className="text-lg text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Find by city
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Geelong', 'Hobart', 'Darwin', 'Canberra', 'Cairns'].map((city) => (
              <Link
                key={city}
                href={`/best-hairdresser/${city.toLowerCase().replace(/ /g, '-')}`}
                className="inline-block rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-ink-light)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-dark)] transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-3 h-3 text-[var(--color-border)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
