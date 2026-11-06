from pathlib import Path
from zipfile import ZipFile

root = Path('public/downloads/slide-icons')
with ZipFile(root / 'slide-icons.zip') as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    assert len(names) == 106 and len(set(names)) == 106
    for name in names:
        assert archive.read(name) == (root / name).read_bytes(), name
print('Slide ZIP: 106 complete entries, independently decoded contents and checksums passed.')
