import { defineCanvasFigure } from './define';
import { camera, project } from './kit/camera';
import { box, type BoxTones } from './kit/draw';
import { ink, mix } from './kit/ink';
import { follow } from './kit/motion';

/** The lesson calendar as a field of voxel tiles, one per day, weeks running across and
 *  weekdays running back. A day with lessons stands up as a column, taller for more; empty
 *  days lie flat and a slow swell runs across them; days still to come are only outlined.
 *  The chosen day is the signal. The pointer lifts the day under it and the read-out is its
 *  date, which the page uses to choose a day. */

interface Day {
  /** yyyy-mm-dd. */
  iso: string;
  count: number;
  future: boolean;
  today: boolean;
}

export interface LessonFieldData {
  /** Column by column (a week each), Sunday first: weeks × 7 days. */
  days: readonly Day[];
  weeks: number;
  selected: string | null;
}

interface State {
  sample: LessonFieldData;
  lift: Map<string, number>;
}

const isData = (x: unknown): x is LessonFieldData =>
  typeof x === 'object' &&
  x !== null &&
  Array.isArray((x as { days?: unknown }).days) &&
  typeof (x as { weeks?: unknown }).weeks === 'number';

const HALF = 0.4;
const YAW = 0.32;
const PITCH = 0.45;

export default defineCanvasFigure<State>({
  id: 'lesson-field',
  title: 'Lesson field',
  alt: 'A field of small dark tiles, one per day over sixteen weeks: days with a lesson stand up as columns, the chosen day lit teal.',
  idea: 'The lesson calendar drawn as voxel tiles: lessons stand up as columns, a swell runs across the empty days, the chosen day is lit, and the day under the pointer lifts.',
  style: 'pixel',
  motion: 'ambient',
  answers: true,
  group: 'feature',
  seed: 1611,
  aspect: 3,
  setup: ({ rng }) => {
    const days: Day[] = [];
    for (let i = 0; i < 16 * 7; i++) {
      const count = rng() < 0.12 ? 1 + Math.floor(rng() * 3) : 0;
      days.push({ iso: `sample-${i}`, count, future: i > 16 * 7 - 4, today: i === 16 * 7 - 4 });
    }
    const lit = days.find((d) => d.count > 0);
    return { sample: { days, weeks: 16, selected: lit?.iso ?? null }, lift: new Map() };
  },
  draw: ({ ctx, w, h, t, dt, pointer, still, data, state }) => {
    const field = isData(data) ? data : state.sample;
    const cols = field.weeks;
    // Fit the rotated grid's footprint, weeks across and seven days back, to the frame.
    const across = cols * Math.cos(YAW) + 7 * Math.sin(YAW);
    // Down the frame: the footprint's depth foreshortened by the pitch, plus the tallest column.
    const down = (cols * Math.sin(YAW) + 7 * Math.cos(YAW)) * Math.sin(PITCH) + 1.2;
    const cam = camera({
      cx: w / 2,
      cy: h * 0.5,
      scale: Math.min((w * 0.84) / across, (h * 0.9) / down),
      yaw: YAW,
      pitch: PITCH,
      dist: Infinity,
    });
    const cells = field.days.map((d, i) => {
      const col = Math.floor(i / 7);
      const row = i % 7;
      return { d, x: col - (cols - 1) / 2, z: row - 3, col };
    });
    let hovered: string | null = null;
    let week = -1;
    // Hit-test whenever the pointer is present, a tap included; the lift eases on its own.
    if (pointer.active) {
      let best = cam.scale * 0.9;
      for (const c of cells) {
        if (c.d.future) continue;
        const s = project(cam, c.x, 0.1 + c.d.count * 0.3, c.z);
        const dist = Math.hypot(s[0] - pointer.x * w, s[1] - pointer.y * h);
        if (dist < best) {
          best = dist;
          hovered = c.d.iso;
          week = c.col;
        }
      }
    }
    cells.sort((a, b) => project(cam, a.x, 0, a.z)[2] - project(cam, b.x, 0, b.z)[2]);
    for (const { d, x, z, col } of cells) {
      if (d.future) {
        const pts = [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
          [-1, -1],
        ].map(([u, v]) => project(cam, x + (u ?? 0) * HALF, 0, z + (v ?? 0) * HALF));
        ctx.strokeStyle = ink.line(0.12);
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.stroke();
        continue;
      }
      const target = d.iso === hovered ? 0.32 : 0;
      const lift = still ? target : follow(state.lift.get(d.iso) ?? 0, target, dt, 9);
      state.lift.set(d.iso, lift);
      // The swell: a slow wave across the empty days, from the oldest week to the newest.
      const swell = d.count ? 0 : (Math.sin(t * 0.9 - col * 0.45 - z * 0.3) + 1) * 0.035;
      const top = 0.06 + swell + d.count * 0.3 + lift;
      const chosen = d.iso === field.selected;
      const warm = Math.min(1, d.count / 3);
      const tones: BoxTones = chosen
        ? {
            top: mix('panelSignal', 'signalLine', 0.6),
            left: mix('ground', 'panel', 0.9),
            right: mix('ground', 'panel', 0.5),
            edge: ink.signal(0.95),
            crease: ink.signal(0.4),
          }
        : {
            top:
              d.iso === hovered
                ? mix('panel2', 'line4', 0.5)
                : d.count
                  ? mix('panel', 'panel2', 0.5 + warm * 0.5)
                  : mix('ground', 'panel', 0.55 + swell * 6),
            left: mix('ground', 'panel', d.count ? 0.8 : 0.4),
            right: mix('ground', 'panel', d.count ? 0.45 : 0.2),
            // The hovered day's whole week brightens, so the pointer reads as a date, not a tile.
            edge:
              d.iso === hovered
                ? ink.signal(0.6)
                : d.today
                  ? ink.line(0.85)
                  : ink.line((d.count ? 0.5 : 0.16) + (col === week ? 0.3 : 0)),
            crease: ink.line(d.count ? 0.18 : 0.06),
          };
      box(ctx, cam, x - HALF, z - HALF, x + HALF, z + HALF, lift, top, tones);
    }
    return hovered ?? 'rest';
  },
});
