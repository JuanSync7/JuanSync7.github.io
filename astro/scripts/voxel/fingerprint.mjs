import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export function kernelFingerprint(root='src/figures/kit/voxel-world') {
 const files=readdirSync(root).filter(f=>/\.(ts|json)$/.test(f)).sort();
 const entries=files.map(f=>[f,readFileSync(`${root}/${f}`,'utf8')]);
 const atmosphere=join(root,'..','voxel-atmosphere');if(entries.some(([,body])=>body.includes("../voxel-atmosphere/"))&&existsSync(atmosphere))for(const f of readdirSync(atmosphere).filter(f=>/\.(ts|json)$/.test(f)).sort())entries.push(['../voxel-atmosphere/'+f,readFileSync(join(atmosphere,f),'utf8')]);
 return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

export function verifiedFingerprint(initial,root){const current=kernelFingerprint(root);assert.equal(current,initial,'VXL-SOURCE: generator changed during verification');return initial;}
