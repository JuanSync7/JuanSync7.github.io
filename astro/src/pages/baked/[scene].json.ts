import type { APIRoute, GetStaticPaths } from 'astro';
import { cableIssues } from '../../figures/kit/drawing/cable';
import { bake } from '../../figures/kit/drawing/monodraw';
import { Sketch } from '../../figures/kit/drawing/monoline';
import { packBaked } from '../../figures/kit/bakedio';
import { linesOnly } from '../../figures/kit/bakedplates';
import { DIR } from '../../figures/kit/hiddenshared';
import { SMALL } from '../../figures/kit/hiddenscenes';
import { labRoom } from '../../figures/kit/labroom';

/** Each hidden-line scene, worked out once at the build: its edges and silhouettes seen from the
 *  figure's one direction, and its plates merged. A visitor's browser fetches the numbers and only
 *  draws them (`loadBaked`, kit/bakedio.ts). The scene's checks run here too, so a scene whose
 *  parts clash or whose cables break the rule fails the build, not a page. A big scene ships its
 *  lines only (`plates: false`): its plates are most of the file and the page merges them from the
 *  sketch in a few milliseconds (kit/bakedplates.ts). */

interface Scene {
  build: (k: Sketch) => void;
  plates: boolean;
}

const SCENES: Record<string, Scene> = {
  ...Object.fromEntries(
    Object.entries(SMALL).map(([id, s]) => [id, { build: (k: Sketch) => s.build(k), plates: true }]),
  ),
  // The lab hero (figures/lab-room.ts): 28,000 line segments, 360 ms to work out.
  'lab-room': { build: labRoom, plates: false },
};

export const getStaticPaths = (() =>
  Object.keys(SCENES).map((scene) => ({ params: { scene } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const id = params.scene;
  const scene = id === undefined ? undefined : SCENES[id];
  if (!scene) return new Response('no such scene', { status: 404 });
  const k = new Sketch();
  scene.build(k);
  const clashes = k.clashes();
  if (clashes.length) throw new Error(`hidden-line scene ${id}: parts stand inside each other: ${clashes.join(', ')}`);
  const loose = cableIssues(k);
  if (loose.length) throw new Error(`hidden-line scene ${id}: cables break the cabling rule: ${loose.join('; ')}`);
  const baked = bake(k, DIR.clone().negate());
  const body = JSON.stringify(packBaked(scene.plates ? baked : linesOnly(baked)));
  return new Response(body, { headers: { 'Content-Type': 'application/json' } });
};
