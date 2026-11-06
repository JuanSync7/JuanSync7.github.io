import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const policy=JSON.parse(readFileSync('scripts/slides/rules.json'));
export const proofHash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function checkReview(icon,review,digest,engine,root='public/downloads/slide-icons'){
 assert.ok(review,`${icon.id}: missing visual review`);
 assert.equal(review.schema,'slide-review/2',`${icon.id}: review schema`);
 assert.equal(review.fingerprint,digest,`${icon.id}: stale icon review`);
 assert.equal(review.engine,engine,`${icon.id}: stale checker review`);
 assert.deepEqual(review.sizes,policy.reviewSizes,`${icon.id}: review all configured sizes`);
 assert.deepEqual(review.treatments,['night/accent','night/mono','paper/accent','paper/mono']);
 assert.match(review.reviewed,/^\d{4}-\d{2}-\d{2}$/);
 assert.ok(review.reviewer?.id&&['agent','human'].includes(review.reviewer.kind),`${icon.id}: name the actual reviewer`);
 assert.equal(review.proof.path,`proofs/icons/${icon.id}.svg`);
 assert.equal(review.proof.sha256,proofHash(readFileSync(`${root}/${review.proof.path}`)),`${icon.id}: stale or missing size proof`);
 for(const question of ['recognition','view','alignment','accent','smallSize']){
  assert.equal(review.judgments?.[question]?.verdict,'pass',`${icon.id}: ${question} is not resolved`);
  assert.ok(review.judgments[question].evidence.trim().length,`${icon.id}: ${question} needs specific evidence`);
 }
 if(review.independent){assert.notEqual(review.independent.reviewer,review.reviewer.id);assert.ok(review.independent.evidence);}
 return true;
}
