import Ajv from 'ajv';
import {readFileSync} from 'node:fs';
const ajv=new Ajv({allErrors:true,strict:true});
const schema=JSON.parse(readFileSync('scripts/slides/checks/icon.schema.json','utf8'));
const validate=ajv.compile(schema);
const validateNode=ajv.compile(schema.properties.nodes.items);
export function validateDefinition(definition){
 if(!definition||!Array.isArray(definition.nodes)||!definition.nodes.length||!validateNode(definition.accent)||!definition.nodes.every(n=>validateNode(n)))throw Error('Invalid generated SVG primitive');
 for(const node of [...definition.nodes,definition.accent]){
  const dimensions={rect:['width','height'],circle:['r'],ellipse:['rx','ry']}[node.tag]??[];
  if(dimensions.some(key=>!(Number(node.attrs[key])>0)))throw Error('A visible primitive needs positive dimensions');
 }
 for(const node of [...definition.nodes,definition.accent])for(const [key,value] of Object.entries(node.attrs)){
  if(!['d','points'].includes(key)&&!Number.isFinite(Number(value)))throw Error(`Non-finite coordinate ${key}`);
  if(['width','height','r'].includes(key)&&Number(value)<=0)throw Error(`Nonpositive dimension ${key}`);
  if(['rx','ry'].includes(key)&&Number(value)<0)throw Error(`Negative radius ${key}`);
 }
}

export function validateIcon(icon){
 if(!validate(icon))throw Error(`${icon?.id??'Icon'}: ${ajv.errorsText(validate.errors,{separator:'; '})}`);
 const parts=new Set(Object.keys(icon.parts));
 const referenced=[...icon.view.visible,...(icon.collection?.items??[])];
 for(const c of icon.constraints)referenced.push(...(c.parts??[]),...(c.rear??[]),...(c.edges??[]).map(e=>e.part),...[c.to,c.within,c.front].filter(Boolean));
 for(const part of referenced)if(!parts.has(part))throw Error(`${icon.id}: missing part ${part}`);
 if(icon.view.hidden.some(part=>parts.has(part)))throw Error(`${icon.id}: a hidden part must not have visible geometry`);
 const assigned=Object.values(icon.parts).flat();
 if(assigned.some(n=>n>=icon.nodes.length)||new Set(assigned).size!==icon.nodes.length)throw Error(`${icon.id}: every visible primitive must belong to a part`);
 if(new Set(icon.view.visible).size!==parts.size||icon.view.visible.some(p=>!parts.has(p)))throw Error(`${icon.id}: visible parts must match the view declaration`);
 if(icon.accent.node>=icon.nodes.length)throw Error(`${icon.id}: accent feature does not exist`);
 const accentSource=icon.nodes[icon.accent.node];
 if(['circle','ellipse','line'].includes(accentSource.tag)&&icon.accent.kind!=='whole')throw Error(`${icon.id}: accent the full source circle, ellipse or line`);
 if(icon.accent.kind==='top'&&accentSource.tag!=='rect')throw Error(`${icon.id}: top selects a rectangle edge`);
 if(icon.plural&&!icon.collection)throw Error(`${icon.id}: plural requires a declared stack`);
 if(icon.fit.decision==='create'&&!icon.constraints.length)throw Error(`${icon.id}: original geometry requires a physical constraint`);
 return icon;
}
export function validateManifest(manifest){
 if(manifest.schema!=='slide-library/2'||!Array.isArray(manifest.icons)||!manifest.icons.length)throw Error('Invalid or empty slide library');
 if(!manifest.licenses||!Object.keys(manifest.licenses).length)throw Error('Missing license registry');
 const ids=new Set();for(const icon of manifest.icons){validateIcon(icon);if(icon.licenses.some(ref=>!Object.hasOwn(manifest.licenses,ref)))throw Error(`${icon.id}: unknown license notice`);if(ids.has(icon.id))throw Error(`Duplicate icon ${icon.id}`);ids.add(icon.id);}
 return manifest;
}
