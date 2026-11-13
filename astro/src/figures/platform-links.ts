import { defineCanvasFigure } from './define';
import { isometric, project, type Camera } from './kit/camera';
import { ink } from './kit/ink';
import { PARTS, lines, part, type V } from './kit/platform';
import { clamp, easeOut } from './kit/motion';

/** A small company platform assembled in hairline isometric: server racks with the software
 *  they run floating above them, a firewall under the cloud uplink, a database, and a desk
 *  with two monitors and a tower. Each part lands and is cabled to what is already there;
 *  then one request travels the cables (the signal) until the platform is taken down and
 *  built again. */

interface State {
  cam: Camera;
  route: { pts: V[]; len: number[]; total: number; names: { at: number; name: string; pts: V[]; i: number }[] };
}

// A request's trip, as (part whose link it rides, forward?): desk to database and back,
// then in from the cloud through the firewall to the workstation.
const TRIP: readonly [number, boolean][] = [
  [7, false],
  [1, true],
  [6, true],
  [6, false],
  [1, false],
  [7, true],
  [5, false],
  [4, true],
  [1, true],
  [8, true],
];
const STEP = 0.7;
const BUILD = PARTS.length * STEP + 0.5;
const RUN = 8;
const APART = PARTS.length * 0.18 + 0.5;
const PERIOD = BUILD + RUN + APART + 0.6;

function walk(st: State['route'], d: number): V {
  let i = 0;
  while (i < st.len.length - 1 && (st.len[i + 1] ?? 0) < d) i++;
  const [a, b] = [st.pts[i], st.pts[i + 1] ?? st.pts[i]];
  if (!a || !b) return [0, 0, 0];
  const u = clamp((d - (st.len[i] ?? 0)) / Math.max(1e-6, (st.len[i + 1] ?? 0) - (st.len[i] ?? 0)), 0, 1);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

export default defineCanvasFigure<State>({
  id: 'platform-links',
  title: 'Platform links',
  alt: 'A small company platform in hairline isometric: two server racks with app windows above them, a firewall under a cloud, a database, and a desk with two monitors and a tower, joined by cables on the floor. The parts land and are cabled one by one, then a single highlighted request travels the cables.',
  idea: 'A platform as connected parts: each machine lands and is cabled to what is there, then one request (the signal) rides the cables from desk to database and in from the cloud.',
  style: 'trace',
  motion: 'ambient',
  answers: false,
  group: 'hero',
  seed: 5209,
  aspect: 1.1,
  setup: ({ w, h }) => {
    const cam = isometric(0, 0, Math.min(w / 15.5, h / 14.6));
    const c = project(cam, 6.2, 2.6, 4.4);
    const pts: V[] = [];
    const names: { at: number; name: string; pts: V[]; i: number }[] = [];
    const len = [0];
    for (const [i, fwd] of TRIP) {
      const p = PARTS[i];
      if (!p) continue;
      names.push({ at: len[len.length - 1] ?? 0, name: p.name, pts: [...p.link], i });
      let fwdStart = true;
      for (const q of fwd ? p.link : [...p.link].reverse()) {
        const last = pts[pts.length - 1];
        // A new trip starts where it starts: no distance across the gap.
        const gap = last && fwdStart ? 0 : last ? Math.hypot(q[0] - last[0], q[1] - last[1], q[2] - last[2]) : 0;
        if (last) len.push((len[len.length - 1] ?? 0) + gap);
        fwdStart = false;
        pts.push(q);
      }
    }
    return {
      cam: { ...cam, cx: w / 2 - c[0], cy: h / 2 - c[1] },
      route: { pts, len, total: len[len.length - 1] ?? 1, names },
    };
  },
  draw: ({ ctx, t, state }) => {
    const { cam, route } = state;
    const ph = (t + BUILD - 2.3) % PERIOD;
    const apart = ph > BUILD + RUN;
    const grow = (i: number) =>
      apart
        ? 1 - clamp((ph - BUILD - RUN - (PARTS.length - 1 - i) * 0.18) / 0.5, 0, 1)
        : clamp((ph - i * STEP) / 0.5, 0, 1);
    const dots: number[][] = [];
    for (let x = 0; x <= 12; x++) for (let z = 0; z <= 9; z++) dots.push([x, 0, z, x + 0.06, 0, z]);
    lines(ctx, cam, dots, 0.3);
    PARTS.forEach((p, i) => {
      const g = easeOut(clamp(grow(i) * 1.6 - 0.6, 0, 1));
      if (g <= 0 || p.link.length < 2) return;
      ctx.beginPath();
      let left =
        g *
        p.link.reduce(
          (s, q, k) =>
            s +
            (k
              ? Math.hypot(
                  q[0] - (p.link[k - 1]?.[0] ?? 0),
                  q[1] - (p.link[k - 1]?.[1] ?? 0),
                  q[2] - (p.link[k - 1]?.[2] ?? 0),
                )
              : 0),
          0,
        );
      p.link.forEach((q, k) => {
        const prev = p.link[k - 1];
        const seg = prev ? Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]) : 0;
        const u = prev ? clamp(left / Math.max(seg, 1e-6), 0, 1) : 0;
        const at = prev
          ? project(cam, prev[0] + (q[0] - prev[0]) * u, prev[1] + (q[1] - prev[1]) * u, prev[2] + (q[2] - prev[2]) * u)
          : project(cam, q[0], q[1], q[2]);
        if (k === 0) ctx.moveTo(at[0], at[1]);
        else if (left > 0) ctx.lineTo(at[0], at[1]);
        left -= seg;
      });
      ctx.strokeStyle = g < 1 && !apart ? ink.signal(0.8) : ink.line(0.6);
      ctx.stroke();
    });
    const run = ph >= BUILD && !apart;
    const d = ((ph - BUILD) / RUN) * route.total;
    const now = run ? [...route.names].reverse().find((n) => n.at <= d) : undefined;
    const order = PARTS.map((p, i) => ({
      p,
      i,
      k: (p.kind === 'cloud' ? 100 : 0) + p.at[0] + p.at[1] + p.at[2] + p.at[3],
    }));
    order.sort((a, b) => a.k - b.k);
    for (const { p, i } of order) {
      const g = grow(i);
      if (g <= 0) continue;
      ctx.globalAlpha = clamp(g * 3, 0, 1);
      part(ctx, cam, p, (1 - easeOut(g)) * 5, now?.i === i);
      ctx.globalAlpha = 1;
    }
    if (ph < BUILD) return `${PARTS[Math.min(PARTS.length - 1, Math.floor(ph / STEP))]?.name ?? ''}`;
    if (apart) return 'down';
    ctx.beginPath();
    (now?.pts ?? []).forEach((q, k) => {
      const s = project(cam, q[0], q[1], q[2]);
      if (k) ctx.lineTo(s[0], s[1]);
      else ctx.moveTo(s[0], s[1]);
    });
    ctx.strokeStyle = ink.signal(0.5);
    ctx.stroke();
    const tail = [0, 0.15, 0.3, 0.45, 0.6].map((k) => walk(route, Math.max(0, d - k)));
    ctx.beginPath();
    tail.forEach((q, k) => {
      const s = project(cam, q[0], q[1], q[2]);
      if (k) ctx.lineTo(s[0], s[1]);
      else ctx.moveTo(s[0], s[1]);
    });
    ctx.strokeStyle = ink.signal(0.95);
    ctx.stroke();
    const head = project(cam, ...(tail[0] ?? [0, 0, 0]));
    ctx.fillStyle = ink.signal();
    ctx.fillRect(head[0] - 2, head[1] - 2, 4, 4);
    return now?.name ?? 'rest';
  },
});
