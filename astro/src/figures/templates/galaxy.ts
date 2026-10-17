import { defineTemplate } from '../defineTemplate';
import { camera, nearness, project } from '../kit/camera';
import { ink } from '../kit/ink';
import { follow } from '../kit/motion';
import { noise2, type Noise2 } from '../kit/noise';
import { between, pick } from '../kit/rng';

/** Space in lines and points: a spiral galaxy turning on its tilted disc, a planetary
 *  system with trailing orbits, a nebula traced by flow lines, a constellation slowly in
 *  parallax. Detail comes from many faint marks, one of them the signal. The pointer tilts
 *  the view. */

const FORMS = ['spiral', 'orbits', 'nebula', 'constellation'] as const;
type Form = (typeof FORMS)[number];

interface Star {
  r: number;
  a: number;
  y: number;
  b: number;
}

interface P {
  form: Form;
  arms: number;
  wind: number;
  tilt: number;
  spin: number;
}

interface S {
  stars: Star[];
  noise: Noise2;
  tilt: number;
}

export default defineTemplate<P, S>({
  id: 'galaxy',
  title: 'Galaxy',
  idea: 'Space drawn with many faint marks: a spiral galaxy turning, planets trailing their orbits, a nebula traced by flow lines, a constellation in parallax.',
  style: 'perspective',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({ form: pick(rng, FORMS), arms: 2 + Math.floor(rng() * 3), wind: between(rng, 2.2, 4.5), tilt: between(rng, 0.35, 0.95), spin: (rng() < 0.5 ? -1 : 1) * between(rng, 0.06, 0.14) }),
  name: (p) => (p.form === 'spiral' ? `${p.arms}-arm spiral` : p.form),
  alt: (p) => `A ${p.form === 'spiral' ? 'spiral galaxy' : p.form} drawn in faint grey points and lines on the dark, slowly moving, one mark teal.`,
  setup: ({ rng, params }) => {
    const stars: Star[] = [];
    const count = params.form === 'constellation' ? 70 : params.form === 'orbits' ? 7 : params.form === 'spiral' ? 1100 : 520;
    for (let i = 0; i < count; i++) {
      if (params.form === 'spiral') {
        const arm = i % params.arms;
        // A third of the stars fill the bulge; the rest follow the arms, scattered more
        // near the core than at the rim.
        const bulge = rng() < 0.3;
        const r = bulge ? Math.pow(rng(), 2) * 0.35 : Math.pow(rng(), 0.7);
        const a = bulge ? rng() * Math.PI * 2 : (arm / params.arms) * Math.PI * 2 + r * params.wind + (rng() - 0.5) * (0.6 - r * 0.3);
        stars.push({ r, a, y: (rng() - 0.5) * 0.06 * (1 - r), b: rng() });
      } else if (params.form === 'orbits') {
        stars.push({ r: 0.22 + i * 0.13 + rng() * 0.04, a: rng() * Math.PI * 2, y: 0, b: 0.3 + rng() * 0.7 });
      } else {
        stars.push({ r: rng(), a: rng(), y: rng(), b: rng() });
      }
    }
    return { stars, noise: noise2(rng), tilt: params.tilt };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const target = pointer.active ? params.tilt + (0.5 - pointer.y) * 0.8 * hover : params.tilt;
    state.tilt = still ? target : follow(state.tilt, target, dt, 3);
    const cam = camera({ cx: w / 2, cy: h / 2, scale: Math.min(w * 0.42, h * 0.95), yaw: t * params.spin, pitch: state.tilt, dist: 4 });
    const dotAt = (x: number, y: number, z: number, b: number, hot = false): void => {
      const p = project(cam, x, y, z);
      const near = nearness(p[2], 1.2);
      ctx.fillStyle = hot ? ink.signal(0.95) : ink.line(0.12 + b * 0.5 * (0.4 + near * 0.6));
      const s = hot ? 3 : b > 0.92 ? 2 : 1.2;
      ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
    };
    if (params.form === 'spiral') {
      state.stars.forEach((s, i) => {
        const a = s.a - t * 0.05 * (1 - s.r);
        dotAt(Math.cos(a) * s.r, s.y, Math.sin(a) * s.r, s.b, i === 3);
      });
    } else if (params.form === 'orbits') {
      dotAt(0, 0, 0, 1);
      state.stars.forEach((s, i) => {
        const a = s.a + (t * 0.5) / Math.pow(s.r, 1.5);
        ctx.strokeStyle = ink.line(0.12);
        ctx.beginPath();
        for (let k = 0; k <= 64; k++) {
          const q = project(cam, Math.cos((k / 64) * Math.PI * 2) * s.r, 0, Math.sin((k / 64) * Math.PI * 2) * s.r);
          if (k) ctx.lineTo(q[0], q[1]);
          else ctx.moveTo(q[0], q[1]);
        }
        ctx.stroke();
        // The trail: the last quarter turn of the orbit, fading behind the planet.
        for (let k = 0; k < 16; k++) {
          const b = a - k * 0.06;
          const q0 = project(cam, Math.cos(b) * s.r, 0, Math.sin(b) * s.r);
          const q1 = project(cam, Math.cos(b - 0.06) * s.r, 0, Math.sin(b - 0.06) * s.r);
          ctx.strokeStyle = i === 2 ? ink.signal(0.8 * (1 - k / 16)) : ink.line(0.6 * (1 - k / 16));
          ctx.beginPath();
          ctx.moveTo(q0[0], q0[1]);
          ctx.lineTo(q1[0], q1[1]);
          ctx.stroke();
        }
        dotAt(Math.cos(a) * s.r, 0, Math.sin(a) * s.r, 1, i === 2);
      });
    } else if (params.form === 'nebula') {
      // Flow lines: each seed point follows the noise field's direction for a short way.
      state.stars.slice(0, 160).forEach((s, i) => {
        let x = (s.r - 0.5) * 2.4;
        let z = (s.a - 0.5) * 1.6;
        ctx.strokeStyle = i === 7 ? ink.signal(0.85) : ink.line(0.08 + s.b * 0.3);
        ctx.beginPath();
        for (let k = 0; k < 18; k++) {
          const ang = state.noise(x * 1.3, z * 1.3 + t * 0.05) * Math.PI * 2;
          const p = project(cam, x, Math.sin(x * 2 + z) * 0.08, z);
          if (k) ctx.lineTo(p[0], p[1]);
          else ctx.moveTo(p[0], p[1]);
          x += Math.cos(ang) * 0.035;
          z += Math.sin(ang) * 0.035;
        }
        ctx.stroke();
      });
    } else {
      const pts = state.stars.map((s) => [(s.r - 0.5) * 2.6, (s.y - 0.5) * 1.2, (s.a - 0.5) * 2.2] as const);
      pts.forEach((p, i) => dotAt(p[0], p[1], p[2], state.stars[i]?.b ?? 0.5, i === 11));
      // Each of the brightest stars joins its two nearest bright neighbours: figures emerge.
      const bright = pts.map((p, i) => ({ p, i, b: state.stars[i]?.b ?? 0 })).filter((s) => s.b > 0.6);
      ctx.strokeStyle = ink.line(0.24);
      ctx.beginPath();
      for (const s of bright) {
        const near = bright.filter((o) => o.i !== s.i).sort((m, n) => Math.hypot(m.p[0] - s.p[0], m.p[1] - s.p[1], m.p[2] - s.p[2]) - Math.hypot(n.p[0] - s.p[0], n.p[1] - s.p[1], n.p[2] - s.p[2])).slice(0, 2);
        const a = project(cam, s.p[0], s.p[1], s.p[2]);
        for (const o of near) {
          const b = project(cam, o.p[0], o.p[1], o.p[2]);
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
      }
      ctx.stroke();
    }
    return pointer.active ? `${params.form} · tilt` : 'rest';
  },
});
