import {
  BufferGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Vector3,
} from 'three';
import type { NightKey } from '../../styles/tokens/palette';
import { edgeModel, viewEdges } from './drawing/edges';
import { sketchGeometry, type SketchPart } from './drawing/parts';
import { hexOf } from './ink';
import { plastic } from './legoscene';

export { leadingEdge, sketchGeometry, type SketchPart } from './drawing/parts';

/** The sketch as lines (its hard edges, and with `look` its silhouette from there) or as solids. */
export function sketchModel(
  parts: SketchPart[],
  lines: boolean,
  own: (d: () => void) => void,
  tone?: NightKey,
  look?: Vector3,
): Group {
  const g = new Group();
  for (const p of parts) {
    const geo = sketchGeometry(p);
    own(() => geo.dispose());
    if (lines) {
      const mat = new LineBasicMaterial({ color: hexOf(tone ?? p.tone) });
      // Seen along `look`, a smooth part draws its silhouette too, or it has no outline.
      const edges = look
        ? new BufferGeometry().setAttribute('position', new Float32BufferAttribute(viewEdges(edgeModel(geo), look), 3))
        : new EdgesGeometry(geo, 24);
      const e = new LineSegments(edges, mat);
      own(() => {
        e.geometry.dispose();
        mat.dispose();
      });
      g.add(e);
    } else {
      const m = new Mesh(geo, plastic());
      m.material.color.set(hexOf(p.tone));
      m.material.side = DoubleSide;
      own(() => m.material.dispose());
      g.add(m);
    }
  }
  return g;
}
