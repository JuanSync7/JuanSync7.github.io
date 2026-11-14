import { Group, OrthographicCamera } from 'three';
import { defineThreeFigure } from './defineThree';
import { isometric } from './kit/camera';
import { clear } from './kit/draw';
import { mustHold } from './kit/legocheck';
import { cityQueue, cityShapes, GRID } from './kit/legocity';
import { legoFlat } from './kit/legoflat';
import { finishedAt, liftAt, loopOf, type Timeline } from './kit/legoplay';
import { legoLight, legoModel, type LegoModel } from './kit/legoscene';
import type { Piece } from './kit/legoset';
import { build } from './kit/legoswap';
import { mulberry32 } from './kit/rng';

/** A LEGO city built by hand on its baseplate, with the catalogue's pieces: the street layer
 *  (smooth road tiles, studded pavements and block plates) is there from the first frame; nine
 *  builders raise the nine blocks course by course while a tenth sets cars and lamps on the
 *  streets: a church with an onion spire, a stadium of stands, a museum under its dome, a
 *  skyscraper, houses under 45-degree roofs, a factory, a park of round-crowned trees, a slab and
 *  twin towers. The finished city stands, then the pieces lift off, last on first off, and the
 *  base waits for the next build. Under reduced motion it rests finished. The city is designed in
 *  `kit/legocity.ts` and passes the catalogue's checks (`mustHold`) before it is drawn. */

const SCALE = 0.5;
const REST = 1.2;
/** Where the loop opens: the first courses are going on, so the build is under way when seen. */
const OPEN = 7;
const T: Timeline = { build: 54, hold: 6, tear: 14, rest: 3, press: 0.55, lift: 0.7, drop: 6 };

interface State {
  model: LegoModel;
  pieces: Piece[];
}

/** The seed `npm run lego:check` checks (kit/legomodels.ts), so the drawn city is the checked one. */
const city = (): Piece[] => build(cityShapes(mulberry32(7311)), cityQueue);

export default defineThreeFigure<State>({
  id: 'lego-city',
  title: 'LEGO city',
  alt: 'A LEGO city built brick by brick on its baseplate, then taken apart and built again.',
  idea: 'A platform is assembled from small standard parts on a fixed base, piece by piece, and can be taken apart and rebuilt.',
  motion: 'ambient',
  answers: false,
  group: 'feature',
  seed: 7311,
  aspect: 1.1,
  build: ({ scene, renderer, onDispose }) => {
    legoLight(scene, renderer, onDispose);
    const pieces = city();
    mustHold(pieces, 'city');
    const world = new Group();
    world.scale.setScalar(SCALE);
    world.position.set((-GRID * SCALE) / 2, 0, (-GRID * SCALE) / 2);
    const model = legoModel(pieces, onDispose);
    world.add(model.group);
    scene.add(world);
    return { model, pieces };
  },
  update: (f) => {
    const cam = f.selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return;
    const span = 16;
    const k = Math.max(1, f.w / f.h);
    cam.left = -span * k;
    cam.right = span * k;
    cam.top = (span * k * f.h) / f.w;
    cam.bottom = -cam.top;
    cam.position.set(34, 30, 34);
    cam.lookAt(0, 2.6, 0);
    cam.updateProjectionMatrix();
    const finished = f.still && Math.abs(f.t - REST) < 1e-3;
    const u = finished ? finishedAt(T) : (f.t + OPEN) % loopOf(T);
    f.state.pieces.forEach((p, i) => f.state.model.place(i, liftAt(p.order ?? 0, u, T)));
    f.state.model.commit();
  },
  // Without WebGL: the same pieces drawn flat, bricks with their studs.
  fallback: ({ ctx, w, h }) => {
    clear(ctx, w, h);
    const cam = isometric(w * 0.5, h * 0.62, Math.min(w, h) * 0.017);
    legoFlat(
      ctx,
      cam,
      city().map((p) => ({ ...p, x: p.x - GRID / 2, z: p.z - GRID / 2 })),
    );
  },
});
