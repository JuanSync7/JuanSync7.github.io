import { A, R, type Plan, type Pt } from './sketch';
import { smoothstep } from './motion';

export type PlanAt = (n: number) => Plan;

/** The smallest physical view completes its detail before a fresh journey dissolves in.
 * Absolute level coordinates keep the dissolve continuous when the current index changes. */
export function journeyOpacity(level: number, u: number): number {
  const beginning = Math.floor(level / 6) * 6;
  const opening = smoothstep(beginning - 0.22, beginning - 0.02, u);
  const ending = 1 - smoothstep(beginning + 5.78, beginning + 5.98, u);
  return opening * ending;
}

/** Cubic translation keeps both position and velocity continuous as the selected part
 * becomes the next plan. Scale stays exponential; no large global coordinates accumulate. */
export function diveCamera(level: PlanAt, u: number, width: number, height: number) {
  const n = Math.floor(u);
  const f = u - n;
  const scale = Math.pow(R, f);
  const unit = Math.min(width / (2 * A), height / 2) * 0.92;
  const [before, here, next] = [level(n - 1).w, level(n).w, level(n + 1).w];
  const tangent = (-Math.log(R) * R) / (2 * (R - 1));
  const h01 = f * f * (3 - 2 * f);
  const h10 = f * (f - 1) * (f - 1);
  const h11 = f * f * (f - 1);
  const offset = (axis: 0 | 1): number => {
    const start = tangent * (before[axis] + here[axis]);
    const end = tangent * (here[axis] + next[axis]) - Math.log(R) * R * here[axis];
    return -R * here[axis] * h01 + start * h10 + end * h11;
  };
  const [ox, oy] = [offset(0), offset(1)];
  const toScreen = (depth: number, x: number, y: number): Pt => {
    let [px, py] = [x, y];
    for (let k = depth - 1; k >= 0; k--) {
      const w = level(n + k).w;
      [px, py] = [w[0] + px / R, w[1] + py / R];
    }
    for (let k = depth; k < 0; k++) {
      const w = level(n + k).w;
      [px, py] = [(px - w[0]) * R, (py - w[1]) * R];
    }
    return [width / 2 + (scale * px + ox) * unit, height / 2 + (scale * py + oy) * unit];
  };
  return { n, f, scale, unit, toScreen };
}
