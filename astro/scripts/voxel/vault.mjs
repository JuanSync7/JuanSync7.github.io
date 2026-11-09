import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {islandFingerprint} from './island-fingerprint.mjs';
import {sourceSnapshot} from './vault-snapshot.mjs';
import assert from 'node:assert/strict';
import {kernelFingerprint} from './fingerprint.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function exportVault(vaultPath,check=false) {
 const root=resolve('..'),vault=resolve(vaultPath);
 assert(existsSync(join(vault,'AGENTS.md'))&&existsSync(join(vault,'Notes/Me/Knowledge')),'Not an experience-vault checkout');
 const guide='.claude/skills/voxel-agent',folder='Notes/Me/Knowledge/Voxel agent',web='Notes/Me/Knowledge/Web design agent',atmosphere=`${web}/Voxel atmosphere`;
 const files=['SKILL.md','SYSTEM.md','RULES.md','LOOK.md','examples/prompt.md','examples/README.md',...readdirSync(join(root,guide,'playbooks')).filter(f=>f.endsWith('.md')).map(f=>`playbooks/${f}`)];
 const mapping=Object.fromEntries(files.map(f=>[`${guide}/${f}`,`${folder}/${f}`]));
 mapping['docs/voxel-agent/island.md']=`${folder}/Voxcel Island.md`;
 mapping['docs/voxel-agent/design.md']=`${folder}/Design decisions.md`;
 mapping['docs/voxel-agent/references.md']=`${folder}/References.md`;
 mapping['.claude/agents/voxel-agent.md']=`${folder}/Agent.md`;mapping['docs/voxel-agent/README.md']=`${folder}/Overview.md`;
 const webGuide='.claude/skills/web-design-agent';
 for(const file of ['SKILL.md','SYSTEM.md','RULES.md','LOOK.md','examples/prompt.md','examples/README.md','playbooks/voxel-atmosphere.md'])mapping[`${webGuide}/${file}`]=`${web}/${file}`;
 mapping['.claude/agents/web-design-agent.md']=`${web}/Agent.md`;mapping['docs/voxel-agent/atmosphere.md']=`${atmosphere}/Design.md`;mapping['docs/voxel-agent/atmosphere-references.md']=`${atmosphere}/References.md`;
 const links={...mapping,'astro/src/figures/kit/voxel-world/pipeline.json':`${folder}/Pipeline.json`,'docs/voxel-agent/references.json':`${folder}/References.json`};
 const manifestFile=join(vault,folder,'Source manifest.json');
 const previous=existsSync(manifestFile)?JSON.parse(readFileSync(manifestFile,'utf8')):null;
 const date=check&&previous?previous.exportedDate:new Date().toISOString().slice(0,10);
 const writes=[];
 for(const[source,target]of Object.entries(mapping)) {
  const raw=readFileSync(join(root,source),'utf8');let body=raw.replace(/^---\n[\s\S]*?\n---\n/,'');
  body=body.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(all,label,url)=>{
   if(url.startsWith('http')||url.startsWith('#'))return all;
   const path=relative(root,resolve(root,dirname(source),url));
   return links[path]?`[[${links[path].replace(/\.md$/,'')}|${label}]]`:all;
  });
  const front=`---\ntype: knowledge\nschema: knowledge/2\nstatus: draft\nauthority: unreviewed\nevidence_kind: mixed\ntopics:\n  - Procedural voxel worlds\n  - Agent workflows\ntags:\n  - type/knowledge\n  - domain/web-frontend\nupdated: ${date}\n---\n\n`;
  const notice=`> Maintained mirror of the site workflow: \`${source}\`. Source SHA-256: \`${hash(raw)}\`. Change the source and rerun the export; this mirror is not independently approved guidance.\n\n`;
  writes.push({source,target,sourceHash:hash(raw),body:front+notice+body});
 }
 const source=sourceSnapshot(root,atmosphere),implementation=source.implementation;
 writes.push(source.write);
 for(const file of ['src/figures/kit/voxel-world/pipeline.json','docs/voxel-agent/references.json']) {
  const path=file.startsWith('src/')?join(root,'astro',file):join(root,file),body=readFileSync(path,'utf8');
  writes.push({source:file,target:`${folder}/${file.endsWith('pipeline.json')?'Pipeline':'References'}.json`,sourceHash:hash(body),body});
 }
 const reportPath='figures-out/voxel-agent-report.json';let report=null;
 if(existsSync(reportPath)) {
  report=JSON.parse(readFileSync(reportPath,'utf8'));assert.equal(report.kernelFingerprint,kernelFingerprint(),'Audit report predates current kernel; rerun voxel:check');const {sha256,...content}=report;assert.equal(hash(JSON.stringify(content)),sha256,'Audit report hash mismatch');
  writes.push({source:reportPath,target:`${folder}/Reports/current.json`,sourceHash:hash(readFileSync(reportPath)),body:readFileSync(reportPath,'utf8')});
 }
 for(const file of ['voxel-camera-report.json','voxel-content-report.json','voxel-browser-evidence.json','voxel-visual-review.json','voxel-scene.seeds.png','voxel-mesh-report.json','voxel-gpu-report.json','voxel-verification.json','voxel-snapshot-replay.json','voxel-stress-report.json','voxel-scene.png','voxel-focus.png','voxel-world-phone.png','voxel-controls-phone.png','voxel-public-atlas.png']) {
  const source=`figures-out/${file}`;if(!existsSync(source))continue;
  const body=readFileSync(source);
  if(file.endsWith('.json'))assert.equal(JSON.parse(body.toString()).kernelFingerprint,kernelFingerprint(),`Stale evidence ${file}`);
  writes.push({source,target:`${folder}/Reports/${file}`,sourceHash:hash(body),body});
 }
 const gallery='figures-out/voxel-gallery',galleryManifest=`${gallery}/manifest.json`;
 if(existsSync(galleryManifest)) {
  assert.equal(JSON.parse(readFileSync(galleryManifest,'utf8')).kernelFingerprint,kernelFingerprint(),'Stale gallery');
  for(const file of ['manifest.json','frozen-0-detail.png','desert-0-detail.png','rainforest-0-detail.png','city-0-detail.png','caves-overview.png',...readdirSync(gallery).filter(f=>/^(overview-sheet|catalog-\d+)\.png$/.test(f))]){const body=readFileSync(`${gallery}/${file}`);writes.push({source:`${gallery}/${file}`,target:`${folder}/Reports/Gallery/${file}`,sourceHash:hash(body),body});}
 }
 for(const file of readdirSync('figures-out').filter(f=>['voxel-v2-baseline.json','voxel-kernel-before-focal-fix.json','voxel-kernel-before-roof-fix.json','voxel-kernel-before-camera-fix.json','voxel-camera-before-clearance.png','voxel-camera-center-ray-only.png','voxel-camera-center-ray-only.json','voxel-kernel-center-ray-only.json','voxel-snapshot-replay-before-camera.json','voxel-figure-before-camera.json','voxel-content-before-frog.json','voxel-snapshot-support.json'].includes(f)||/^voxel-stress-failure-.*\.json$/.test(f))){const body=readFileSync(`figures-out/${file}`);writes.push({source:`figures-out/${file}`,target:`${folder}/Reports/History/${file}`,sourceHash:hash(body),body});}
 for(const file of readdirSync('figures-out').filter(f=>/^voxcel-island.*\.(json|png)$/.test(f))){const body=readFileSync(`figures-out/${file}`);if(file.endsWith('.json'))assert.equal(JSON.parse(body.toString()).islandFingerprint,islandFingerprint(join(root,'astro')),`Stale island evidence ${file}`);writes.push({source:`figures-out/${file}`,target:`${folder}/Reports/Island/${file}`,sourceHash:hash(body),body});}
 for(const file of ['voxel-atmosphere-check.json','voxel-atmosphere-browser.json']){const path=`figures-out/${file}`;if(!existsSync(path))continue;const body=readFileSync(path);const data=JSON.parse(body.toString());assert.equal(data.kernelFingerprint,kernelFingerprint(),`Stale atmosphere evidence ${file}`);assert.equal(data.islandFingerprint,islandFingerprint(join(root,'astro')),`Stale island atmosphere evidence ${file}`);writes.push({source:path,target:`${atmosphere}/Reports/${file}`,sourceHash:hash(body),body});}
 const imageDir='figures-out/voxel-atmosphere';if(existsSync(imageDir))for(const file of readdirSync(imageDir).filter(f=>f.endsWith('.png')&&!f.startsWith('early-'))){const body=readFileSync(`${imageDir}/${file}`);writes.push({source:`${imageDir}/${file}`,target:`${atmosphere}/Evidence/${file}`,sourceHash:hash(body),body});}
 const sequence=readFileSync(join(root,'astro/src/figures/kit/voxel-atmosphere/pipeline.json'));writes.push({source:'astro/src/figures/kit/voxel-atmosphere/pipeline.json',target:`${atmosphere}/Pipeline.json`,sourceHash:hash(sequence),body:sequence});
 const webIndex=`---\ntype: knowledge\nschema: knowledge/2\nstatus: draft\nauthority: unreviewed\nevidence_kind: mixed\ntopics:\n  - Frontend design\n  - Agent workflows\nupdated: ${date}\n---\n\n# Web design agent\n\nOne web design agent operates visual treatment and evidence review. The voxel workflow is a specialized playbook, not another running worker. This authored guidance is unreviewed; it does not replace the user's current instruction.\n\nStart at [[${web}/SKILL|the workflow]], [[${web}/SYSTEM|the system index]], [[${web}/RULES|the atmosphere rules]] and [[${web}/LOOK|visual review]]. Use [[${web}/playbooks/voxel-atmosphere|the voxel atmosphere playbook]] and [[${web}/examples/prompt|the run prompt]].\n\n[[${atmosphere}/Design|Lighting and weather]] records the design, pipeline, constraints and limits. [[${atmosphere}/References|The reference card]] records the sources actually read. [[${atmosphere}/Pipeline.json|The executable sequence]] matches the controller trace. The exact full source is [[${source.write.target}|snapshot ${source.snapshot}]], including both scene kernels, templates, controls, scripts and checks. Read the Reports and Evidence folders beside it; pixel checks and unreviewed visual judgments remain separate.\n\n[[Notes/Me/Knowledge/Voxel agent|The voxel workflow]] retains the geometry, placement and biome playbooks and their earlier immutable snapshots. Both Voxel Worlds and Voxel Island use this atmosphere treatment. The island's historical URL and earlier archive names remain unchanged.\n`;
 writes.push({source:'generated web design index',target:`${web}.md`,sourceHash:hash(webIndex),body:webIndex});
 const feedbackDir='figures-out/voxel-feedback';
 if(existsSync(feedbackDir))for(const file of readdirSync(feedbackDir).filter(f=>f.endsWith('.json')))writes.push({source:`${feedbackDir}/${file}`,target:`${folder}/Feedback/${file}`,sourceHash:hash(readFileSync(`${feedbackDir}/${file}`)),body:readFileSync(`${feedbackDir}/${file}`,'utf8')});
 const index=`---\ntype: knowledge\nschema: knowledge/2\nstatus: draft\nauthority: unreviewed\nevidence_kind: mixed\ntopics:\n  - Procedural voxel worlds\n  - Agent workflows\nupdated: ${date}\n---\n\n# Voxel agent\n\nThe web design agent operates the procedural-world workflow as one agent. The site owns the executable stages and checks; these notes preserve the maintained playbooks and run evidence for later feedback. Agent-authored guidance is unreviewed. The user's current request still controls the work.\n\nStart at [[${folder}/SKILL|the voxel-agent skill]] and [[${folder}/SYSTEM|the system index]]. The [[${folder}/RULES|rule table]] links requirements to checks; [[${folder}/LOOK|visual review]] keeps judgments separate from geometric passes. [[${folder}/examples/prompt|The run prompt]] provides a bounded task.\n\nThe [[${folder}/Voxcel Island|Voxcel Island guide]] records the separate compact restoration, its pipeline and checks. Its artifacts live under Reports/Island/; the larger world keeps its own generator and evidence.\n\n## Playbooks\n\n${files.filter(f=>f.startsWith('playbooks/')).map(f=>`- [[${folder}/${f.replace(/\.md$/,'')}]]`).join('\n')}\n\n## Evidence and next use\n\n${report?`The exported audit covers ${report.worlds} worlds. Its report hash is \`${report.sha256}\`. Read [[${folder}/Reports/current.json|the current report]] for measured coverage; this is evidence from this run, not approval of future edits.`:'No mechanical run report has been exported yet.'}\n\nThe [[${folder}/Pipeline.json|canonical pipeline]] records the executed stage sequence. The immutable full source/script snapshot is [[${source.write.target}|snapshot ${source.snapshot}]]; each entry retains its original path, bytes, content and SHA-256. Reconstruct it as an overlay on the recorded site base commit. The source manifest fingerprints the guidance and implementation. Feedback records retain the original observation, seed, rule and evidence. A future run reproduces the case, changes the owning stage, reruns the old cases, and exports a new record. No generated Chats files or approved personal guidance are changed.\n`;
 writes.push({source:'generated index',target:'Notes/Me/Knowledge/Voxel agent.md',sourceHash:hash(index),body:index});
 const manifest={schema:'voxel-vault-mirror/2',exportedDate:date,baseCommit:source.baseCommit,snapshot:source.snapshot,implementation,fingerprint:source.fingerprint,files:writes.map(({source,target,sourceHash,body})=>({source,target,sourceHash,mirrorHash:hash(body)}))};
 for(const item of writes){const target=join(vault,item.target);if(!check&&existsSync(target)){const prior=previous?.files.find(f=>f.target===item.target);assert(prior&&hash(readFileSync(target))===prior.mirrorHash||readFileSync(target).equals(Buffer.from(item.body)),`Mirror edited outside exporter: ${item.target}`);}}
 for(const item of writes){const target=join(vault,item.target);if(check){assert(existsSync(target),`Missing mirror ${item.target}`);assert.deepEqual(readFileSync(target),Buffer.from(item.body),`Stale mirror ${item.target}`);}else{mkdirSync(dirname(target),{recursive:true});writeFileSync(target,item.body);}}
 if(check){assert(previous,'Missing source manifest');assert.equal(previous.fingerprint,manifest.fingerprint,'Implementation fingerprint drift');}
 else{mkdirSync(dirname(manifestFile),{recursive:true});writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');}
 return {schema:manifest.schema,files:writes.length,snapshot:source.snapshot,fingerprint:manifest.fingerprint,report:report?.sha256??null,mode:check?'checked':'exported'};
}
