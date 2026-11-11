import { chipDetails, chipPad } from './chip-detail';
import { chipFrame, chipPart, chipPlan, chipWire, type ChipComponent } from './chip-plan';
import { Sketch, type Pt } from './sketch';
import type { ChipDieLayout } from './chip-package-types';

/** Floorplans change macro topology, while every core in a column shares one recipe. */
export function modernDie(S: Sketch): void {
  const variants = ['six-core', 'four-core', 'paired-columns'] as const;
  const variant = variants[S.int(0, 2)] ?? 'six-core';
  const xs = variant === 'four-core' ? [-0.55, 0.55] : [-1.06, 0, 1.06];
  const selectedColumn = variant === 'paired-columns' ? S.int(0, 1) * 2 : S.int(0, xs.length - 1);
  const selectedRow = S.int(0, 1);
  S.select([xs[selectedColumn] ?? 0, selectedRow ? 0.28 : -0.28], 'core');
  const plan = chipPlan(S, 'die');
  const matrix: ChipComponent[][] = [[], []];
  const layout: ChipDieLayout = { variant, coreIds: [], selectedId: `core${selectedRow}${selectedColumn}`, groups: [] };
  plan.dieLayout = layout;
  chipFrame(S);
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i] ?? 0;
    const cache = variant === 'paired-columns' && i === 1;
    const ids: string[] = [];
    for (let row = 0; row < 2; row++) {
      const y = row ? 0.28 : -0.28;
      const id = cache ? `llc${row ? 'S' : 'N'}` : `core${row}${i}`;
      const c = chipPart(
        plan,
        id,
        cache ? 'cache' : 'core',
        [x - (cache ? 0.48 : 0.5), y - (cache ? 0.23 : 0.25), x + (cache ? 0.48 : 0.5), y + (cache ? 0.23 : 0.25)],
        id === layout.selectedId,
      );
      matrix[row]?.push(c);
      if (!cache) {
        ids.push(id);
        layout.coreIds.push(id);
      }
    }
    if (!cache)
      layout.groups.push({ ids, pitch: [xs.length === 2 ? 1.1 : 1.06, 0.56], tile: [1, 0.5], mirrorX: x < 0 });
    for (const side of ['n', 's'] as const) {
      const y = side === 'n' ? -0.67 : 0.59;
      chipPart(plan, `phy${side}${i}`, 'phy', [x - 0.44, y, x + 0.44, y + 0.08]);
      for (let pin = 1; pin <= 3; pin++) chipPad(plan, `io${side}${i}${pin}`, side, x + (pin - 2) * 0.22, 0.07);
    }
  }
  if (variant === 'four-core')
    for (const side of ['L', 'R']) {
      const x = side === 'L' ? -1.35 : 1.35;
      chipPart(plan, `llc${side}`, 'cache', [x - 0.18, -0.53, x + 0.18, 0.53]);
    }
  for (const side of ['w', 'e'] as const)
    for (let i = 0; i < 3; i++) chipPad(plan, `io${side}${i}`, side, -0.42 + i * 0.42, 0.07);
  for (let row = 0; row < 2; row++) {
    const side = row ? 's' : 'n';
    const parts = matrix[row] ?? [];
    for (let i = 0; i < parts.length; i++) {
      const c = parts[i];
      if (!c) continue;
      const next = parts[i + 1];
      if (next) chipWire(S, plan, `${c.id}:e2`, `${next.id}:w2`, 2);
      chipWire(S, plan, `${c.id}:${side}2`, `phy${side}${i}:${row ? 'n' : 's'}2`, 2);
      for (let pin = 1; pin <= 3; pin++)
        chipWire(S, plan, `phy${side}${i}:${side}${pin}`, `io${side}${i}${pin}:${row ? 'n' : 's'}2`, 2);
      if (!row) chipWire(S, plan, `${c.id}:s2`, `${matrix[1]?.[i]?.id}:n2`, 2);
    }
  }
  for (const side of ['w', 'e'] as const) {
    const index = side === 'w' ? 0 : xs.length - 1;
    const cache = variant === 'four-core' ? `llc${side === 'w' ? 'L' : 'R'}` : undefined;
    for (let i = 0; i < 3; i++) {
      const row = i ? 1 : 0;
      chipWire(
        S,
        plan,
        `io${side}${i}:${side === 'w' ? 'e' : 'w'}2`,
        `${cache ?? matrix[row]?.[index]?.id}:${side}${i === 2 ? 3 : 1}`,
        2,
      );
    }
    if (cache)
      for (let row = 0; row < 2; row++)
        chipWire(
          S,
          plan,
          `${cache}:${side === 'w' ? 'e' : 'w'}${row ? 3 : 1}`,
          `${matrix[row]?.[index]?.id}:${side}2`,
          2,
        );
  }
  chipDetails(S, { ...plan, components: plan.components.filter((c) => c.kind !== 'core') });
  for (const group of layout.groups)
    for (const id of group.ids) {
      const c = plan.components.find((part) => part.id === id);
      if (!c || c.selected) continue;
      const center = (c.box[0] + c.box[2]) / 2;
      const reflect = ([x, y]: Pt): Pt => [2 * center - x, y];
      const temp = new Sketch(S.rng, [...S.w]);
      const ports = group.mirrorX
        ? c.ports.map((p) => ({
            ...p,
            point: reflect(p.point),
            side: p.side === 'e' ? ('w' as const) : p.side === 'w' ? ('e' as const) : p.side,
          }))
        : c.ports;
      chipDetails(temp, { ...plan, components: [{ ...c, ports }] });
      for (const tone of [0, 1, 2] as const)
        for (const [x0, y0, x1, y1] of temp.segs[tone])
          S.seg(group.mirrorX ? 2 * center - x0 : x0, y0, group.mirrorX ? 2 * center - x1 : x1, y1, tone);
      for (const point of temp.dots) S.dots.push(group.mirrorX ? reflect(point) : point);
    }
}
