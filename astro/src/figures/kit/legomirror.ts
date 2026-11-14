import { mirrorPose } from './legopose.ts';
import { PROFILE, type Dir, type Shape } from './legoswap.ts';

/** Symmetric models: a shape designed on one side and its mirror on the other. Pure. */

/** The same shape on the other side of a model `width` studs wide (mirrored across z): its z
 *  flipped, its z-direction reversed and a wedge's cut side swapped. */
export function mirror(s: Shape, width: number): Shape {
  const flip = (d: Dir): Dir => (d === 'z+' ? 'z-' : d === 'z-' ? 'z+' : d);
  const hand = (h: 'L' | 'R'): 'L' | 'R' => (h === 'L' ? 'R' : 'L');
  switch (s.kind) {
    case 'block':
      return { ...s, z: width - s.z - s.d, root: false };
    case 'ramp': {
      const across = s.dir === 'x+' || s.dir === 'x-' ? s.wid : PROFILE[s.profile].run;
      return { ...s, z: width - s.z - across, dir: flip(s.dir) };
    }
    case 'wedge': {
      const across = s.dir === 'x+' || s.dir === 'x-' ? s.wid : s.len;
      return { ...s, z: width - s.z - across, dir: flip(s.dir), hand: hand(s.hand) };
    }
    case 'part': {
      const dir = s.dir ?? 'x+';
      const across = dir === 'x+' || dir === 'x-' ? s.d : s.w;
      // A quarter tile's round edge faces (+u, +v): mirroring swaps its turn with the neighbour's.
      const q: Record<Dir, Dir> = { 'x+': 'z-', 'z-': 'x+', 'z+': 'x-', 'x-': 'z+' };
      // A bracket's flange and a hinge's knuckle are on one edge (local v): mirroring swaps x+ and x-.
      const v: Record<Dir, Dir> = { 'x+': 'x-', 'x-': 'x+', 'z+': 'z+', 'z-': 'z-' };
      const edged = s.part === 'bracket' || s.part === 'hinge';
      return {
        ...s,
        z: width - s.z - across,
        dir: s.part === 'quarter' ? q[dir] : edged ? v[dir] : flip(dir),
        ...(s.hand ? { hand: hand(s.hand) } : {}),
      };
    }
    case 'round':
      return { ...s, z: width - s.z - s.size };
    case 'technic':
      return { ...s, z: width - s.z - s.rows };
    case 'halo':
      return { ...s, z: width - s.z - s.wid };
    case 'wheel':
      return { ...s, z: width - s.z - s.width };
    case 'axle':
      return { ...s, z: width - s.z - s.len };
    case 'sub':
      return { ...s, id: `${s.id}'`, pose: mirrorPose(s.pose, width), shapes: s.shapes.map((c) => mirror(c, 0)) };
  }
}

/** A shape and its mirror. */
export const both = (s: Shape, width: number): Shape[] => [s, mirror(s, width)];
