import type { ChipNet } from './chip-types';
import type { Box, Pt } from './sketch';

export const BOARD_VIA_RADIUS = 0.006;
export const BOARD_CONTACT_GAP = 0.000001;
export const BOARD_OBSTACLE_MARGIN = BOARD_VIA_RADIUS * 2 + 0.001;
const EPS = 1e-8;

export function segmentBoxHit(a: Pt, b: Pt, r: Box): boolean {
  return Math.abs(a[0] - b[0]) < EPS
    ? a[0] > r[0] + EPS && a[0] < r[2] - EPS && Math.max(a[1], b[1]) > r[1] + EPS && Math.min(a[1], b[1]) < r[3] - EPS
    : a[1] > r[1] + EPS && a[1] < r[3] - EPS && Math.max(a[0], b[0]) > r[0] + EPS && Math.min(a[0], b[0]) < r[2] - EPS;
}

function pointSegmentSquared(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) : 0;
  return (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2;
}

export function reservedRunConflict(a: Pt, b: Pt, contacts: Pt[]): boolean {
  return contacts.some((p) => pointSegmentSquared(p, a, b) < (BOARD_VIA_RADIUS + BOARD_CONTACT_GAP) ** 2);
}
export function reservedViaConflict(p: Pt, contacts: Pt[]): boolean {
  return contacts.some((q) => pointSegmentSquared(p, q, q) < (BOARD_VIA_RADIUS * 2 + BOARD_CONTACT_GAP) ** 2);
}
const square = (p: Pt, r: number): Box => [p[0] - r, p[1] - r, p[0] + r, p[1] + r];
const ends = (net: ChipNet): Pt[] =>
  net.points.length ? [net.points[0], net.points[net.points.length - 1]].filter((p): p is Pt => p !== undefined) : [];
const boxDistanceSquared = (p: Pt, b: Box): number =>
  Math.max(b[0] - p[0], 0, p[0] - b[2]) ** 2 + Math.max(b[1] - p[1], 0, p[1] - b[3]) ** 2;

/** H/V crossings are different copper layers. Collinear overlap is a short. A
 * temporary grid vertex at an H/V crossing does not itself create a contact. */
export function parallelConflict(a: Pt, b: Pt, net: ChipNet): boolean {
  const horizontal = Math.abs(a[1] - b[1]) < EPS;
  for (let i = 1; i < net.points.length; i++) {
    const p = net.points[i - 1],
      q = net.points[i];
    if (!p || !q || horizontal !== Math.abs(p[1] - q[1]) < EPS) continue;
    const axis = horizontal ? 0 : 1,
      cross = horizontal ? 1 : 0;
    if (
      Math.abs(a[cross] - p[cross]) < EPS &&
      Math.min(Math.max(a[axis], b[axis]), Math.max(p[axis], q[axis])) >
        Math.max(Math.min(a[axis], b[axis]), Math.min(p[axis], q[axis])) + EPS
    )
      return true;
  }
  return false;
}

/** Existing contacts occupy area even when the candidate wire continues straight. */
export function runContactConflict(a: Pt, b: Pt, net: ChipNet): boolean {
  const reach = BOARD_VIA_RADIUS + BOARD_CONTACT_GAP;
  if (net.vias.some((p) => pointSegmentSquared(p, a, b) < reach * reach)) return true;
  return ends(net).some((p) => segmentBoxHit(a, b, square(p, reach)));
}

/** Only real corners after simplification need a new plated annulus. */
export function viaConflict(p: Pt, net: ChipNet): boolean {
  const radius = BOARD_VIA_RADIUS,
    gap = BOARD_CONTACT_GAP;
  if (net.vias.some((q) => pointSegmentSquared(p, q, q) < (2 * radius + gap) ** 2)) return true;
  if (ends(net).some((q) => boxDistanceSquared(p, square(q, radius)) < (radius + gap) ** 2)) return true;
  for (let i = 1; i < net.points.length; i++) {
    const a = net.points[i - 1],
      b = net.points[i];
    if (a && b && pointSegmentSquared(p, a, b) < (radius + gap) ** 2) return true;
  }
  return false;
}

/** Boundary terminals are square pads, distinct from the circular bend contacts. */
export function terminalConflict(p: Pt, net: ChipNet): boolean {
  const radius = BOARD_VIA_RADIUS,
    gap = BOARD_CONTACT_GAP,
    box = square(p, radius + gap);
  if (net.vias.some((q) => boxDistanceSquared(q, box) < radius ** 2)) return true;
  if (ends(net).some((q) => Math.abs(p[0] - q[0]) < 2 * radius + gap && Math.abs(p[1] - q[1]) < 2 * radius + gap))
    return true;
  for (let i = 1; i < net.points.length; i++) {
    const a = net.points[i - 1],
      b = net.points[i];
    if (a && b && segmentBoxHit(a, b, box)) return true;
  }
  return false;
}
