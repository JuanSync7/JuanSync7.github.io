import { TableDraft, finish } from './tableparts';
import { roomPlan } from './roomplan';
import type { TableScene } from './tabletop';
import type { RoomPart } from './tableroom';

/** A continuous roof with an interior finish; only the overview cuts it away. */
export function roomRoof(p: TableScene): RoomPart {
  const r = roomPlan(p),
    q = new TableDraft(),
    t = p.theme.id,
    depth = r.front - r.back,
    mid = (r.front + r.back) / 2;
  q.material('ceiling', () => q.box(0, r.top, mid - 0.08, r.half * 2 + 0.32, 0.16, depth + 0.16, 0));
  const domestic = t === 'dining' || t === 'study',
    timber = t === 'bar' || t === 'messy',
    grid = t === 'lab' || t === 'kitchen' || t === 'work',
    bays = 3 + r.variant;
  // The perimeter closes the wall joint and gives the finish a believable edge.
  q.material(domestic ? 'wall' : timber ? 'frame' : 'metal', () => {
    const trim = domestic ? 0.16 : 0.075;
    for (const x of [-r.half + trim / 2, r.half - trim / 2]) q.box(x, r.top - trim, mid, trim, trim, depth, 0.012);
    for (const z of [r.back + trim / 2, r.front - trim / 2])
      q.box(0, r.top - trim, z, r.half * 2 - trim * 2, trim, trim, 0.012);
  });
  if (domestic || timber) {
    q.material(timber ? 'frame' : 'ceiling', () => {
      for (let i = 1; i < bays; i++)
        q.box(0, r.top - 0.12, r.back + (depth * i) / bays, r.half * 2 - 0.32, 0.12, timber ? 0.16 : 0.12, 0.015);
      if (domestic || t === 'bar')
        for (const x of [-r.half / 3, r.half / 3]) q.box(x, r.top - 0.1, mid, 0.1, 0.1, depth - 0.32, 0.01);
    });
  } else if (grid || t === 'storage') {
    q.material('metal', () => {
      for (let i = 1; i < bays + 2; i++) {
        const z = r.back + (depth * i) / (bays + 2);
        q.box(0, r.top - 0.025, z, r.half * 2 - 0.15, 0.025, 0.025, 0);
      }
      for (let i = 1; i < 4; i++) q.box(-r.half + (r.half * i) / 2, r.top - 0.025, mid, 0.025, 0.025, depth - 0.15, 0);
    });
    // Raised ceiling tiles leave a shallow, real reveal inside the runner grid.
    q.material('ceiling', () => {
      for (let row = 0; row < bays + 2; row++)
        for (let col = 0; col < 4; col++)
          q.box(
            -r.half + (r.half * (col + 0.5)) / 2,
            r.top - 0.015,
            r.back + (depth * (row + 0.5)) / (bays + 2),
            r.half / 2 - 0.045,
            0.015,
            depth / (bays + 2) - 0.045,
            0,
          );
    });
  } else {
    // A dark acoustic raft and timber slats belong to the computer studio.
    q.material('acoustic', () => q.box(0, r.top - 0.06, mid, r.half * 1.3, 0.06, depth - 1, 0.02));
    q.material('frame', () => {
      for (let i = 0; i < 9 + r.variant * 2; i++)
        q.box((i - (8 + r.variant * 2) / 2) * 0.38, r.top - 0.1, mid, 0.075, 0.04, depth - 1, 0.005);
    });
  }
  return { label: `${t} ceiling`, side: 'ceiling', interactive: false, model: finish(q) };
}
