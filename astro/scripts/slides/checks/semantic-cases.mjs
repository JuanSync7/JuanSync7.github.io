import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditIcon} from '../audit.mjs';
import {checkAccentCoverage} from './accent.mjs';
const cases=JSON.parse(readFileSync('scripts/slides/checks/fixtures/semantic-accents.json')).cases;
// Frozen user corrections calibrate existing glyphs. New subjects are not limited by this set.
export function semanticCases(){
 for(const test of cases){
  assert.deepEqual(auditIcon(test.spec,{nodes:test.spec.nodes,accents:test.expected}).failures,[],`${test.id}: the complete semantic unit must pass`);
  assert.ok(auditIcon(test.spec,{nodes:test.spec.nodes,accents:test.rejected}).failures.some(f=>f.rule==='ACCENT'),`${test.id}: the old, geometrically attached but wrong highlight must fail`);
  if(test.wholeGlyphAlternative)assert.deepEqual(checkAccentCoverage({...test.spec,accent:{mode:'whole'}},test.spec.nodes),[],'The user also permits full-glyph color');
  for(const alternative of test.alternatives??[]){
   const spec=structuredClone(test.spec);
   spec.parts['alternative-unit']=alternative.map(node=>spec.nodes.findIndex(candidate=>JSON.stringify(candidate)===JSON.stringify(node)));
   assert.ok(spec.parts['alternative-unit'].every(index=>index>=0));
   spec.accent.part='alternative-unit';
   checkKnownSelections([spec]);
  }
 }
 const dots=[{tag:'circle',attrs:{cx:'6',cy:'6',r:'1'}},{tag:'circle',attrs:{cx:'18',cy:'6',r:'1'}}];
 const repeated={nodes:dots,parts:{terminals:[0,1]},accent:{mode:'part',part:'terminals'}};
 assert.deepEqual(checkAccentCoverage(repeated,dots),[]);
 assert.ok(checkAccentCoverage(repeated,dots.slice(0,1)).length,'Do not omit a member of an equivalent functional set');
 assert.deepEqual(checkAccentCoverage({...repeated,accent:{mode:'none'}},[]),[]);
 assert.ok(checkAccentCoverage({...repeated,accent:{mode:'none'}},dots).length,'None forbids all highlights');
 assert.deepEqual(checkAccentCoverage({...repeated,accent:{mode:'whole'}},dots),[],'Whole-glyph treatment is explicit, rather than a cropped edge');
 return cases.length;
}
export function checkKnownSelections(icons){
 for(const test of cases){
  const current=icons.find(icon=>icon.id===test.id);if(!current)continue;
  const expected=test.wholeGlyphAlternative&&current.accent.mode!=='none'?[current.nodes]:[test.expected,...(test.alternatives??[])];
  assert.ok(expected.some(unit=>checkAccentCoverage(current,unit).length===0),`${test.id}: user-directed unit changed; review the correction before refreshing its case`);
 }
}
