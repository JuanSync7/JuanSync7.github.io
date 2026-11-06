"""Reusing an approved mark must preserve canonical data and reject stale export bytes."""
from pathlib import Path
import subprocess,json,hashlib
root=Path('public/downloads/slide-icons');catalog=json.loads(Path('vendor/slide-icons/sources.json').read_text())['icons'];icon=catalog[0]
tracked=['vendor/slide-icons/sources.json','vendor/slide-icons/reviews.json','src/figures/kit/slides/definitions.json','src/data/slide-icons.ts','src/data/slide-stats.json']
def snapshot():return {p:hashlib.sha256(Path(p).read_bytes()).hexdigest()for p in tracked}
before=snapshot();args=['node','scripts/slides/use.mjs','--id='+icon['id'],'--task=Deterministic unchanged-reuse regression','--why=Test of the reuse mechanism; semantic fit is deliberately not independently judged','--actor=deterministic-reuse-test']
def run(success=True):
 result=subprocess.run(args,capture_output=True,text=True)
 if success:assert result.returncode==0,result.stderr;return json.loads(result.stdout)
 assert result.returncode!=0,'A stale asset was accepted'
first=run();second=run();assert first['receipt']==second['receipt'],'Identical input must preserve receipt identity'
receipt=json.loads(Path(first['record']).read_text());asset=Path('public'+receipt['asset']);original=asset.read_bytes()
assert Path(first['svg']).read_bytes()==original
assert receipt['verification']['semanticFit']=='reported by caller'
try:
 asset.write_bytes(original+b' ');run(success=False)
finally:asset.write_bytes(original)
assert snapshot()==before,'Unchanged reuse modified canonical sources, reviews or generated identity data'
report={'schema':'slide-reuse-test/1','canonicalUnchanged':True,'deterministicReceipt':True,'exactCopy':True,'staleExportRejected':True,'semanticFit':'not measured by this test'}
Path('slides-out/reuse-test.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
