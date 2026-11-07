import { chipPad } from './chip-detail';
import type { ChipComponent, ChipPlan, ChipPort, ChipSide } from './chip-types';
import { R, type Box, type Pt, type Sketch } from './sketch';

const point = (p: unknown): p is Pt => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
const box = (b: unknown): b is Box => Array.isArray(b) && b.length === 4 && b.every(Number.isFinite);
const side = (s: unknown): s is ChipSide => s === 'n' || s === 'e' || s === 's' || s === 'w';
function port(p: unknown): p is ChipPort {
  return (
    typeof p === 'object' &&
    p !== null &&
    'id' in p &&
    typeof p.id === 'string' &&
    'point' in p &&
    point(p.point) &&
    'side' in p &&
    side(p.side)
  );
}
function component(c: unknown): c is ChipComponent {
  return (
    typeof c === 'object' &&
    c !== null &&
    'id' in c &&
    typeof c.id === 'string' &&
    'kind' in c &&
    typeof c.kind === 'string' &&
    'box' in c &&
    box(c.box) &&
    'ports' in c &&
    Array.isArray(c.ports) &&
    c.ports.every(port) &&
    'selected' in c &&
    typeof c.selected === 'boolean'
  );
}

/** The package consumes the actual next die's external-pad contract. Its own RNG
 * selects the package pose; it never invents a second die pinout for that pose. */
export function registerChildPads(S: Sketch, plan: ChipPlan): { lead: string; target: string }[] {
  const model = S.nextPlan?.model;
  if (
    typeof model !== 'object' ||
    model === null ||
    !('type' in model) ||
    model.type !== 'chip' ||
    !('components' in model) ||
    !Array.isArray(model.components) ||
    !model.components.every(component)
  )
    throw new Error('Wire-bonded package requires the actual next die plan');
  const pads = model.components.filter((c) => c.kind === 'pad' && !c.parent);
  if (!pads.length || pads.some((c) => !side(c.side)))
    throw new Error('Next die has no complete external-pad side contract');
  const project = ([x, y]: Pt): Pt => [S.w[0] + x / R, S.w[1] + y / R];
  const links: { lead: string; target: string }[] = [];
  plan.childPadMap = [];
  for (const edge of ['n', 'e', 's', 'w'] as const) {
    const axis = edge === 'n' || edge === 's' ? 0 : 1;
    const ordered = pads
      .filter((p) => p.side === edge)
      .sort((a, b) => a.box[axis] + a.box[axis + 2] - b.box[axis] - b.box[axis + 2]);
    for (const [i, child] of ordered.entries()) {
      const id = `die-pad/${child.id}`;
      const lo = project([child.box[0], child.box[1]]),
        hi = project([child.box[2], child.box[3]]);
      const ports = child.ports.map(
        (p): ChipPort => ({ id: `${id}:${p.id.slice(child.id.length + 1)}`, point: project(p.point), side: p.side }),
      );
      plan.components.push({ id, kind: 'pad', box: [...lo, ...hi], ports, selected: false, parent: 'die', side: edge });
      plan.childPadMap.push({ childId: child.id, parentId: id, side: edge });
      const range = edge === 'n' || edge === 's' ? 1.08 : 0.5184;
      const u = ordered.length === 1 ? 0 : -range + (2 * range * i) / (ordered.length - 1);
      const lead = chipPad(plan, `pin${edge}${i}`, edge, u, 0.105);
      const inward = { n: 's', e: 'w', s: 'n', w: 'e' }[edge];
      links.push({ lead: `${lead.id}:${inward}2`, target: `${id}:${edge}2` });
    }
  }
  return links;
}
