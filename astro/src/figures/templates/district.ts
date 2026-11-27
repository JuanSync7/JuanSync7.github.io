import { OrthographicCamera, type InstancedMesh } from 'three';
import { defineThreeFigure } from '../defineThree';
import { defineTemplate } from '../defineTemplate';
import { clear } from '../kit/draw';
import { DRAW_IN, drawIn, drawnAt } from '../kit/drawin';
import type { Drawing } from '../kit/draft';
import {
  aimDistrict,
  BOARDS,
  districtOf,
  drawDistrict,
  moveDistrict,
  pulsesOf,
  wireFor,
  type P,
} from '../kit/districtscene';
import { lookFrom, type Plan } from '../kit/districtsketch';
import { drawWire } from '../kit/districtwire';
import { between, pick } from '../kit/rng';

/** One board of the home page's archipelago, drawn on its own as a "3D isometric hidden-line
 *  drawing, monoline" (R-FIG-28): a housing street, a datacentre, the library by its lake, an
 *  open-pit mine, a smelting line, the car line, a press shop, the power station, the geothermal
 *  field, the dam, the exchange or the airport. Every building is a solid with its windows and
 *  doors on its faces (`kit/districtsketch.ts`), rock and hills are one terrain surface
 *  (`kit/terrain.ts`), trees are turned from their profiles (`kit/treesolids.ts`), and the layout
 *  keeps every solid out of every other (`kit/districtlayout.ts`). The camera is the seed's, and
 *  the lines are worked out for it once, so it sees only what faces it. Flow runs along the
 *  pipes and lines in the signal and vehicles drive the roads. Without WebGL it falls back to the
 *  earlier wireframe. */

/** The boards whose generator lays rock and hills (`kit/mining.ts`, `kit/hydro.ts`). */
const ROCKY: readonly string[] = ['open pit', 'smelting line', 'dam'];

interface S {
  plan: Plan;
  draw: Drawing;
  spots: InstancedMesh | undefined;
  drawn: number;
  fit: string;
  frame: number;
  dpr: () => number;
}

export default defineTemplate<P, S>({
  id: 'district',
  title: 'District',
  idea: 'One working district of the archipelago on its own board, drawn as a hidden-line isometric of solid buildings, terrain and trees: housing, a datacentre, a mine, a smelting line, a car line, a power station, geothermal wells, a dam, an exchange or an airport, with its pipes and roads alive.',
  style: 'three',
  renderer: defineThreeFigure,
  motion: 'ambient',
  answers: false,
  aspect: 2,
  grammar: (rng) => ({
    board: pick(rng, BOARDS),
    salt: Math.floor(rng() * 1e6),
    yaw: between(rng, 0.45, 1.1) * (rng() > 0.5 ? 1 : -1),
    pitch: between(rng, 0.5, 0.72),
  }),
  name: (p) => p.board[2],
  alt: (p) =>
    `An isometric line drawing of a ${p.board[2]} on a thin board, seen from above at an angle: solid buildings with their windows and doors${ROCKY.includes(p.board[2]) ? ', rock and hills as one contoured ground' : ''}, rounded trees, each hiding what stands behind it, flow running along its pipes and lines, and small vehicles driving its roads.`,
  build: ({ scene, renderer, onDispose, params }) => {
    const plan = districtOf(params.board, params.salt);
    const draw = drawDistrict(plan, lookFrom(params.yaw, params.pitch), onDispose);
    scene.add(draw.root);
    const n = pulsesOf(plan);
    return {
      plan,
      draw,
      spots: n ? draw.spots(n) : undefined,
      drawn: 0,
      fit: '',
      frame: -1,
      dpr: () => renderer.getPixelRatio(),
    };
  },
  update: (f) => {
    const cam = f.selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return;
    const s = f.state;
    const size = `${f.w}x${f.h}x${s.dpr()}`;
    if (size !== s.fit) {
      s.fit = size;
      aimDistrict(cam, s.plan, lookFrom(f.params.yaw, f.params.pitch), f.w, f.h);
      s.draw.fit(f.w, f.h, s.dpr());
    }
    // The board draws itself in when first seen; then the traffic and the flow run.
    if (s.drawn < 1) {
      s.drawn = drawnAt(f.t, DRAW_IN.hero);
      drawIn(s.draw.root, s.drawn);
      if (s.spots) s.spots.visible = s.drawn >= 1;
    }
    moveDistrict(s.draw, s.plan, s.spots, f.t);
    // Redrawn at 30 frames a second, which the eye reads as smooth at this size.
    const frame = Math.floor(f.t * 30);
    f.renderWhen(f.still || frame !== s.frame);
    s.frame = frame;
  },
  fallback: ({ ctx, w, h, t, params }) => {
    clear(ctx, w, h);
    drawWire(ctx, wireFor(params), w, h, t, params.yaw, params.pitch);
  },
});
