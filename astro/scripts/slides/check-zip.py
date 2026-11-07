from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import json
root = Path('public/downloads/slide-icons')
manifest = json.loads((root / 'manifest.json').read_text());icons=manifest['icons']
expected={'README.txt','manifest.json','quality-report.json'}
expected.update(notice['file'] for notice in manifest['licenses'].values())
for tone in ['night','paper']:
 for look in ['accent','mono']:
  expected.update(f'{tone}/{look}/{i["id"]}.svg' for i in icons)
  expected.update({f'{tone}/{look}/collections/sprite.svg',f'{tone}/{look}/collections/overview.svg'})
expected.update(f'proofs/icons/{i["id"]}.svg' for i in icons)
expected.update(f'proofs/families/{group}.svg' for group in {i['group'] for i in icons})
with ZipFile(root/'slide-icons.zip') as archive:
 assert archive.testzip() is None
 names=archive.namelist();assert len(names)==len(set(names)) and set(names)==expected
 for name in names:
  raw=archive.read(name);assert raw==(root/name).read_bytes(),name
  if name.endswith('.svg'):ET.fromstring(raw)
print(f'Slide ZIP: {len(expected)} complete entries for {len(icons)} icons; independent XML, contents and checksums passed.')
