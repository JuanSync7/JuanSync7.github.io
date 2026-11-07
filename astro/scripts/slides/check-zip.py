from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import json
root = Path('public/downloads/slide-icons')
icons = json.loads((root / 'manifest.json').read_text())['icons']
expected = len(icons)*5 + 8 + len({i['group'] for i in icons}) + 5
with ZipFile(root / 'slide-icons.zip') as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    assert len(names) == expected and len(set(names)) == expected
    for name in names:
        raw = archive.read(name)
        assert raw == (root / name).read_bytes(), name
        if name.endswith('.svg'):
            ET.fromstring(raw)
print(f'Slide ZIP: {expected} complete entries, XML, independent contents and checksums passed.')
