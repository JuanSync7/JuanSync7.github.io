import { chipDetails, chipPad } from './chip-detail';
import { chipFrame, chipPart, chipPlan, chipWire, type ChipComponent } from './chip-plan';
import { chipDecoupling, wireDecoupling } from './chip-power';
import { c4Surface, hbmSurface, packageLayers } from './chip-package-surface';
import type { ChipPackagingLayout } from './chip-package-types';
import type { Sketch } from './sketch';

/** CoWoS-inspired top views expose real base-die contacts and a small underside cutaway. */
export function modernPackage(S: Sketch): void {
  const variant = (['single-logic', 'paired-logic', 'chiplet-io'] as const)[S.int(0, 2)] ?? 'single-logic';
  const paired = variant === 'paired-logic';
  S.select([paired ? -0.46 : S.r(-0.04, 0.04), S.r(-0.015, 0.015)], 'die');
  const plan = chipPlan(S, 'package');
  const layout: ChipPackagingLayout = { variant, layers: [], bumpFields: [], stacks: [], fineLinks: [] };
  plan.package = layout;
  chipFrame(S);
  const selected = chipPart(plan, 'die', 'die', S.win, true);
  selected.pinGroups = [
    ['die:n1', 'die:s1'],
    ['die:n3', 'die:s3'],
  ];
  const logic: ChipComponent[] = [selected];
  if (paired) logic.push(chipPart(plan, 'companion', 'die', [0.15, -0.25, 0.99, 0.25]));
  if (variant === 'chiplet-io') {
    chipPart(plan, 'ioN', 'phy', [-0.52, -0.49, 0.52, -0.34]);
    chipPart(plan, 'ioS', 'phy', [-0.52, 0.34, 0.52, 0.49]);
  }
  const pairs = variant === 'chiplet-io' ? 2 : S.int(1, 2);
  const hbms: { c: ChipComponent; left: boolean; stack: number }[] = [];
  for (let stack = 0; stack < pairs; stack++)
    for (const left of [true, false]) {
      const x = paired ? (left ? -1.34 : 1.34) : left ? -1.1 : 1.1;
      const h = pairs === 1 ? 0.72 : 0.32;
      const y = pairs === 1 ? -0.36 : stack ? 0.06 : -0.38;
      const c = chipPart(plan, `hbm${left ? 'L' : 'R'}${stack}`, 'hbm', [x - 0.2, y, x + 0.2, y + h]);
      hbms.push({ c, left, stack });
    }
  const banks = plan.lanes === 8 ? 16 : 12;
  chipDecoupling(plan, 'upper', [-1.35, -0.72, 1.35, -0.55], banks);
  chipDecoupling(plan, 'lower', [-1.35, 0.55, 1.35, 0.72], banks);
  for (const side of ['w', 'e'] as const)
    for (const [id, y] of [
      ['upper', -0.6],
      ['lower', 0.6],
    ] as const)
      chipPad(plan, `${id}-${side === 'w' ? 'vdd' : 'vss'}-pin`, side, y, 0.07);
  chipPad(plan, 'host-in', 'w', 0, 0.07);
  chipPad(plan, 'host-out', 'e', 0, 0.07);
  packageLayers(S, layout, [...logic, ...hbms.map((h) => h.c), ...plan.components.filter((c) => c.kind === 'phy')]);
  c4Surface(S, plan, layout);
  for (const id of ['upper', 'lower']) {
    const side = id === 'upper' ? 'n' : 's';
    wireDecoupling(S, plan, id, banks);
    chipWire(S, plan, `${id}-vdd-pin:e2`, `${id}-vdd:w2`, 2);
    chipWire(S, plan, `${id}-vss-pin:w2`, `${id}-vss:e2`, 2);
    chipWire(S, plan, `${id}-vdd:e2`, `die:${side}1`, 1);
    chipWire(S, plan, `${id}-vss:w2`, `die:${side}3`, 1);
  }
  if (paired) {
    chipWire(S, plan, 'upper-vdd:e2', 'companion:n1', 1);
    chipWire(S, plan, 'upper-vss:w2', 'companion:n3', 1);
  }
  const dieCount = [4, 8, 12][S.int(0, 2)] ?? 8;
  for (const { c, left } of hbms) {
    hbmSurface(S, layout, c, left, dieCount);
  }
  for (const { c, stack } of hbms) {
    const bank = stack ? 'lower' : 'upper';
    chipWire(S, plan, `${bank}-vdd:e2`, `${c.id}:vdd`, 1);
    chipWire(S, plan, `${bank}-vss:w2`, `${c.id}:vss`, 1);
  }
  for (const { c, left, stack } of hbms) {
    const target = paired && !left ? (logic[1] ?? selected) : selected;
    for (let lane = 0; lane < 4; lane++) {
      const y = target.box[1] + ((stack * 4 + lane + 0.5) * (target.box[3] - target.box[1])) / (pairs * 4);
      const side = left ? 'w' : 'e';
      const id = `${target.id}:${side}-${stack}-${lane}`;
      target.ports.push({ id, point: [left ? target.box[0] : target.box[2], y], side });
      chipWire(S, plan, `${c.id}:data${lane}`, id, 2);
    }
  }
  chipWire(S, plan, 'host-in:e2', variant === 'chiplet-io' ? 'ioN:w2' : 'die:n2', 2);
  chipWire(S, plan, 'host-out:w2', variant === 'chiplet-io' ? 'ioS:e2' : paired ? 'companion:s2' : 'die:s2', 2);
  if (paired) for (let lane = 1; lane <= 3; lane++) chipWire(S, plan, `die:e${lane}`, `companion:w${lane}`, 2);
  if (variant === 'chiplet-io') {
    chipWire(S, plan, 'die:n2', 'ioN:s2', 2);
    chipWire(S, plan, 'die:s2', 'ioS:n2', 2);
  }
  chipDetails(S, {
    ...plan,
    components: plan.components
      .filter((c) => c.kind !== 'hbm' && c.kind !== 'c4-cutaway')
      .map((c) => (c.kind === 'die' && !c.selected ? { ...c, kind: 'core' } : c)),
  });
}
