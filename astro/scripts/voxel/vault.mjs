import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {kernelFingerprint} from './fingerprint.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function exportVault(vaultPath,check=false) {
 const root=resolve('..'),vault=resolve(vaultPath);
 assert(existsSync(join(vault,'AGENTS.md'))&&existsSync(join(vault,'Notes/Me/Knowledge')),'Not an experience-vault checkout');
 const guide='.claude/skills/voxel-agent',folder='Notes/Me/Knowledge/Voxel agent';
 const files=['SKILL.md','SYSTEM.md','RULES.md','LOOK.md','examples/prompt.md','examples/README.md',...readdirSync(join(root,guide,'playbooks')).filter(f=>f.endsWith('.md')).map(f=>`playbooks/${f}`)];
 const mapping=Object.fromEntries(files.map(f=>[`${guide}/${f}`,`${folder}/${f}`]));
 mapping['.claude/agents/voxel-agent.md']=`${folder}/Agent.md`;mapping['docs/voxel-agent/README.md']=`${folder}/Overview.md`;
 const manifestFile=join(vault,folder,'Source manifest.json');
 const previous=existsSync(manifestFile)?JSON.parse(readFileSync(manifestFile,'utf8')):null;
 const date=check&&previous?previous.exportedDate:new Date().toISOString().slice(0,10);
 const writes=[];
 for(const[source,target]of Object.entries(mapping)) {
  const raw=readFileSync(join(root,source),'utf8');let body=raw.replace(/^---\n[\s\S]*?\n---\n/,'');
  body=body.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(all,label,url)=>{
   if(url.startsWith('http')||url.startsWith('#'))return all;
   const path=relative(root,resolve(root,dirname(source),url));
   return mapping[path]?`[[${mapping[path].replace(/\.md$/,'')}|${label}]]`:all;
  });
  const front=`---\ntype: knowledge\nschema: knowledge/2\nstatus: draft\nauthority: unreviewed\nevidence_kind: mixed\ntopics:\n  - Procedural voxel worlds\n  - Agent workflows\ntags:\n  - type/knowledge\n  - domain/web-frontend\nupdated: ${date}\n---\n\n`;
  const notice=`> Maintained mirror of the site workflow: \`${source}\`. Source SHA-256: \`${hash(raw)}\`. Change the source and rerun the export; this mirror is not independently approved guidance.\n\n`;
  writes.push({source,target,sourceHash:hash(raw),body:front+notice+body});
 }
 const sourceFiles=[...readdirSync('src/figures/kit/voxel-world').filter(f=>/\.(ts|json)$/.test(f)).map(f=>`src/figures/kit/voxel-world/${f}`),...readdirSync('scripts/voxel').filter(f=>f.endsWith('.mjs')).map(f=>`scripts/voxel/${f}`),'src/figures/templates/voxel-scene.ts','src/components/lab/VoxelStage.tsx','src/components/lab/VoxelWorldControls.tsx','src/components/lab/TemplateLab.tsx'];
 const implementation=sourceFiles.sort().map(path=>({path:`astro/${path}`,sha256:hash(readFileSync(path))}));
 const reportPath='figures-out/voxel-agent-report.json';let report=null;
 if(existsSync(reportPath)) {
  report=JSON.parse(readFileSync(reportPath,'utf8'));assert.equal(report.kernelFingerprint,kernelFingerprint(),'Audit report predates current kernel; rerun voxel:check');const {sha256,...content}=report;assert.equal(hash(JSON.stringify(content)),sha256,'Audit report hash mismatch');
  writes.push({source:reportPath,target:`${folder}/Reports/current.json`,sourceHash:hash(readFileSync(reportPath)),body:readFileSync(reportPath,'utf8')});
 }
 for(const file of ['voxel-browser-evidence.json','voxel-visual-review.json','voxel-scene.seeds.png']) {
  const source=`figures-out/${file}`;if(!existsSync(source))continue;
  const body=readFileSync(source);
  if(file.endsWith('.json'))assert.equal(JSON.parse(body.toString()).kernelFingerprint,kernelFingerprint(),`Stale evidence ${file}`);
  writes.push({source,target:`${folder}/Reports/${file}`,sourceHash:hash(body),body});
 }
 const feedbackDir='figures-out/voxel-feedback';
 if(existsSync(feedbackDir))for(const file of readdirSync(feedbackDir).filter(f=>f.endsWith('.json')))writes.push({source:`${feedbackDir}/${file}`,target:`${folder}/Feedback/${file}`,sourceHash:hash(readFileSync(`${feedbackDir}/${file}`)),body:readFileSync(`${feedbackDir}/${file}`,'utf8')});
 const index=`---\ntype: knowledge\nschema: knowledge/2\nstatus: draft\nauthority: unreviewed\nevidence_kind: mixed\ntopics:\n  - Procedural voxel worlds\n  - Agent workflows\nupdated: ${date}\n---\n\n# Voxel agent\n\nOne voxel agent operates the procedural-world workflow. The site owns the executable stages and checks; these notes preserve the maintained playbooks and run evidence for later feedback. Agent-authored guidance is unreviewed. The user's current request still controls the work.\n\nStart at [[${folder}/SKILL|the voxel-agent skill]] and [[${folder}/SYSTEM|the system index]]. The [[${folder}/RULES|rule table]] links requirements to checks; [[${folder}/LOOK|visual review]] keeps judgments separate from geometric passes. [[${folder}/examples/prompt|The run prompt]] provides a bounded task.\n\n## Playbooks\n\n${files.filter(f=>f.startsWith('playbooks/')).map(f=>`- [[${folder}/${f.replace(/\.md$/,'')}]]`).join('\n')}\n\n## Evidence and next use\n\n${report?`The exported audit covers ${report.worlds} worlds. Its report hash is \`${report.sha256}\`. Read [[${folder}/Reports/current.json|the current report]] for measured coverage; this is evidence from this run, not approval of future edits.`:'No mechanical run report has been exported yet.'}\n\nThe source manifest fingerprints the guidance and implementation. Feedback records retain the original observation, seed, rule and evidence. A future run reproduces the case, changes the owning stage, reruns the old cases, and exports a new record. No generated Chats files or approved personal guidance are changed.\n`;
 writes.push({source:'generated index',target:'Notes/Me/Knowledge/Voxel agent.md',sourceHash:hash(index),body:index});
 const manifest={schema:'voxel-vault-mirror/1',exportedDate:date,baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),implementation,fingerprint:hash(JSON.stringify(implementation)),files:writes.map(({source,target,sourceHash,body})=>({source,target,sourceHash,mirrorHash:hash(body)}))};
 for(const item of writes){const target=join(vault,item.target);if(!check&&existsSync(target)){const prior=previous?.files.find(f=>f.target===item.target);assert(prior&&hash(readFileSync(target))===prior.mirrorHash||readFileSync(target).equals(Buffer.from(item.body)),`Mirror edited outside exporter: ${item.target}`);}}
 for(const item of writes){const target=join(vault,item.target);if(check){assert(existsSync(target),`Missing mirror ${item.target}`);assert.deepEqual(readFileSync(target),Buffer.from(item.body),`Stale mirror ${item.target}`);}else{mkdirSync(dirname(target),{recursive:true});writeFileSync(target,item.body);}}
 if(check){assert(previous,'Missing source manifest');assert.equal(previous.fingerprint,manifest.fingerprint,'Implementation fingerprint drift');}
 else{mkdirSync(dirname(manifestFile),{recursive:true});writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');}
 return {schema:manifest.schema,files:writes.length,fingerprint:manifest.fingerprint,report:report?.sha256??null,mode:check?'checked':'exported'};
}
