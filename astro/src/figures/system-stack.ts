import { BoxGeometry, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial } from 'three';
import { defineThreeFigure } from './defineThree';
import { isometric } from './kit/camera';
import { box } from './kit/draw';
import { hexOf, ink, mix } from './kit/ink';
import { clamp, follow } from './kit/motion';

/** The platform as a stack of glass plates turning slowly in space, bottom to top: models
 *  and tools, the gateway, the core, the surfaces people use, the people. Each plate carries
 *  its components as small blocks. The core is lit at rest; the pointer's height picks a
 *  plate, which rises and takes the signal, and the read-out names it. */

const LAYERS = [
  { name: 'models · tools', blocks: 6 },
  { name: 'gateway · identity', blocks: 2 },
  { name: 'core · knowledge', blocks: 3 },
  { name: 'surfaces', blocks: 3 },
  { name: 'people', blocks: 4 },
] as const;

const GAP = 0.46;
const REST = 2;
const W = 2.4;
const D = 1.5;

interface Plate {
  group: Group;
  edge: LineBasicMaterial;
  lift: number;
}

interface State {
  plates: Plate[];
  yaw: number;
}

const pickOf = (y: number): number => clamp(Math.floor((1 - y) * LAYERS.length), 0, LAYERS.length - 1);

export default defineThreeFigure<State>({
  id: 'system-stack',
  title: 'System stack',
  alt: 'Five thin translucent plates stacked in space and slowly turning, each carrying a few small outlined blocks; the middle plate is raised slightly and outlined in teal.',
  idea: 'The whole platform at a glance: five layers from models up to people, the core in the middle, any layer lifted out to be named.',
  motion: 'ambient',
  answers: true,
  group: 'hero',
  seed: 2026,
  aspect: 1.25,
  build: ({ scene }) => {
    const plates: Plate[] = LAYERS.map((layer, i) => {
      const group = new Group();
      const slab = new BoxGeometry(W, 0.05, D);
      group.add(new Mesh(slab, new MeshBasicMaterial({ color: hexOf('panel2'), transparent: true, opacity: 0.72, depthWrite: false })));
      const edge = new LineBasicMaterial({ color: hexOf('inkMuted'), transparent: true, opacity: 0.7 });
      group.add(new LineSegments(new EdgesGeometry(slab), edge));
      const blockEdge = new LineBasicMaterial({ color: hexOf('inkFaint'), transparent: true, opacity: 0.55 });
      for (let b = 0; b < layer.blocks; b++) {
        const g = new BoxGeometry(0.3, 0.16, 0.3);
        const x = (b - (layer.blocks - 1) / 2) * 0.42;
        const block = new LineSegments(new EdgesGeometry(g), blockEdge);
        block.position.set(x, 0.11, 0);
        g.dispose();
        group.add(block);
      }
      group.position.y = (i - (LAYERS.length - 1) / 2) * GAP;
      scene.add(group);
      return { group, edge, lift: 0 };
    });
    return { plates, yaw: 0.7 };
  },
  update: ({ camera, t, dt, pointer, hover, still, state, w, h }) => {
    const pick = pointer.active && hover > 0.3 ? pickOf(pointer.y) : REST;
    const yawTarget = 0.7 + Math.sin(t * 0.18) * 0.35 + (pointer.active ? (pointer.x - 0.5) * 0.8 * hover : 0);
    state.yaw = still ? yawTarget : follow(state.yaw, yawTarget, dt, 2);
    const dist = w / h < 1 ? 8 : 6.6;
    camera.position.set(Math.sin(state.yaw) * dist, dist * 0.42, Math.cos(state.yaw) * dist);
    camera.lookAt(0, 0, 0);
    state.plates.forEach((p, i) => {
      const lift = i === pick ? 0.16 : 0;
      p.lift = still ? lift : follow(p.lift, lift, dt, 7);
      p.group.position.y = (i - (LAYERS.length - 1) / 2) * GAP + p.lift;
      p.edge.color.set(i === pick ? hexOf('signal') : hexOf('inkMuted'));
      p.edge.opacity = i === pick ? 1 : 0.7;
    });
    return pointer.active && hover > 0.3 ? LAYERS[pick]?.name ?? 'rest' : 'rest';
  },
  fallback: ({ ctx, w, h, pointer, hover }) => {
    const cam = isometric(w / 2, h * 0.5, Math.min(w, h) * 0.3);
    const pick = pointer.active && hover > 0.3 ? pickOf(pointer.y) : REST;
    LAYERS.forEach((_, i) => {
      const y = (i - (LAYERS.length - 1) / 2) * GAP + (i === pick ? 0.16 : 0);
      box(ctx, cam, -W / 2, -D / 2, W / 2, D / 2, y, y + 0.05, {
        top: i === pick ? mix('panelSignal', 'signalLine', 0.5) : mix('panel', 'panel2', 0.8),
        left: mix('ground', 'panel', 0.9),
        right: mix('ground', 'panel', 0.5),
        edge: i === pick ? ink.signal(0.95) : ink.line(0.5),
        crease: i === pick ? ink.signal(0.35) : ink.line(0.14),
      });
    });
    return pointer.active && hover > 0.3 ? LAYERS[pick]?.name ?? 'rest' : 'rest';
  },
});
