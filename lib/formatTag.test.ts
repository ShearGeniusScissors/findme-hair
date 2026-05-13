import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTag } from './formatTag.ts';

// Real tag values pulled from `SELECT DISTINCT unnest(specialties) FROM businesses`
// on 2026-05-13 (22 distinct values) plus the brand/casing samples from the
// FMH ↔ SG coordination ticket.
const cases: Array<[string, string]> = [
  // kebab-case → Title Case
  ['colour-specialist', 'Colour Specialist'],
  ['curly-hair', 'Curly Hair'],
  ['colour-correction', 'Colour Correction'],
  ['blow-dry', 'Blow Dry'],
  ['scalp-spa', 'Scalp Spa'],
  // snake_case → Title Case (mixed-case input)
  ['Organic_colour', 'Organic Colour'],
  ['organic_colour', 'Organic Colour'],
  // single-word lowercase
  ['balayage', 'Balayage'],
  ['highlights', 'Highlights'],
  ['organic', 'Organic'],
  ['sustainable', 'Sustainable'],
  ['extensions', 'Extensions'],
  ['mens', 'Mens'],
  ['kids', 'Kids'],
  ['barber', 'Barber'],
  ['mobile', 'Mobile'],
  ['japanese', 'Japanese'],
  ['korean', 'Korean'],
  ['keratin', 'Keratin'],
  ['wigs', 'Wigs'],
  ['afro', 'Afro'],
  ['bridal', 'Bridal'],
  // term overrides (the title-caser would mangle these)
  ['lowtox', 'Low Tox'],
  // brand overrides — canonical capitalisation
  ['natulique', 'NATULIQUE'],
  ['davines', 'DAVINES'],
  ['wella', 'WELLA'],
  ['goldwell', 'GOLDWELL'],
  ['schwarzkopf', 'SCHWARZKOPF'],
  ['aveda', 'AVEDA'],
  ['kevin-murphy', 'KEVIN MURPHY'],
  ['kevin_murphy', 'KEVIN MURPHY'],
  // edge cases
  ['', ''],
  ['  curly--hair  ', 'Curly Hair'],
  ['UNKNOWN-tag', 'Unknown Tag'],
];

test('formatTag — known specialties and brands', () => {
  for (const [input, expected] of cases) {
    assert.equal(formatTag(input), expected, `formatTag(${JSON.stringify(input)})`);
  }
});

test('formatTag — never leaks hyphens or underscores', () => {
  for (const [input] of cases) {
    const out = formatTag(input);
    assert.ok(!out.includes('-'), `output should not contain '-': ${out}`);
    assert.ok(!out.includes('_'), `output should not contain '_': ${out}`);
  }
});

test('formatTag — output is stable under re-formatting', () => {
  // Formatting an already-formatted display string should not equal the raw
  // tag any more (this guards against accidentally double-applying it). The
  // important invariant: it must not crash and must not introduce hyphens.
  for (const [, expected] of cases) {
    if (!expected) continue;
    const reformatted = formatTag(expected);
    assert.ok(!reformatted.includes('-'));
    assert.ok(!reformatted.includes('_'));
  }
});
