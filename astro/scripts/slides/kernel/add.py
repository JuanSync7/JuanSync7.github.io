"""Stage one new asset/spec. No validator, policy, review or unrelated asset is writable here."""
from pathlib import Path
import argparse,json,re,hashlib,subprocess,os,tempfile,xml.etree.ElementTree as ET
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--spec',required=True);parser.add_argument('--svg',required=True)
parser.add_argument('--license-file');parser.add_argument('--license-id')
args=parser.parse_args();candidate=json.loads(Path(args.spec).read_text());raw=Path(args.svg).read_bytes()
icon_id=candidate['id'];family=candidate['group']
if not re.fullmatch('[a-z][a-z0-9-]*',icon_id) or not re.fullmatch('[a-z][a-z0-9-]*',family):raise SystemExit('Use safe kebab-case ids and families')
manifest_path=Path('vendor/slide-icons/sources.json');manifest=json.loads(manifest_path.read_text())
if any(i['id']==icon_id for i in manifest['icons']):raise SystemExit('Icon already exists; edit its existing spec deliberately')
relative=candidate['file']
if not re.fullmatch(r'[a-z][a-z0-9-]*/[a-z][a-z0-9-]*\.svg',relative):raise SystemExit('Unsafe source path')
target=manifest_path.parent/relative
if target.exists():raise SystemExit('Source already exists; staging never overwrites a source')
svg=ET.fromstring(raw)
policy=json.loads(Path('scripts/slides/rules.json').read_text())
if svg.attrib.get('viewBox')!=f"0 0 {policy['grid']} {policy['grid']}":raise SystemExit('Source must use the theme grid; normalize before staging')
nodes=[]
for child in svg:
 attrs=dict(child.attrib);fill=attrs.pop('fill',None)
 if fill is not None and not (fill=='currentColor' and child.tag.endswith('circle') and attrs.get('r')=='0.5'):raise SystemExit('Unreviewed filled source feature')
 nodes.append({'tag':child.tag.rsplit('}',1)[-1],'attrs':attrs})
candidate.update(schema='slide-icon/2',sha256=hashlib.sha256(raw).hexdigest(),nodes=nodes)
pending_notice=None
if args.license_file:
 if not args.license_id or not re.fullmatch('[a-z][a-z0-9-]*',args.license_id):raise SystemExit('A new license needs a safe --license-id')
 notice=Path(args.license_file).read_bytes();license_path=manifest_path.parent/'licenses'/(args.license_id+'.txt')
 if args.license_id in manifest['licenses'] or license_path.exists():raise SystemExit('License already exists; staging never overwrites a notice')
 pending_notice=(license_path,notice)
 manifest['licenses'][args.license_id]={'file':'licenses/'+args.license_id+'.txt','sha256':hashlib.sha256(notice).hexdigest()}
if not candidate.get('licenses') or any(ref not in manifest['licenses'] for ref in candidate['licenses']):raise SystemExit('Declare existing licenses or stage a full new notice')
manifest['icons'].append(candidate)
subprocess.run(['node','scripts/slides/kernel/preflight.mjs'],input=json.dumps(manifest),text=True,check=True)
created=[];temporary=None
try:
 target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw);created.append(target)
 if pending_notice:
  license_path,notice=pending_notice;license_path.parent.mkdir(exist_ok=True);license_path.write_bytes(notice);created.append(license_path)
 with tempfile.NamedTemporaryFile(mode='w',dir=manifest_path.parent,delete=False) as output:
  temporary=Path(output.name);output.write(json.dumps(manifest,indent=2)+'\n')
 os.replace(temporary,manifest_path);temporary=None
except BaseException:
 for owned in created:owned.unlink(missing_ok=True)
 if temporary:temporary.unlink(missing_ok=True)
 raise
print(f'Staged {icon_id}. Run slides:import, then slides:proof. No visual approval was created.')
