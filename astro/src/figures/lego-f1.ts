import { Group, OrthographicCamera } from 'three';
import { defineThreeFigure } from './defineThree';
import { isometric } from './kit/camera';
import { clear } from './kit/draw';
import { legoFlat } from './kit/legoflat';
import { F1 } from './kit/legoformula';
import { mustHold } from './kit/legocheck';
import type { Piece } from './kit/legoset';
import { finishedAt, liftAt, loopOf, type Timeline } from './kit/legoplay';
import { legoLight, legoModel, type LegoModel } from './kit/legoscene';
import { build } from './kit/legoswap';

/** A Formula 1 car built in LEGO, piece by piece, on a display base that is there from the first
 *  frame: each piece drops onto the studs below it in its turn (floor, axle mounts, survival
 *  cell, wings, bodywork, halo, then axles and wheels), the finished car stands, then the pieces
 *  come off again, last on first off, and the base waits for the next build. The car turns once
 *  through every loop, so each side is seen being built. Under reduced motion it rests finished.
 *  The model is designed as shapes and swapped into catalogue pieces (kit/legoswap), and must
 *  pass the catalogue's checks (no clipping, nothing floating) before it is drawn. */

const SCALE = 0.36;
/** The time a still rests at (the frame loop reaches it in steps, so compare with a tolerance). */
const REST = 1.2;
/** Where the loop opens: the floor and the axle mounts are down, the survival cell going on. */
const OPEN = 12;
/** The turn that shows the car nose first, from the front left. */
const FACE = 1.95;
/** Seconds per piece while building; the rest of the standard timeline. */
const PER = 0.12;
const T = { hold: 6, tear: 10, rest: 2.5, press: 0.55, lift: 0.7, drop: 6 };

interface State {
  model: LegoModel;
  pieces: Piece[];
  turn: Group;
  time: Timeline;
  size: number;
}

export default defineThreeFigure<State>({
  id: 'lego-f1',
  title: 'LEGO F1 car',
  alt: 'A Formula 1 car built in LEGO piece by piece on a display base, turning slowly, then taken apart and built again.',
  idea: 'Any design can be planned as a shape, swapped into standard parts, checked, and assembled piece by piece.',
  motion: 'ambient',
  answers: false,
  group: 'feature',
  seed: 7312,
  aspect: 1.5,
  build: ({ scene, renderer, onDispose }) => {
    legoLight(scene, renderer, onDispose);
    const pieces = build(F1);
    mustHold(pieces, 'f1');
    const turn = new Group();
    const car = new Group();
    car.position.set(-19.5, 0, -7);
    const model = legoModel(pieces, onDispose);
    car.add(model.group);
    // The display base, LEGO too: a course of plates bonded under a course of tiles, so the
    // tyres stand on smooth tops. It is there from the first frame and never moves.
    const base = legoModel(build([{ kind: 'block', x: -1, y: -2, z: -1, w: 42, d: 16, h: 2, top: 'tiles', tone: 'line2' }]), onDispose).group; // prettier-ignore
    car.add(base);
    turn.add(car);
    turn.scale.setScalar(SCALE);
    scene.add(turn);
    // The frame fits the circle the base sweeps as the car turns.
    const size = 2 * Math.hypot(21, 8) * SCALE;
    return { model, pieces, turn, time: { ...T, build: pieces.length * PER }, size };
  },
  update: (f) => {
    const s = f.state;
    const cam = f.selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return;
    const half = s.size * 0.53;
    const k = f.w / f.h;
    Object.assign(cam, { left: -half, right: half, top: half / k, bottom: -half / k, near: 0.1, far: 200 });
    cam.position.set(30, 22, 30);
    cam.lookAt(0, 1.2, 0);
    cam.updateProjectionMatrix();
    const finished = f.still && Math.abs(f.t - REST) < 1e-3;
    const loop = loopOf(s.time);
    const u = finished ? finishedAt(s.time) : (f.t + OPEN) % loop;
    s.turn.rotation.y = FACE + (finished ? 0 : (u / loop) * Math.PI * 2);
    s.pieces.forEach((p, i) => s.model.place(i, liftAt(p.order ?? 0, u, s.time)));
    s.model.commit();
  },
  fallback: ({ ctx, w, h }) => {
    clear(ctx, w, h);
    const pieces = build(F1);
    const cam = isometric(w * 0.52, h * 0.6, Math.min(w, h) * 0.022);
    legoFlat(
      ctx,
      cam,
      pieces.map((p) => ({ ...p, x: p.x - 19.5, z: p.z - 7 })),
    );
  },
});
