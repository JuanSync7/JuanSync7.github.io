import { roomPlan } from './roomplan';
import { placedRoomPart } from './roomcompose';
import { planter, cart, floorLamp } from './roomfurniture';
import { chair } from './roomseats';
import { utilityStorage, pedalBin } from './roomutility';
import { areaRug } from './roomrugs';
import { roomZones } from './roomzones';
import { roomCeiling } from './roomceiling';
import { roomWallArt } from './roomwallart';
import { tabletop, type TableScene } from './tabletop';
import type { RoomPart } from './tableroom';

export function roomDressing(p: TableScene): RoomPart[] {
  const r = roomPlan(p),
    t = p.theme.id,
    b = tabletop(p).bounds,
    parts: RoomPart[] = [];
  const textile = !['messy'].includes(t);
  const seats =
    t === 'dining' || t === 'bar'
      ? [-(b.hi[0] - b.lo[0]) * 0.26, 0, (b.hi[0] - b.lo[0]) * 0.26]
      : [r.variant === 1 ? -0.25 : 0.25];
  const name =
    t === 'bar'
      ? 'Leather footrest bar stool'
      : t === 'lab'
        ? 'Adjustable laboratory stool'
        : t === 'computer'
          ? 'High-back ergonomic chair'
          : t === 'kitchen'
            ? 'Kitchen counter stool'
            : t === 'storage'
              ? 'Packing stool'
              : t === 'dining'
                ? 'Upholstered dining chair'
                : t === 'study'
                  ? 'Timber study chair'
                  : 'Swivel task chair';
  for (const x of seats)
    parts.push({
      ...placedRoomPart(name, 'floor', 'floor', (q) => chair(q, t, r.variant), {
        x,
        y: r.floor + (textile ? 0.022 : 0),
        z: b.hi[2] + 0.76,
        turn: (r.variant - 1) * 0.07,
      }),
      seat: true,
    });
  if (t === 'dining')
    for (const x of seats)
      parts.push({
        ...placedRoomPart(name, 'floor', 'floor', (q) => chair(q, t, r.variant), {
          x,
          y: r.floor + 0.022,
          z: b.lo[2] - 0.76,
          turn: Math.PI,
        }),
        seat: true,
      });
  if (textile) {
    const dining = t === 'dining',
      utility = ['lab', 'storage', 'kitchen'].includes(t);
    const width = dining ? b.hi[0] - b.lo[0] + 1.2 : utility ? 2.8 : Math.min(6.2, b.hi[0] - b.lo[0] + 0.15);
    const depth = dining ? b.hi[2] - b.lo[2] + 2.85 : utility ? 1.75 : 2.3;
    parts.push(
      placedRoomPart(
        utility ? 'Ribbed utility mat' : 'Woven area rug',
        'floor',
        'floor',
        (q) => areaRug(q, width, depth, t, r.variant),
        { x: 0, y: r.floor + 0.002, z: dining ? 0 : b.hi[2] + (utility ? 0.85 : 1.15) },
        true,
      ),
    );
  }
  if (['work', 'computer', 'study', 'bar'].includes(t))
    parts.push(
      placedRoomPart(
        'Lounge area rug',
        'floor',
        'floor',
        (q) => areaRug(q, 3.3, 3.5, t, r.variant),
        { x: -r.half + 1.72, y: r.floor + 0.002, z: r.nookZ },
        true,
      ),
    );
  if (t === 'lab')
    parts.push(
      placedRoomPart('Secured gas cylinders', 'left', 'floor', (q) => utilityStorage(q, t, r.variant), {
        x: -r.half + 0.72,
        y: r.floor,
        z: r.back + 1.8,
      }),
    );
  else if (t === 'storage')
    parts.push(
      placedRoomPart('Stacked supply boxes', 'left', 'floor', (q) => utilityStorage(q, t, r.variant), {
        x: -r.half + 1.1,
        y: r.floor,
        z: r.back + 1.8,
      }),
    );
  else
    parts.push(
      placedRoomPart('Faceted ceramic planter', 'left', 'floor', (q) => planter(q, r.variant), {
        x: -r.half + 1.4,
        y: r.floor,
        z: r.back + 1.0,
      }),
    );
  parts.push(
    placedRoomPart(
      t === 'lab' ? 'Instrument trolley' : t === 'bar' ? 'Drinks trolley' : 'Supply trolley',
      'right',
      'floor',
      (q) => cart(q, t, r.variant),
      { x: r.half - 0.65, y: r.floor, z: r.front - 3.1 },
    ),
  );
  if (!['lab', 'storage', 'kitchen', 'messy'].includes(t))
    parts.push(
      placedRoomPart('Reading floor lamp', 'left', 'floor', floorLamp, {
        x: -r.half + 0.65,
        y: r.floor,
        z: r.lampZ,
      }),
    );
  else
    parts.push(
      placedRoomPart('Pedal waste bin', 'left', 'floor', pedalBin, { x: -r.half + 0.65, y: r.floor, z: r.lampZ }),
    );
  return [...parts, ...roomZones(p), ...roomCeiling(p), ...roomWallArt(p)];
}
