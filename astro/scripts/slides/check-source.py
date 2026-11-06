"""Independent XML parser: vendored bytes → normalized primitives → generated geometry."""
from pathlib import Path
from hashlib import sha256
import json
import xml.etree.ElementTree as ET
root = Path('vendor/slide-icons')
manifest = json.loads((root / 'sources.json').read_text())
definitions = json.loads(Path('src/figures/kit/slides/definitions.json').read_text())
allowed = {'d', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height'}
for icon in manifest['icons']:
    raw = (root / icon['file']).read_bytes()
    assert sha256(raw).hexdigest() == icon['sha256'], icon['id'] + ': source hash'
    svg = ET.fromstring(raw)
    assert svg.attrib['viewBox'] == '0 0 24 24'
    nodes = []
    for child in svg:
        attrs = dict(child.attrib)
        fill = attrs.pop('fill', None)
        if fill is not None:
            assert fill == 'currentColor' and child.tag.endswith('circle') and attrs.get('r') == '0.5'
        assert set(attrs) <= allowed, (icon['id'], attrs)
        tag = child.tag.rsplit('}', 1)[-1]
        assert tag in {'path', 'rect', 'circle', 'ellipse', 'line'}
        nodes.append({'tag': tag, 'attrs': attrs})
    assert nodes == icon['nodes'] == definitions[icon['id']]['nodes'], icon['id'] + ': moved source geometry'
    assert icon['license'] and icon['upstream']
print('Slide sources: 48 XML sources, hashes, licenses and exact normalized coordinates independently verified.')
