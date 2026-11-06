"""Exercise add/import/proof on an isolated library, including a new family and third-party license.
No LLM creativity or independent-review claim is inferred from this deterministic integration test.
"""
from pathlib import Path
import tempfile,shutil,subprocess,json,hashlib,os
SOURCE=Path.cwd();report_path=SOURCE/'slides-out'/'extensibility.json'
def digest(folder):
 h=hashlib.sha256()
 for f in sorted(folder.rglob('*')):
  if f.is_file() and f.suffix in {'.mjs','.py','.json'}:h.update(f.relative_to(folder).as_posix().encode());h.update(f.read_bytes())
 return h.hexdigest()
with tempfile.TemporaryDirectory(prefix='juansync-icon-extension-',dir='/tmp') as directory:
 root=Path(directory)/'astro';root.mkdir()
 for folder in ['scripts/slides','vendor/slide-icons','src/data/slide-icons','src/figures/kit/slides']:
  shutil.copytree(SOURCE/folder,root/folder)
 for file in ['src/data/slide-icons.ts','src/figures/kit/ink.ts','src/styles/tokens/palette.ts']:
  target=root/file;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy(SOURCE/file,target)
 os.symlink(SOURCE/'node_modules',root/'node_modules',target_is_directory=True)
 def run(*args,success=True):
  result=subprocess.run(args,cwd=root,capture_output=True,text=True,env={**os.environ,'ASTRO_TELEMETRY_DISABLED':'1'})
  if success and result.returncode:raise AssertionError(result.stdout+result.stderr)
  if not success:assert result.returncode!=0,'A deliberately invalid candidate was accepted'
  return result
 manifest=json.loads((root/'vendor/slide-icons/sources.json').read_text());before=len(manifest['icons']);protected=digest(root/'scripts/slides')
 candidate=json.loads((root/'vendor/slide-icons/candidates/freestanding-bathtub.json').read_text())
 candidate.update(id='unseen-vessel',name='Unseen vessel',group='new-domain',file='fixture-library/unseen-vessel.svg',licenses=['fixture-notice'])
 candidate['view']['description']='a newly named side plane'
 candidate['fit']['brief']='Synthetic extensibility fixture, not a published icon or measured creative trial.'
 spec=root/'candidate.json';spec.write_text(json.dumps(candidate));svg=root/'candidate.svg';svg.write_bytes((root/'vendor/slide-icons/original/freestanding-bathtub.svg').read_bytes())
 args=['python3','scripts/slides/kernel/add.py','--spec',str(spec),'--svg',str(svg),'--license-file',str(root/'vendor/slide-icons/ORIGINAL-LICENSE.txt'),'--license-id','fixture-notice']
 run(*args);run('node','scripts/slides/import.mjs');run('python3','scripts/slides/check-source.py');run('node','scripts/slides/export.mjs','--proof','--id=unseen-vessel')
 after=json.loads((root/'vendor/slide-icons/sources.json').read_text());assert len(after['icons'])==before+1
 assert (root/'src/data/slide-icons/new-domain.ts').exists()
 assert (root/'slides-out/review/unseen-vessel/proofs/unseen-vessel.svg').exists()
 assert not (root/'public/downloads/slide-icons/slide-icons.zip').exists()
 assert 'unseen-vessel' not in json.loads((root/'vendor/slide-icons/reviews.json').read_text())
 stable=(root/'vendor/slide-icons/sources.json').read_bytes();run(*args,success=False);assert (root/'vendor/slide-icons/sources.json').read_bytes()==stable
 bad={**candidate,'id':'broken-vessel','file':'fixture-library/broken-vessel.svg'};spec.write_text(json.dumps(bad));svg.write_bytes(svg.read_bytes().replace(b'M9 19v2',b'M9 20v2'))
 run('python3','scripts/slides/kernel/add.py','--spec',str(spec),'--svg',str(svg),success=False)
 assert (root/'vendor/slide-icons/sources.json').read_bytes()==stable and not (root/'vendor/slide-icons/fixture-library/broken-vessel.svg').exists()
 assert digest(root/'scripts/slides')==protected,'Adding an unknown noun/family/license changed the maintained engine'
 # Catalog contraction also works; the regression examples do not depend on production subjects.
 after['icons']=[after['icons'][-1]];(root/'vendor/slide-icons/sources.json').write_text(json.dumps(after))
 run('node','scripts/slides/import.mjs');run('node','scripts/slides/checks/selftest.mjs');run('node','scripts/slides/export.mjs',success=False)
 assert not (root/'public/downloads/slide-icons/slide-icons.zip').exists()
 result={'schema':'slide-extension-test/1','catalogBefore':before,'catalogAfterAddition':before+1,'catalogAfterContraction':len(after['icons']),'newFamily':True,'newLicense':True,'unknownViewName':True,'protectedEngineUnchanged':True,'badCandidateRolledBack':True,'duplicateRejected':True,'unreviewedPreviewOnly':True,'behavioralEvaluation':'not measured by this test'}
 report_path.parent.mkdir(exist_ok=True);report_path.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
