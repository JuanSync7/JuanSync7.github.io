"""Asset tasks cannot change the maintained engine. Maintenance needs a revision-bound independent review.
This checks records and diffs; actor strings are not authenticated identities or a security sandbox.
"""
from pathlib import Path
import argparse,subprocess,json,hashlib
ROOT=Path(__file__).resolve().parents[4]
POLICY='astro/scripts/slides/ownership.json'
def git(*args):return subprocess.run(['git',*args],cwd=ROOT,check=True,capture_output=True,text=True).stdout

def protected(path,policy):
 if path in policy['assetFiles'] or any(path.startswith(p) for p in policy['assetPrefixes']):return False
 return path in policy['protectedFiles'] or any(path.startswith(p) for p in policy['protectedPrefixes'])

def candidate_digest(paths):
 digest=hashlib.sha256()
 for path in sorted(paths):
  digest.update((path+'\0').encode());f=ROOT/path
  digest.update(f.read_bytes() if f.is_file() else b'<deleted>');digest.update(b'\0')
 return digest.hexdigest()

def check(base,mode):
 current=json.loads((ROOT/POLICY).read_text())
 try:prior=json.loads(git('show',f'{base}:{POLICY}'))
 except subprocess.CalledProcessError:prior=current
 # The base policy decides protected paths. A candidate cannot expand its own author permissions.
 changed=set(git('diff','--name-only',base,'--').splitlines())
 changed.update(git('ls-files','--others','--exclude-standard').splitlines())
 owned=sorted(p for p in changed if protected(p,prior) or p==POLICY)
 if not owned:print('Slide ownership: asset-only changes; maintained engine untouched.');return
 digest=candidate_digest(owned)
 if mode!='maintainer':raise SystemExit('Protected icon engine/playbook changed. Asset tasks must retain it; maintainer review is required: '+', '.join(owned))
 path=ROOT/current['maintenanceRecord']
 if not path.exists():raise SystemExit(f'Missing independent maintenance record; candidate {digest}')
 review=json.loads(path.read_text())
 assert review['schema']=='slide-maintenance-review/1' and review['verdict']=='pass'
 assert review['candidate']==digest,'Maintenance review is stale'
 assert review['base']==git('rev-parse',base).strip(),'Review must name the exact base revision'
 assert review['author']!=review['reviewer'] and review['reviewer'],'Maintenance needs a distinct actual reviewer'
 evidence=ROOT/review['evidence']['path'];assert evidence.is_file()
 assert hashlib.sha256(evidence.read_bytes()).hexdigest()==review['evidence']['sha256'],'Review evidence changed'
 print(f'Slide ownership: {len(owned)} maintained files match the reviewed candidate {digest}.')

def selftest():
 policy=json.loads((ROOT/POLICY).read_text())
 for path in ['astro/vendor/slide-icons/original/unseen.svg','astro/src/data/slide-icons/new-domain.ts','astro/src/figures/kit/slides/definitions.json']:assert not protected(path,policy),path
 for path in ['astro/scripts/slides/audit.mjs','astro/scripts/slides/ownership.json','.claude/skills/slide-icons/RULES.md','astro/src/figures/kit/slides/svg.ts']:assert protected(path,policy),path
 print('Slide ownership selftest: new assets/families allowed; checker, policy, craft and renderer edits require maintenance.')

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--base',default='origin/main');parser.add_argument('--mode',choices=['asset','maintainer'],default='asset');parser.add_argument('--selftest',action='store_true');parser.add_argument('--digest',action='store_true')
 args=parser.parse_args()
 if args.selftest:selftest()
 elif args.digest:
  policy=json.loads((ROOT/POLICY).read_text());changed=set(git('diff','--name-only',args.base,'--').splitlines())|set(git('ls-files','--others','--exclude-standard').splitlines());print(candidate_digest([p for p in changed if protected(p,policy) or p==POLICY]))
 else:check(args.base,args.mode)
