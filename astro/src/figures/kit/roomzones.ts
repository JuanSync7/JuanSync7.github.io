import { roomPlan } from './roomplan';
import { placedRoomPart } from './roomcompose';
import { loungeSeat, sideTable, sideboard } from './roomlounge';
import { tallCabinet, filingCabinet } from './roomstorage';
import { sinkCounter, refrigerator, rangeHood } from './roomkitchen';
import { craftBench, pegTools } from './roomworkshop';
import type { TableScene } from './tabletop';
import type { RoomPart } from './tableroom';

/** Functional secondary zones leave the central entrance and door approach open. */
export function roomZones(p: TableScene): RoomPart[] {
  const r = roomPlan(p),
    t = p.theme.id,
    v = p.furnitureVariant,
    parts: RoomPart[] = [];
  const lounge = ['work', 'computer', 'study', 'bar'].includes(t);
  const left = {
    x: -r.half + 0.84,
    y: r.floor + (lounge ? 0.022 : 0),
    z: lounge ? r.nookZ : r.serviceZ,
    turn: Math.PI / 2,
  };
  const right = { x: r.half - 1.0, y: r.floor, z: r.back + 0.85, turn: 0 };
  if (t === 'kitchen' || t === 'lab') {
    parts.push(
      placedRoomPart(
        t === 'lab' ? 'Stainless wash-up station' : 'Sink and preparation run',
        'left',
        'floor',
        (q) => sinkCounter(q, t === 'lab'),
        left,
      ),
    );
    if (t === 'kitchen') {
      parts.push(placedRoomPart('Refrigerator with freezer', 'right', 'floor', refrigerator, right));
      parts.push(
        placedRoomPart('Extractor hood and task lights', 'left', 'wall', rangeHood, {
          x: -r.half + 0.3,
          y: r.floor + 3.7,
          z: r.cookZ,
          turn: Math.PI / 2,
        }),
      );
    } else
      parts.push(placedRoomPart('Ventilated chemical cabinet', 'right', 'floor', (q) => tallCabinet(q, t, v), right));
  } else if (t === 'storage') {
    parts.push(placedRoomPart('Steel supply shelving', 'left', 'floor', (q) => tallCabinet(q, t, v), left));
    parts.push(placedRoomPart('Labelled filing drawers', 'right', 'floor', (q) => filingCabinet(q, v), right));
  } else if (t === 'messy') {
    parts.push(placedRoomPart('Craft bench with vice and supplies', 'left', 'floor', craftBench, left));
    parts.push(
      placedRoomPart('Tool pegboard', 'left', 'wall', pegTools, {
        x: -r.half + 0.04,
        y: r.floor + 3.5,
        z: r.serviceZ,
        turn: Math.PI / 2,
      }),
    );
    parts.push(placedRoomPart('Workshop parts cabinet', 'right', 'floor', (q) => tallCabinet(q, t, v), right));
  } else if (t === 'dining') {
    parts.push(placedRoomPart('Serving sideboard', 'left', 'floor', (q) => sideboard(q, t, v), left));
    parts.push(placedRoomPart('China display cabinet', 'right', 'floor', (q) => tallCabinet(q, t, v), right));
  } else {
    const sofa = t === 'computer' || t === 'bar';
    parts.push(
      placedRoomPart(
        t === 'study'
          ? 'Wingback reading chair'
          : t === 'bar'
            ? 'Velvet lounge booth'
            : sofa
              ? 'Media lounge sofa'
              : 'Visitor armchair',
        'left',
        'floor',
        (q) => loungeSeat(q, t, sofa, v),
        left,
      ),
    );
    parts.push(
      placedRoomPart(
        t === 'bar' ? 'Cocktail side table' : 'Reading side table',
        'floor',
        'floor',
        (q) => sideTable(q, t, v),
        { x: -r.half + 2.55, y: r.floor + 0.022, z: r.nookZ },
      ),
    );
    parts.push(
      placedRoomPart(
        t === 'study' ? 'Library bookcase' : t === 'computer' ? 'Game storage cabinet' : 'Office filing cabinet',
        'right',
        'floor',
        (q) => (t === 'work' ? filingCabinet(q, v) : tallCabinet(q, t, v)),
        right,
      ),
    );
  }
  return parts;
}
