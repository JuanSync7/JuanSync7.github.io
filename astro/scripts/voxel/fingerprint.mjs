import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export function kernelFingerprint(root='src/figures/kit/voxel-world') {
 const files=readdirSync(root).filter(f=>/\.(ts|json)$/.test(f)).sort();
 return createHash('sha256').update(JSON.stringify(files.map(f=>[f,readFileSync(`${root}/${f}`,'utf8')]))).digest('hex');
}

export function verifiedFingerprint(initial,root){const current=kernelFingerprint(root);assert.equal(current,initial,'VXL-SOURCE: generator changed during verification');return initial;}
