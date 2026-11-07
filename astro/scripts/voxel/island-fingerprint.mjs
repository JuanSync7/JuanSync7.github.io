import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {kernelFingerprint} from './fingerprint.mjs';
/** Include the classic grammar and the shared camera implementation used by both renderers. */
export function islandFingerprint(astro=resolve('.')){
 const shared=['camera-clearance.ts','camera.ts','pose.ts','view.ts','volume.ts','policy.json'].map(name=>[name,readFileSync(join(astro,'src/figures/kit/voxel-world',name),'utf8')]);
 return createHash('sha256').update(JSON.stringify([kernelFingerprint(join(astro,'src/figures/kit/voxcel-island')),readFileSync(join(astro,'src/figures/kit/voxcelisland.ts'),'utf8'),readFileSync(join(astro,'src/figures/templates/voxcel-island.ts'),'utf8'),shared])).digest('hex');
}
