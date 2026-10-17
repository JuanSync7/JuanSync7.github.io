/** Cameras for drawing 3D on a 2D canvas. One function puts a world point on screen;
 *  every perspective, isometric and orbit view in the figures goes through it. */

export type Vec3 = readonly [number, number, number];
export type ScreenPoint = [x: number, y: number, depth: number];

export interface Camera {
  /** Turn about the vertical axis, radians. */
  yaw: number;
  /** Elevation, radians. Positive looks down on the scene from above. */
  pitch: number;
  /** Distance for the perspective divide; Infinity gives a parallel (isometric) view. */
  dist: number;
  /** Pixels per world unit. */
  scale: number;
  cx: number;
  cy: number;
}

export function camera(partial: Partial<Camera> & Pick<Camera, 'cx' | 'cy' | 'scale'>): Camera {
  return { yaw: 0, pitch: 0.5, dist: 3.4, ...partial };
}

/** World (x right, y up, z toward the viewer at yaw 0) to screen. The viewer sits `dist`
 *  away along the view axis; the returned depth is larger for nearer points. */
export function project(c: Camera, x: number, y: number, z: number): ScreenPoint {
  const cy = Math.cos(c.yaw);
  const sy = Math.sin(c.yaw);
  const x1 = x * cy - z * sy;
  const z1 = x * sy + z * cy;
  const cp = Math.cos(c.pitch);
  const sp = Math.sin(c.pitch);
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  const k = Number.isFinite(c.dist) ? c.dist / Math.max(0.05, c.dist - z2) : 1;
  return [c.cx + x1 * k * c.scale, c.cy - y2 * k * c.scale, z2];
}

export function projectV(c: Camera, v: Vec3): ScreenPoint {
  return project(c, v[0], v[1], v[2]);
}

/** Classic 2:1 isometric: a parallel camera at 45° yaw, looking down about 30°. */
export function isometric(cx: number, cy: number, scale: number): Camera {
  return { yaw: Math.PI / 4, pitch: 0.6155, dist: Infinity, scale, cx, cy };
}

/** Maps depth into 0 (far) .. 1 (near) for a scene of the given radius, for depth fade. */
export function nearness(depth: number, radius = 1.1): number {
  const k = (depth + radius) / (2 * radius);
  return k < 0 ? 0 : k > 1 ? 1 : k;
}
