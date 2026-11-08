import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {lengthOf,pointsOf} from './checks/geometry.mjs';
import {checkContracts} from './checks/contracts.mjs';
import {checkAccentCoverage} from './checks/accent.mjs';
import {engineRevision} from './checks/engine.mjs';
import {validateIcon,validateManifest,validateDefinition} from './checks/schema.mjs';
export const rules=JSON.parse(readFileSync('scripts/slides/rules.json','utf8'));
export const manifest=validateManifest(JSON.parse(readFileSync('vendor/slide-icons/sources.json','utf8')));
export const engine=engineRevision();
const hash=value=>createHash('sha256').update(value).digest('hex');
export const fingerprint=(icon,variants)=>hash(JSON.stringify({icon,variants,rules,engine}));
export function auditIcon(icon,definition){
 const failures=[],fail=(rule,message)=>failures.push({rule,message});
 try{validateIcon(icon);}catch(error){fail('SPEC',error.message);return {id:icon.id,failures,metrics:{}};}
 try{validateDefinition(definition);}catch(error){fail('GEOMETRY',error.message);return {id:icon.id,failures,metrics:{}};}
 const {nodes,accents}=definition;
 if(JSON.stringify(nodes)!==JSON.stringify(icon.nodes))fail('SOURCE','Generated geometry differs from the pinned source');
 if(!icon.license||!icon.upstream)fail('SOURCE','Missing license or provenance');
 let samples;
 try{samples=[...nodes,...accents].map(n=>pointsOf(n,rules.boundsStep));}catch(error){fail('GEOMETRY',`Invalid SVG geometry: ${error.message}`);return {id:icon.id,failures,metrics:{}};}
 const half=rules.stroke/2;
 for(const points of samples)for(const p of points)if(!Number.isFinite(p.x+p.y)||p.x-half<rules.safeMin||p.y-half<rules.safeMin||p.x+half>rules.safeMax||p.y+half>rules.safeMax){fail('FRAME','A curve or stroke leaves the safe frame');break;}
 const fraction=accents.reduce((sum,n)=>sum+lengthOf(n),0)/nodes.reduce((sum,n)=>sum+lengthOf(n),0);
 try{failures.push(...checkAccentCoverage(icon,accents));}catch(error){fail('ACCENT',error.message);}
 failures.push(...checkContracts(icon,nodes,rules));
 return {id:icon.id,failures,metrics:{accentMode:icon.accent.mode,accentPart:icon.accent.part??null,accentPrimitives:accents.length,accentFraction:Number(fraction.toFixed(4)),view:icon.view,plural:icon.plural}};
}
