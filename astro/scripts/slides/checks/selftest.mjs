import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditIcon,rules} from '../audit.mjs';
import {validateIcon} from './schema.mjs';

export function selftest(){
 const seeds=JSON.parse(readFileSync('scripts/slides/checks/fixtures/library-cases.json')).seeds;
 const tests=[];
 const test=(name,id,change,rule)=>{
  const spec=structuredClone(seeds[id].spec),definition=structuredClone(seeds[id].definition);change(spec,definition);
  assert.ok(auditIcon(spec,definition).failures.some(f=>f.rule===rule),`${name}: must fail ${rule}, not merely source consistency`);tests.push({name,rule});
 };
 test('floating accent','processor',(_,d)=>d.accent.attrs.d='M9 7H15','ACCENT');
 test('detached pin','processor',(_,d)=>d.nodes[0].attrs.d='M12 21v1','JUNCTION');
 test('escaping grid','wafer',(_,d)=>d.nodes[1].attrs.x='14','CONTAINMENT');
 test('beam through housing','calipers',(_,d)=>d.nodes[0].attrs.d='M3 10H21V12H3Z','OCCLUSION');
 test('rear edge through front','slide-deck',(_,d)=>d.nodes[0].attrs.d='M7 3H21V15H4','OCCLUSION');
 test('misaligned repeated units','server',(_,d)=>d.nodes[1].attrs.x='3','STACK');
 test('missing stack','files',i=>delete i.collection,'SPEC');
 test('tilted jaw','calipers',(_,d)=>d.nodes[6].attrs.d='M14 13L15 21H17V13','JUNCTION');
 test('missing view rationale','processor',i=>i.view.rationale='','SPEC');
 test('malformed generated primitive','processor',(_,d)=>d.accent={tag:'image',attrs:{href:'external'}},'GEOMETRY');
 test('nonfinite coordinate','processor',(_,d)=>d.nodes[13].attrs.width='NaN','GEOMETRY');
 test('source drift','processor',(_,d)=>d.nodes[13].attrs.rx='0','SOURCE');
 test('outside frame','processor',(_,d)=>d.nodes[0].attrs.d='M12 20V25','FRAME');
 test('excess accent','processor',(_,d)=>d.accent=d.nodes[12],'BUDGET');
 // A novel noun and family, arbitrary view name and non-vertical support geometry.
 // This passing case is intentionally absent from the catalog and reuses no icon-id branch.
 const novel={...structuredClone(seeds.processor.spec),id:'unseen-vessel',name:'Unseen vessel',group:'new-domain',plural:false,
  view:{projection:'flat',description:'custom oblique drawing plane',visible:['body','support-a','support-b'],hidden:['concealed fitting'],rationale:'Visible supports attach to the chosen silhouette.'},
  parts:{body:[0],'support-a':[1],'support-b':[2]},nodes:[{tag:'polygon',attrs:{points:'5,5 19,5 19,15 5,15'}},{tag:'path',attrs:{d:'M7 15L8 19'}},{tag:'path',attrs:{d:'M14 15L15 19'}}],
  constraints:[{type:'attach',parts:['support-a','support-b'],to:'body',ends:'start'},{type:'parallel',edges:[{part:'support-a',edge:0},{part:'support-b',edge:0}]}],
  accent:{node:0,kind:'line',segment:1,from:3/7,to:4/7,meaning:'visible rim'},fit:{brief:'An unseen vessel',decision:'create',rationale:'A new silhouette for an unseen request.',references:[{url:'https://example.org/reference','note':'Synthetic geometry fixture, not a real design claim.'}],alternatives:[]}};
 delete novel.collection;validateIcon(novel);
 const definition={nodes:novel.nodes,accent:{tag:'path',attrs:{d:'M11 5H13'}}};
 assert.deepEqual(auditIcon(novel,definition).failures,[],'New subjects, groups, view names and angled parallel supports must be allowed');
 const damaged=structuredClone(definition);damaged.nodes[2].attrs.d='M14 16L15 20';
 assert.ok(auditIcon(novel,damaged).failures.some(f=>f.rule==='JUNCTION'),'A detached support on an unknown subject must fail');
 assert.ok(rules.accentDistance>0&&rules.accentLengthFraction>0,'Theme policy remains explicit');
 console.log(`Slide audit: ${tests.length} negative fixtures and an unseen-subject pass/fail pair passed.`);
 return tests;
}
if(process.argv[1]?.endsWith('selftest.mjs'))selftest();
