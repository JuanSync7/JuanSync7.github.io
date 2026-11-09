import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export function kernelFingerprint(root='src/figures/kit/voxel-world') {
 const files=readdirSync(root).filter(f=>/\.(ts|json)$/.test(f)).sort();
 const entries=files.map(f=>[f,readFileSync(join(root,f),'utf8')]);
 // Legacy archives keep their original scope. New renderers include their actual shared inputs.
 if(entries.some(([,body])=>body.includes('../voxel-atmosphere/'))){
  const atmosphere=join(root,'..','voxel-atmosphere');assert(existsSync(atmosphere),'VXL-SOURCE: missing atmosphere dependency');
  for(const f of readdirSync(atmosphere).filter(f=>/\.(ts|json)$/.test(f)).sort())entries.push(['../voxel-atmosphere/'+f,readFileSync(join(atmosphere,f),'utf8')]);
  for(const name of['rng.ts','noise.ts','ink.ts'])entries.push(['../'+name,readFileSync(join(root,'..',name),'utf8')]);
  const palette=readFileSync(join(root,'../../../styles/tokens/palette.ts'),'utf8').match(/export const night = \{([\s\S]*?)\} as const/);
  assert(palette,'VXL-SOURCE: missing night palette dependency');entries.push(['../../../styles/tokens/palette.ts#night',palette[1]]);
 }
 return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}
export function verifiedFingerprint(initial,root){const current=kernelFingerprint(root);assert.equal(current,initial,'VXL-SOURCE: generator changed during verification');return initial;}
