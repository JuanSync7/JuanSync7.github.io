import { chipPart, chipWire, type ChipPlan, type ChipPort } from './chip-plan';
import type { Box, Sketch } from './sketch';

/** A bank is two actual conductors with parallel capacitors between them. Each part has
 * separate power/return terminals; the drawing never substitutes an unconnected row of
 * rectangles for decoupling. Add it before routing the surrounding architecture. */
export function chipDecoupling(plan: ChipPlan, id: string, box: Box, count: number): void {
  const rail = 0.012;
  const [top, bottom] = [
    chipPart(plan, `${id}-vdd`, 'power-rail', [box[0], box[1], box[2], box[1] + rail]),
    chipPart(plan, `${id}-vss`, 'power-rail', [box[0], box[3] - rail, box[2], box[3]]),
  ];
  const pitch = (box[2] - box[0]) / count;
  const w = Math.min(0.042, pitch * 0.45);
  const h = Math.min(0.064, (box[3] - box[1] - rail * 2) * 0.5);
  const cy = (box[1] + box[3]) / 2;
  for (let i = 0; i < count; i++) {
    const x = box[0] + (i + 0.5) * pitch;
    chipPart(plan, `${id}-cap${i}`, 'decap', [x - w / 2, cy - h / 2, x + w / 2, cy + h / 2]);
    const contacts: [ChipPort, ChipPort] = [
      { id: `${top.id}:tap${i}`, point: [x, top.box[3]], side: 's' },
      { id: `${bottom.id}:tap${i}`, point: [x, bottom.box[1]], side: 'n' },
    ];
    top.ports.push(contacts[0]);
    bottom.ports.push(contacts[1]);
  }
}

export function wireDecoupling(S: Sketch, plan: ChipPlan, id: string, count: number): void {
  for (let i = 0; i < count; i++) {
    chipWire(S, plan, `${id}-cap${i}:n2`, `${id}-vdd:tap${i}`, 2);
    chipWire(S, plan, `${id}-cap${i}:s2`, `${id}-vss:tap${i}`, 2);
  }
}
