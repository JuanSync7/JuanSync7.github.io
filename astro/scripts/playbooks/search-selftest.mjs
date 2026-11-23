// The search on /playbooks/ reads the words a card shows and nothing else. Each case here is a way it could
// go wrong: a card that matches is dropped, one that does not is kept, or an empty search hides the list.
import assert from 'node:assert/strict';
import { matching } from '../../src/components/playbooks/match.ts';

const CARDS = [
  'welding Welding Joins two plates of steel. It covers the joint, the bead and the inspection.',
  'painting Painting Covers a part in colour. Primer, two coats and the cure time between them.',
  'rules_welding_safely Rules for welding safely What a welder checks first. Gloves, mask and a square jig.',
];
const cases = [
  ['an empty search keeps every card', '', [0, 1, 2]],
  ['a search of spaces keeps every card', '  \t ', [0, 1, 2]],
  ['a word is found whatever its case', 'PRIMER', [1]],
  ['a word is found inside an id', 'rules_weld', [2]],
  ['every word must be on the card, in any order', 'jig gloves', [2]],
  ['a card with only one of two words is dropped', 'steel primer', []],
  ['a word no card has finds none', 'carpentry', []],
  ['a part of a word is found', 'weld', [0, 2]],
  ['spaces around and between words do not count', '  two   coats ', [1]],
  ['a full stop is searched as written, not as any character', 'steel.', [0]],
  ['a pattern character is plain text', '.*', []],
];
let ran = 0;
for (const [name, query, want] of cases) {
  assert.deepEqual(matching(CARDS, query), want, name);
  ran += 1;
}
assert.deepEqual(matching([], 'weld'), [], 'no card, no match');
assert.equal(ran, cases.length);
if (!ran) throw new Error('no case ran');
console.log(`Playbook search selftest passed: ${ran + 1} cases.`);
