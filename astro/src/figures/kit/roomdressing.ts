import { finish, TableDraft, type PropModel } from './tableparts';
import { roomPlan } from './roomplan';
import { chair, planter, cart, floorLamp } from './roomfurniture';
import { framed } from './roomdecor';
import { utilityStorage, pedalBin } from './roomutility';
import type { RoomPart } from './tableroom';
import type { TableScene } from './tabletop';

export function roomDressing(p: TableScene): RoomPart[] {
  const r = roomPlan(p),
    parts: RoomPart[] = [],
    t = p.theme;
  const add = (label: string, x: number, y: number, z: number, build: (q: TableDraft) => void, turn = 0): void => {
    const q = new TableDraft();
    build(q);
    const model = finish(q);
    const points = model.surfaces.map((s) => ({
      ...s,
      points: s.points.map(
        (v) =>
          [
            x + v[0] * Math.cos(turn) + v[2] * Math.sin(turn),
            y + v[1],
            z - v[0] * Math.sin(turn) + v[2] * Math.cos(turn),
          ] as const,
      ),
    }));
    const transformed: PropModel = { ...model, surfaces: points };
    const all = points.flatMap((s) => s.points);
    transformed.bounds = {
      lo: [Math.min(...all.map((v) => v[0])), Math.min(...all.map((v) => v[1])), Math.min(...all.map((v) => v[2]))],
      hi: [Math.max(...all.map((v) => v[0])), Math.max(...all.map((v) => v[1])), Math.max(...all.map((v) => v[2]))],
    };
    parts.push({
      label,
      side:
        label === 'Faceted ceramic planter' ||
        label === 'Reading floor lamp' ||
        label === 'Entrance planter' ||
        label === 'Secured gas cylinders' ||
        label === 'Stacked supply boxes' ||
        label === 'Pedal waste bin'
          ? 'left'
          : label.includes('trolley')
            ? 'right'
            : 'floor',
      interactive: true,
      mount: 'floor',
      model: transformed,
    });
  };
  const hasRug = ['dining', 'work', 'computer', 'study', 'bar'].includes(t.id);
  const seats = t.id === 'dining' || t.id === 'bar' ? [-2.2, 0, 2.2] : [p.roomVariant === 1 ? -0.4 : 0.4];
  for (const [i, x] of seats.entries())
    add(
      t.id === 'bar' ? 'Footrest bar stool' : t.id === 'computer' ? 'Ergonomic desk chair' : 'Table chair',
      x,
      r.floor + (hasRug ? 0.012 : 0),
      t.d / 2 + 1.0,
      (q) => chair(q, t.id),
      (p.roomVariant - 1) * (i % 2 ? -0.08 : 0.08),
    );
  if (t.id === 'lab' || t.id === 'storage')
    add(t.id === 'lab' ? 'Secured gas cylinders' : 'Stacked supply boxes', -r.half + 0.8, r.floor, t.d / 2 + 0.7, (q) =>
      utilityStorage(q, t.id, r.variant),
    );
  else add('Faceted ceramic planter', -r.half + 0.8, r.floor, t.d / 2 + 0.7, (q) => planter(q, r.variant));
  add(
    t.id === 'lab' ? 'Instrument trolley' : t.id === 'bar' ? 'Drinks trolley' : 'Supply trolley',
    r.half - 0.8,
    r.floor,
    t.d / 2 + 1.05,
    (q) => cart(q, t.id, r.variant),
  );
  if (!['lab', 'storage', 'kitchen'].includes(t.id))
    add('Reading floor lamp', -r.half + 1.1, r.floor, r.front - 1.8, floorLamp);
  else
    add(t.id === 'kitchen' ? 'Entrance planter' : 'Pedal waste bin', -r.half + 0.8, r.floor, r.front - 1.3, (q) =>
      t.id === 'kitchen' ? planter(q, (r.variant + 1) % 3) : pedalBin(q),
    );
  // A thin textile lies below the seats; supports may meet it, unlike solid furniture.
  if (hasRug) {
    add('Woven area rug', 0, r.floor + 0.003, t.d / 2 + 1.45, (q) => {
      q.material('rug', () => q.box(0, 0, 0, t.w * 0.8, 0.009, 2.65, 0.06));
      q.material('stitch', () => {
        for (const z of [-1.17, 1.17]) q.box(0, 0.01, z, t.w * 0.8 - 0.26, 0.005, 0.045, 0.008);
        for (const x of [-1, 1]) q.box(x * (t.w * 0.4 - 0.15), 0.01, 0, 0.045, 0.005, 2.38, 0.008);
        for (let i = 0; i < 22; i++)
          for (const z of [-1.35, 1.35]) q.box((i - 10.5) * t.w * 0.033, 0, z, 0.025, 0.006, 0.07, 0);
      });
    });
  }
  add('Wall clock', -1.9, 2.85, r.back + 0.06, (q) => {
    // Clock geometry stays clear of the existing wall display: mounted on the left return.
    q.material('metal', () => q.tube([0, 0, 0], [0, 0, 0.055], 0.29, 24));
    q.material('panel', () => q.tube([0, 0, 0.056], [0, 0, 0.063], 0.25, 24));
    q.material('inlay', () => {
      q.tube([0, 0, 0.07], [0, 0.16, 0.07], 0.012, 6);
      q.tube([0, 0, 0.072], [0.12, -0.07, 0.072], 0.012, 6);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        q.tube(
          [Math.sin(a) * 0.205, Math.cos(a) * 0.205, 0.07],
          [Math.sin(a) * 0.225, Math.cos(a) * 0.225, 0.07],
          0.008,
          4,
        );
      }
    });
  });
  const clock = parts.pop();
  if (clock) {
    const q = new TableDraft();
    for (const s of clock.model.surfaces)
      q.parts[0]?.surfaces.push({
        ...s,
        points: s.points.map(([x, y, z]) => [-r.half + z - r.back, y, r.front - 3.2 + x + 1.9]),
      });
    parts.push({ ...clock, side: 'left', mount: 'wall', model: finish(q) });
  }
  add('Entrance wall print', 0, 1.25, 0, (q) => {
    framed(q, 0, 0, 1.4, 1.8);
    q.material('panel', () => q.box(0, 0.14, 0.12, 1.1, 1.5, 0.04, 0.01));
    q.material('inlay', () => {
      for (let i = 0; i < 5; i++) q.box(-0.4 + i * 0.2, 0.28, 0.15, 0.1, 0.3 + (i % 3) * 0.36, 0.025, 0.008);
    });
  });
  const print = parts.pop();
  if (print) {
    const q = new TableDraft();
    for (const s of print.model.surfaces)
      q.parts[0]?.surfaces.push({ ...s, points: s.points.map(([x, y, z]) => [r.half - z, y, r.front - 3.6 + x]) });
    parts.push({ ...print, side: 'right', mount: 'wall', model: finish(q) });
  }
  return parts;
}
