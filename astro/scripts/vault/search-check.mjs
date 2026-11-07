import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EXAMPLE_NOTES, EXAMPLE_EDGES, tokenize, rankNotes, graphNeighbors } from '../../src/data/vault-demo.ts';

const ids = new Set(EXAMPLE_NOTES.map((note) => note.id));
assert.equal(EXAMPLE_NOTES.length, 10);
assert.equal(ids.size, EXAMPLE_NOTES.length);
assert(EXAMPLE_NOTES.every((note) => /^[a-z]+(?:-[a-z]+)*$/.test(note.id)));
assert(EXAMPLE_NOTES.every((note) => note.title && note.summary && note.aliases.length && note.trust));
assert(EXAMPLE_EDGES.every((edge) => ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to));
assert.equal(new Set(EXAMPLE_EDGES.map((edge) => `${edge.from}/${edge.relation}/${edge.to}`)).size, EXAMPLE_EDGES.length);

assert.deepEqual(tokenize('How do I find a RETRY policy?'), ['find', 'retry', 'policy']);
assert.deepEqual(tokenize('retry RETRY retry'), ['retry']);
assert.equal(rankNotes('retry policy')[0]?.note.id, 'retries');
assert(rankNotes('retry policy')[0]?.reasons.includes('alias: retry policy'));
assert.equal(rankNotes('  SAFE repetition  ')[0]?.note.id, 'idempotency');
assert.equal(rankNotes('How do I use safe repetition?')[0]?.note.id, 'idempotency');
assert.equal(rankNotes('service signals')[0]?.note.id, 'observability');
assert.equal(rankNotes('Engineering')[0]?.note.id, 'engineering');
assert.deepEqual(rankNotes(''), []);
assert.deepEqual(rankNotes('how do I the a'), []);
assert.deepEqual(rankNotes('photosynthesis'), []);
assert.deepEqual(rankNotes('ret'), []);
assert.deepEqual(rankNotes('<script>'), []);
assert.deepEqual(rankNotes('retry policy'), rankNotes('retry policy'));

const retryLinks = graphNeighbors('retries');
assert(retryLinks.some((edge) => edge.direction === 'outgoing' && edge.relation === 'member_of' && edge.to === 'reliable-systems'));
assert(retryLinks.some((edge) => edge.direction === 'incoming' && edge.relation === 'applies_to' && edge.from === 'bound-retries'));
assert(!retryLinks.some((edge) => edge.note.id === 'engineering'));
assert(!retryLinks.some((edge) => edge.note.id === 'queue-retry-note' && edge.relation === 'supported_by'));
assert(graphNeighbors('bound-retries').some((edge) => edge.direction === 'outgoing' && edge.relation === 'supported_by' && edge.to === 'queue-retry-note'));
assert(graphNeighbors('queue-retry-note').some((edge) => edge.direction === 'incoming' && edge.relation === 'supported_by' && edge.from === 'bound-retries'));
assert.equal(graphNeighbors('bound-retries').filter((edge) => edge.relation === 'member_of').length, 2);
assert.deepEqual(graphNeighbors('missing'), []);
assert(graphNeighbors('retries').every((edge) => edge.from === 'retries' || edge.to === 'retries'));
assert(graphNeighbors('retries', EXAMPLE_NOTES.filter((note) => note.id !== 'idempotency')).every((edge) => edge.note.id !== 'idempotency'));

const module = readFileSync(new URL('../../src/data/vault-demo.ts', import.meta.url), 'utf8');
const component = readFileSync(new URL('../../src/components/vault/VaultSearchDemo.tsx', import.meta.url), 'utf8');
assert(!/https?:\/\/|experience-vault|\/Chats\/|\/Notes\/|fetch\(|localStorage|sessionStorage|indexedDB/.test(module + component));
assert(component.includes('Synthetic example · no private vault connection'));
assert(component.includes('<noscript>') && component.includes('disabled={!ready}') && component.includes('aria-live="polite"'));
console.log('Vault search example: 10 synthetic notes; ranking, declared one-hop direction, unknowns, privacy and static fallback checks passed.');
