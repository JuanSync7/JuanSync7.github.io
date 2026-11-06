import {readFileSync,writeFileSync} from 'node:fs';
import {accentOf} from './geometry.mjs';
const manifest=JSON.parse(readFileSync('vendor/slide-icons/sources.json','utf8'));
const definitions=Object.fromEntries(manifest.icons.map(icon=>[icon.id,{nodes:icon.nodes,accent:accentOf(icon)}]));
writeFileSync('src/figures/kit/slides/definitions.json',JSON.stringify(definitions,null,2)+'\n');
console.log(`Imported ${manifest.icons.length} pinned sources; geometry retained, accents derived from existing features.`);

writeFileSync('src/figures/kit/slides/attribution.json',JSON.stringify({lucide:readFileSync('vendor/slide-icons/LUCIDE-LICENSE.txt','utf8'),original:readFileSync('vendor/slide-icons/ORIGINAL-LICENSE.txt','utf8')} ,null,2)+'\n');
