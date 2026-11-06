import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const hash=value=>createHash('sha256').update(value).digest('hex');
export function packet({stage,task,id}){
 const routes=JSON.parse(readFileSync(`${root}/astro/scripts/slides/stages.json`));
 if(!routes[stage])throw Error(`Unknown stage ${stage}; choose a routed stage`);
 if(!task?.trim())throw Error('Name the slide meaning or authoring task');
 const sources=routes[stage].map(path=>{const content=readFileSync(`${root}/${path}`,'utf8');return {path,sha256:hash(content),trust:'maintained project process; not an adoption of vault guidance',content};});
 let icon=null;
 if(id){const manifest=JSON.parse(readFileSync(`${root}/astro/vendor/slide-icons/sources.json`));icon=manifest.icons.find(i=>i.id===id);if(!icon)throw Error(`Unknown icon ${id}`);}
 const payload={schema:'slide-stage-packet/1',stage,task,sources,icon,receiptMeaning:'Assembled context only; does not prove reading, application, visual review or approval.'};
 return {id:hash(JSON.stringify(payload)),...payload};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
 const result=packet({stage:arg('stage'),task:arg('task'),id:arg('id')});
 const path=`slides-out/packets/${result.id}.json`;mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({path,...result},null,2));
}
