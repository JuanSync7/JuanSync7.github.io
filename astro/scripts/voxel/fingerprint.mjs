import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
export function kernelFingerprint() {
 const root='src/figures/kit/voxel-world';
 const files=readdirSync(root).filter(f=>/\.(ts|json)$/.test(f)).sort();
 return createHash('sha256').update(JSON.stringify(files.map(f=>[f,readFileSync(`${root}/${f}`,'utf8')]))).digest('hex');
}
