import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
} from 'three';
import { defineThreeFigure } from './defineThree';
import { isometric, project } from './kit/camera';
import { box, clear } from './kit/draw';
import { hexOf, ink } from './kit/ink';
import { brickMeshes, type LegoSet } from './kit/lego';
import { GRID, legoCity } from './kit/legocity';
import { smoothstep } from './kit/motion';

/** A city built of LEGO on a studded plate. Over one loop the bricks fall into place tower by
 *  tower in a diagonal wave, the city stands a moment, then the same bricks lift away in the
 *  reverse order and it starts again: build, take apart, rebuild. Under reduced motion the
 *  city stands finished. */

const LOOP = 18;
const BUILD = 8;
const HOLD = 2.4;
const PLATE = GRID + 1;
/** The time a still capture rests at: by then the city stands finished. */
const REST = 1.2;

interface State {
  set: LegoSet;
  cam: OrthographicCamera;
}

/** 0..1 build progress at time t of the loop: up, standing, down, empty for a beat. */
function progressAt(t: number): number {
  const u = t % LOOP;
  if (u < BUILD) return smoothstep(0, 1, u / BUILD);
  if (u < BUILD + HOLD) return 1;
  const down = (u - BUILD - HOLD) / BUILD;
  return down >= 1 ? 0 : 1 - smoothstep(0, 1, down);
}

export default defineThreeFigure<State>({
  id: 'lego-city',
  title: 'LEGO city',
  alt: 'An isometric city made of LEGO bricks that builds itself tower by tower, comes apart, and builds again.',
  idea: 'A city of studded bricks rising in a wave, standing, lifting away in reverse and rebuilding: the platform is made and remade from small parts.',
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
    const plate = new Mesh(new BoxGeometry(PLATE, 0.3, PLATE), new MeshLambertMaterial({ color: hexOf('line3') }));
    plate.position.set(0, -0.15, 0);
    scene.add(plate);
    onDispose(() => {
      plate.geometry.dispose();
    });
    const set = brickMeshes(scene, legoCity(rng), onDispose);
    set.set(1);
    return { set, cam: new OrthographicCamera(-1, 1, 1, -1, 0.1, 120) };
  },
  update: (f) => {
    const cam = f.selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return;
    const span = 17.5;
    const aspect = f.w / f.h;
    cam.left = -span * Math.max(1, aspect);
    cam.right = span * Math.max(1, aspect);
    cam.top = (span * Math.max(1, aspect)) / aspect;
    cam.bottom = -(span * Math.max(1, aspect)) / aspect;
    cam.position.set(34, 30, 34);
    cam.lookAt(0, 5.5, 0);
    cam.updateProjectionMatrix();
    f.state.set.set(f.still ? Math.min(1, f.t / REST) : progressAt(f.t));
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
    project(cam, 0, 0, 0);
  },
});
