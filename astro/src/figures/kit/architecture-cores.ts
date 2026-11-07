import { inset, within, type Box, type Pt } from './sketch';
import type { CoreFixture, LiftFixture, PlanRoom, StairFixture } from './architecture-plan';

/** Real fixture dimensions; a large core zone gets a lobby, not an enlarged symbol. */
export function makeCoreFixtures(room: PlanRoom, metre: number): CoreFixture[] {
  if (room.use !== 'stair' && room.use !== 'lift') return [];
  const [x0, , x1] = room.bounds;
  const band = room.door.inward;
  const front = room.door.hinge[1];
  if (room.use === 'stair') {
    const cx = (x0 + x1) / 2;
    const nearY = front + band * 1.25 * metre;
    const farY = nearY + band * 3.8 * metre;
    const bounds: Box = [cx - 1.2 * metre, Math.min(nearY, farY), cx + 1.2 * metre, Math.max(nearY, farY)];
    if (!within(bounds, inset(room.bounds, 0.1 * metre))) return [];
    const [lx, rx] = [bounds[0] + 0.525 * metre, bounds[2] - 0.525 * metre];
    const walk: Pt[] = [
      [lx, nearY + band * 0.1 * metre],
      [lx, farY - band * 0.5 * metre],
      [rx, farY - band * 0.5 * metre],
      [rx, nearY + band * 0.1 * metre],
    ];
    const fixture: StairFixture = {
      kind: 'stair',
      bounds,
      nearY,
      farY,
      inward: band,
      treadPitch: 0.28 * metre,
      treadsPerFlight: 10,
      flightWidth: 1.05 * metre,
      landingDepth: metre,
      walk,
    };
    return [fixture];
  }
  const count = Math.min(3, Math.floor(((x1 - x0) / metre - 0.4) / 2.6));
  if (count < 1) return [];
  const width = (count * 2.2 + (count - 1) * 0.4) * metre;
  const start = (x0 + x1 - width) / 2;
  const frontY = front + band * 1.7 * metre;
  const endY = frontY + band * 2.2 * metre;
  const fixtures: LiftFixture[] = [];
  for (let i = 0; i < count; i++) {
    const x = start + i * 2.6 * metre;
    const bounds: Box = [x, Math.min(frontY, endY), x + 2.2 * metre, Math.max(frontY, endY)];
    if (!within(bounds, inset(room.bounds, 0.1 * metre))) continue;
    const cx = x + 1.1 * metre;
    fixtures.push({
      kind: 'lift',
      bounds,
      car: inset(bounds, 0.2 * metre),
      opening: [
        [cx - 0.45 * metre, frontY],
        [cx + 0.45 * metre, frontY],
      ],
      inward: band,
    });
  }
  return fixtures;
}
