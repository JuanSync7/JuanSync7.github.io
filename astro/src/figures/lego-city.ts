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
import { isometric, project } from './kit/camera';
import { box, clear } from './kit/draw';
import { hexOf, ink } from './kit/ink';
import { cityMeshes, FINISHED, LOOP, type LegoSet } from './kit/lego';
import { GRID, legoCity } from './kit/legocity';

/** A LEGO city built by hand on its baseplate. The base (roads, pavements, block plates) is there
 *  from the first frame; brick by brick, nine blocks go up course by course (a church, a stadium,
 *  a domed museum, a skyscraper, houses, a factory, a park, a slab and twin towers) while cars
 *  and lamps go onto the streets; the finished city stands a while, then the bricks come off
 *  again, last on first off, and the bare base waits for the next build. Under reduced motion it
 *  rests finished. */

const SCALE = 0.5;
/** The time a still capture rests at. */
const REST = 1.2;
/** Where the loop opens: the first courses are going on, so the build is under way when seen. */
const OPEN = 7;

interface State {
  set: LegoSet;
}

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
  build: ({ scene, rng, onDispose }) => {
    scene.add(new AmbientLight(new Color(hexOf('inkStrong')), 0.95));
    const sun = new DirectionalLight(new Color(hexOf('inkStrong')), 1.35);
    sun.position.set(-6, 14, 9);
    scene.add(sun);
    const world = new Group();
    world.scale.setScalar(SCALE);
    world.position.set((-GRID * SCALE) / 2, 0, (-GRID * SCALE) / 2);
    scene.add(world);
    // The baseplate the city stands on, a stud wider than the city all round.
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
    const span = 15;
    const k = Math.max(1, f.w / f.h);
    cam.left = -span * k;
    cam.right = span * k;
    cam.top = (span * k * f.h) / f.w;
    cam.bottom = -cam.top;
    cam.position.set(34, 30, 34);
    cam.lookAt(0, 1.7, 0);
    cam.updateProjectionMatrix();
    f.state.set.show(f.still && f.t === REST ? FINISHED : (f.t + OPEN) % LOOP);
  },
  // Without WebGL: the same idea in 2D, a baseplate with a few studded brick buildings on it.
  fallback: ({ ctx, w, h }) => {
    clear(ctx, w, h);
    const s = Math.min(w, h) * 0.05;
    const cam = isometric(w * 0.5, h * 0.62, s);
    const tones = {
      top: ink.soft(0.9),
      left: ink.line(0.5),
      right: ink.line(0.7),
      edge: ink.line(0.9),
      crease: ink.faint(0.8),
    };
    const lit = { ...tones, top: ink.signal(0.9) };
    box(ctx, cam, -7, -7, 7, 7, -0.3, 0, { ...tones, top: ink.faint(0.9) });
    const brick = (x: number, z: number, bw: number, bd: number, y: number, top = tones): void => {
      box(ctx, cam, x + 0.04, z + 0.04, x + bw - 0.04, z + bd - 0.04, y, y + 0.6, top);
    };
    const studs = (x: number, z: number, bw: number, bd: number, y: number, top = tones): void => {
      for (let i = 0; i < bw; i++)
        for (let j = 0; j < bd; j++) {
          const [px, py] = project(cam, x + i + 0.5, y + 0.6, z + j + 0.5);
          ctx.beginPath();
          ctx.ellipse(px, py - s * 0.08, s * 0.3, s * 0.17, 0, 0, Math.PI * 2);
          ctx.fillStyle = top.top;
          ctx.fill();
          ctx.strokeStyle = top.edge;
          ctx.stroke();
        }
    };
    const towers = [
      [-5, -5, 2, 2, 5],
      [-1, -5, 4, 2, 2],
      [-5, -1, 2, 4, 3],
      [-1, -1, 2, 2, 8],
      [3, -1, 2, 2, 4],
      [-1, 3, 4, 2, 3],
    ] as const;
    towers.forEach(([x, z, bw, bd, n], t) => {
      for (let c = 0; c < n; c++) brick(x, z, bw, bd, c * 0.6, t === 3 && c === n - 1 ? lit : tones);
      studs(x, z, bw, bd, (n - 1) * 0.6, t === 3 ? lit : tones);
    });
  },
});
