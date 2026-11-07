import type { Room } from './furniture';
import { makeCoreFixtures } from './architecture-cores';
import { inset, R, type Box, type Pt, type Sketch } from './sketch';

/** A metre of furniture stays the same size through the four-times wing inspection. */
export const ARCHITECTURE_UNITS = { floor: 0.095, building: 0.095 / R } as const;

/** The drawing is generated from this circulation plan, never the other way round. */
export interface PlanDoor {
  hinge: Pt;
  opening: [Pt, Pt];
  inward: -1 | 1;
  width: number;
  leaves: 1 | 2;
  clearance: Box;
}

export interface PlanRoom {
  id: string;
  bounds: Box;
  use: Room | 'lift';
  door: PlanDoor;
  selected: boolean;
  window: [number, number];
  furniture: Box[];
  decorations: Box[];
  coreFixtures: CoreFixture[];
}

export interface StairFixture {
  kind: 'stair';
  bounds: Box;
  nearY: number;
  farY: number;
  inward: -1 | 1;
  treadPitch: number;
  treadsPerFlight: number;
  flightWidth: number;
  landingDepth: number;
  walk: Pt[];
}

export interface LiftFixture {
  kind: 'lift';
  bounds: Box;
  car: Box;
  opening: [Pt, Pt];
  inward: -1 | 1;
}

export type CoreFixture = StairFixture | LiftFixture;

export interface ArchitecturePlan {
  kind: 'architecture';
  scale: 'building' | 'floor';
  programme: 'home' | 'workplace';
  shell: Box;
  corridor: Box;
  rooms: PlanRoom[];
  entrances: [Pt, Pt][];
  wall: number;
  shellWall: number;
  entranceLeaves: 1 | 2;
  unitsPerMeter: number;
}

/** Divide a frontage into viable bays; the selected bay is exactly the portal's size. */
export function frontage(S: Sketch, x0: number, x1: number, target = 0.58): [number, number][] {
  if (x1 - x0 < 0.05) return [];
  const n = Math.max(1, Math.round((x1 - x0) / target));
  const weights = Array.from({ length: n }, () => S.r(0.85, 1.15));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let x = x0;
  return weights.map((w, i) => {
    const end = i === n - 1 ? x1 : x + ((x1 - x0) * w) / total;
    const bay: [number, number] = [x, end];
    x = end;
    return bay;
  });
}

function supportFrontage(S: Sketch, inside: Box, home: boolean, scale: ArchitecturePlan['scale']): [number, number][] {
  const widths =
    scale === 'building' ? [0.45, 0.32, 0.45, 0.55] : home ? [0.38, 0.3, 0.65, 0.3] : [0.42, 0.38, 0.38, 0.55];
  const out: [number, number][] = [];
  let x = inside[0];
  for (const width of widths) {
    const end = x + width * S.r(0.94, 1.06);
    out.push([x, end]);
    x = end;
  }
  return [...out, ...frontage(S, x, inside[2], scale === 'building' ? 0.6 : 0.58)];
}

export function makeArchitecturePlan(S: Sketch, scale: 'building' | 'floor'): ArchitecturePlan {
  const home = scale === 'floor' && S.chance(0.6);
  const side = S.chance(0.5) ? -1 : 1;
  const sx = S.r(-0.7, 0.7);
  const unitsPerMeter = ARCHITECTURE_UNITS[scale];
  const detailScale = unitsPerMeter / ARCHITECTURE_UNITS.floor;
  const shellWall = 0.025 * detailScale;
  const hall = home ? S.r(0.065, 0.085) : S.r(0.085, 0.115);
  S.select([sx, side * (hall + 0.25)], scale === 'building' ? 'wing' : 'room');
  const shell: Box = [-1.8, -hall - 0.5 - shellWall, 1.8, hall + 0.5 + shellWall];
  const inside = inset(shell, shellWall);
  const corridor: Box = [inside[0], -hall, inside[2], hall];
  const rooms: PlanRoom[] = [];
  const wetSide = -side;
  for (const band of [-1, 1] as const) {
    const selectedBand = side === band;
    const bays = selectedBand
      ? [
          ...frontage(S, inside[0], sx - 0.5),
          [sx - 0.5, sx + 0.5] as [number, number],
          ...frontage(S, sx + 0.5, inside[2]),
        ]
      : supportFrontage(S, inside, home, scale);
    for (let i = 0; i < bays.length; i++) {
      const bay = bays[i];
      if (!bay) continue;
      const [x0, x1] = bay;
      const selected = selectedBand && Math.abs(x0 - S.win[0]) < 1e-6;
      const bounds: Box = [x0, band < 0 ? -hall - 0.5 : hall, x1, band < 0 ? -hall : hall + 0.5];
      const leaves = scale === 'building' ? 2 : 1;
      const width = 0.1 * detailScale * leaves;
      const dx = x0 + 0.055 * detailScale;
      const dy = band < 0 ? bounds[3] : bounds[1];
      const inward = band;
      const clearance: Box = [
        dx - 0.015 * detailScale,
        Math.min(dy, dy + inward * (width / leaves + 0.035 * detailScale)),
        dx + width + 0.02 * detailScale,
        Math.max(dy, dy + inward * (width / leaves + 0.035 * detailScale)),
      ];
      let use: PlanRoom['use'] = home
        ? ((['bedroom', 'study', 'bedroom', 'dining'] as const)[i % 4] ?? 'bedroom')
        : 'office';
      if (selected) use = home ? 'living' : 'meeting';
      else if (band === wetSide && i === 0) use = 'stair';
      else if (band === wetSide && i === 1) use = scale === 'building' ? 'lift' : home ? 'bath' : 'wc';
      else if (band === wetSide && i === 2) use = home ? 'kitchen' : 'wc';
      else if (band === wetSide && i === 3) use = home ? 'bath' : 'kitchen';
      else if (scale === 'building' && i === bays.length - 1) use = 'stair';
      else if (!home && i % 3 === 1) use = 'meeting';
      const w = x1 - x0;
      const room: PlanRoom = {
        id: `${band < 0 ? 'north' : 'south'}-${i}`,
        bounds,
        use,
        selected,
        door: {
          hinge: [dx, dy],
          opening: [
            [dx, dy],
            [dx + width, dy],
          ],
          inward,
          width,
          leaves,
          clearance,
        },
        window: [x0 + w * 0.25, x0 + w * 0.75],
        furniture: [],
        decorations: [],
        coreFixtures: [],
      };
      room.coreFixtures = makeCoreFixtures(room, unitsPerMeter);
      rooms.push(room);
    }
  }
  return {
    kind: 'architecture',
    scale,
    programme: home ? 'home' : 'workplace',
    shell,
    corridor,
    rooms,
    entrances: [
      [
        [-1.8, -(0.9 * unitsPerMeter * (scale === 'building' ? 2 : 1)) / 2],
        [-1.8, (0.9 * unitsPerMeter * (scale === 'building' ? 2 : 1)) / 2],
      ],
      [
        [1.8, -(0.9 * unitsPerMeter * (scale === 'building' ? 2 : 1)) / 2],
        [1.8, (0.9 * unitsPerMeter * (scale === 'building' ? 2 : 1)) / 2],
      ],
    ],
    wall: 0.018 * detailScale,
    shellWall,
    entranceLeaves: scale === 'building' ? 2 : 1,
    unitsPerMeter,
  };
}
