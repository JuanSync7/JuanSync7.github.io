import type { APIRoute, GetStaticPaths } from 'astro';
import { cableIssues } from '../../figures/kit/drawing/cable';
import { bake } from '../../figures/kit/drawing/monodraw';
import { Sketch } from '../../figures/kit/drawing/monoline';
import { packBaked } from '../../figures/kit/bakedio';
import { DIR } from '../../figures/kit/hiddenshared';
import { SMALL, type SmallId } from '../../figures/kit/hiddenscenes';

/** Each small hidden-line scene, worked out once at the build: its edges and silhouettes seen
 *  from the figure's one direction, and its plates merged. A visitor's browser fetches the
 *  numbers and only draws them (kit/hiddenshared.ts). The scene's checks run here too, so a
 *  scene whose parts clash or whose cables break the rule fails the build, not a page. */

export const getStaticPaths = (() =>
  Object.keys(SMALL).map((scene) => ({ params: { scene } }))) satisfies GetStaticPaths;

const isId = (v: string | undefined): v is SmallId => v !== undefined && v in SMALL;

export const GET: APIRoute = ({ params }) => {
  const id = params.scene;
  if (!isId(id)) return new Response('no such scene', { status: 404 });
  const k = new Sketch();
  SMALL[id].build(k);
  const clashes = k.clashes();
  if (clashes.length) throw new Error(`hidden-line scene ${id}: parts stand inside each other: ${clashes.join(', ')}`);
  const loose = cableIssues(k);
  if (loose.length) throw new Error(`hidden-line scene ${id}: cables break the cabling rule: ${loose.join('; ')}`);
  const body = JSON.stringify(packBaked(bake(k, DIR.clone().negate())));
  return new Response(body, { headers: { 'Content-Type': 'application/json' } });
};
