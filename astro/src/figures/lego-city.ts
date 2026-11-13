import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
} from 'three';
import { defineThreeFigure } from './defineThree';
import { isometric } from './kit/camera';
import { box, clear } from './kit/draw';
import { hexOf, ink } from './kit/ink';
import { cityMeshes, type CityState, type LegoSet } from './kit/lego';
import { GRID, legoCity } from './kit/legocity';
import { smoothstep } from './kit/motion';

/** One city, made twice. First it rises as a plain isometric model, street by street and floor by
 *  floor; then a wave sweeps across and every part turns into LEGO (the same city packed into
 *  studded bricks); the bricks stand a while, lift away in build order, and the loop begins
 *  again. Under reduced motion it rests as the finished LEGO city. */

const LOOP = 20;
const SCALE = 0.5;
/** The time a still capture rests at: by then the city has turned to bricks. */
const REST = 1.2;

interface State {
  set: LegoSet;
}

/** The loop: model rises 0-4.5, stands to 6, turns to LEGO 6-10, stands to 13, lifts away
 *  13-18, and the plate rests empty until 20. */
function stateAt(t: number): CityState {
  const u = t % LOOP;
  return {
    model: Math.min(1, u / 4.5),
    swap: smoothstep(6, 10, u),
    teardown: u < 13 ? 1 : 1 - smoothstep(13, 18, u),
  };
}

export default defineThreeFigure<State>({
  id: 'lego-city',
  title: 'LEGO city',
  alt: 'An isometric city that rises as a smooth model, turns into LEGO bricks, comes apart and is built again.',
  idea: 'The same city in two materials: designed as a smooth isometric model, then made of studded bricks, taken apart and rebuilt: a platform is designed first and assembled from small parts.',
  motion: 'ambient',
  answers: false,
  group: 'feature',
  seed: 7311,
  aspect: 1.1,
  build: ({ scene, rng, onDispose }) => {
    scene.add(new AmbientLight(new Color(hexOf('inkStrong')), 0.95));
    const sun = new DirectionalLight(new Color(hexOf('inkStrong')), 1.35);
    sun.position.set(-6, 14, 9);
    scene.add(sun);
    const world = new Group();
    world.scale.setScalar(SCALE);
    world.position.set((-GRID * SCALE) / 2, 0, (-GRID * SCALE) / 2);
    scene.add(world);
    const plate = new Mesh(
      new BoxGeometry(GRID + 1, 0.3, GRID + 1),
      new MeshLambertMaterial({ color: hexOf('line3') }),
    );
    plate.position.set(GRID / 2, -0.15, GRID / 2);
    world.add(plate);
    onDispose(() => plate.geometry.dispose());
    return { set: cityMeshes(world, legoCity(rng), onDispose) };
  },
  update: (f) => {
    const cam = f.selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return;
    const span = 17.5;
    const k = Math.max(1, f.w / f.h);
    cam.left = -span * k;
    cam.right = span * k;
    cam.top = (span * k * f.h) / f.w;
    cam.bottom = -cam.top;
    cam.position.set(34, 30, 34);
    cam.lookAt(0, 5.5, 0);
    cam.updateProjectionMatrix();
    f.state.set.show(
      f.still ? { model: Math.min(1, f.t / REST), swap: f.t >= REST ? 1 : 0, teardown: 1 } : stateAt(f.t),
    );
  },
  fallback: ({ ctx, w, h }) => {
    clear(ctx, w, h);
    const cam = isometric(w * 0.5, h * 0.7, Math.min(w, h) * 0.05);
    const tones = {
      top: ink.soft(0.9),
      left: ink.line(0.5),
      right: ink.line(0.7),
      edge: ink.line(0.9),
      crease: ink.faint(0.8),
    };
    const lit = { ...tones, top: ink.signal(0.9) };
    const city = [
      [-4, -4, 5],
      [0, -4, 3],
      [-4, 0, 3],
      [0, 0, 8],
      [4, 0, 4],
      [0, 4, 5],
    ] as const;
    city.forEach(([x, z, floors], i) => box(ctx, cam, x, z, x + 2.6, z + 2.6, 0, floors * 0.8, i === 3 ? lit : tones));
  },
});
