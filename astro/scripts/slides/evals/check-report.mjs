import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const config=JSON.parse(readFileSync('scripts/slides/evals/config.json','utf8'));
export function checkReport(report){
 assert.equal(report.schema,'slide-playbook-evaluation/1');
 assert.ok(['pending','complete'].includes(report.status));
 assert.ok(report.baseline?.revision&&report.candidate?.playbookDigest);
 if(report.status==='pending'){assert.ok(report.pending.length);return;}
 assert.ok(report.cases.length>=config.pairedTrials,'A smaller run is partial evidence');
 assert.ok(config.requiredCoverage.every(kind=>report.cases.some(c=>c.coverage.includes(kind))));
 const actors=new Set();
 for(const pair of report.cases){
  for(const variant of ['baseline','candidate']){
   const run=pair[variant];assert.ok(run.actor&&!actors.has(run.actor),'Trials use fresh sessions');actors.add(run.actor);
   assert.ok(['success','failure','blocked','unknown'].includes(run.outcome));
   assert.ok(run.checks.length&&run.checks.every(check=>Number.isInteger(check.exitCode)&&check.evidence.path&&check.evidence.sha256));
   for(const check of run.checks){const bytes=readFileSync(check.evidence.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),check.evidence.sha256);}
   for(const key of ['effort','cost','interventions'])assert.ok(run[key]===null||typeof run[key]==='number');
  }
  assert.ok(pair.judge.actor!==pair.baseline.actor&&pair.judge.actor!==pair.candidate.actor&&pair.judge.actor!==report.implementer);
  assert.ok(config.judgmentCriteria.every(key=>pair.judge.judgments[key]?.evidence));
 }
 assert.ok(report.limits.length,'Report bounded evidence and remaining uncertainty');
}
if(process.argv[2]){const report=JSON.parse(readFileSync(process.argv[2],'utf8'));checkReport(report);console.log(`Playbook evaluation record: ${report.status}; no unrecorded trials inferred.`);}
