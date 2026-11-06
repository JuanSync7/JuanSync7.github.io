import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {auditIcon,fingerprint,manifest,engine} from './audit.mjs';
import {checkReview} from './checks/reviews.mjs';
const arg=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const id=arg('id'),task=arg('task'),why=arg('why'),tone=arg('tone')??'night',accent=!process.argv.includes('--mono');
if(!id||!task?.trim()||!why?.trim()||!['night','paper'].includes(tone))throw Error('Use --id=ID --task="slide meaning" --why="fit judgment" [--tone=paper] [--mono]');
const spec=manifest.icons.find(i=>i.id===id);if(!spec)throw Error(`Unknown icon ${id}; use slides:find or stage a new source`);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(readFileSync(`vendor/slide-icons/${spec.file}`)),spec.sha256,'The reused source changed');
for(const key of spec.licenses){const notice=manifest.licenses[key];assert.equal(hash(readFileSync(`vendor/slide-icons/${notice.file}`)),notice.sha256);}
const definitions=JSON.parse(readFileSync('src/figures/kit/slides/definitions.json')),reviews=JSON.parse(readFileSync('vendor/slide-icons/reviews.json'));
assert.deepEqual(auditIcon(spec,definitions[id]).failures,[]);
const server=await createServer({server:{middlewareMode:true,ws:false},appType:'custom',logLevel:'error'});
try{
 const {slideSvg,slideAsset}=await server.ssrLoadModule('/src/figures/kit/slides/svg.ts');
 const options=['night','paper'].flatMap(tone=>[true,false].map(accent=>({tone,accent})));
 const digest=fingerprint(spec,options.map(o=>slideSvg(id,o)));checkReview(spec,reviews[id],digest,engine);
 const asset=slideAsset(id,{tone,accent}),bytes=readFileSync('public'+asset);assert.equal(bytes.toString(),slideSvg(id,{tone,accent}),'Export is stale; run slides:export');
 const payload={schema:'slide-icon-use/1',task,icon:id,fitJudgment:why,actor:arg('actor')??null,asset,assetSha256:hash(bytes),iconRevision:digest,engine,verification:{geometry:'checked',source:'checked',currentReview:'checked',exportBytes:'checked',semanticFit:'reported by caller'},meaning:'Reuse of an existing icon; no canonical source, fit record or visual review was modified.'};
 const receipt=hash(JSON.stringify(payload)),root=`slides-out/uses/${receipt}`;mkdirSync(root,{recursive:true});writeFileSync(`${root}/${id}.svg`,bytes);writeFileSync(`${root}/receipt.json`,JSON.stringify({receipt,...payload},null,2)+'\n');
 console.log(JSON.stringify({receipt,svg:`${root}/${id}.svg`,record:`${root}/receipt.json`,semanticFit:'caller judgment; not independently verified'},null,2));
}finally{await server.close();}
