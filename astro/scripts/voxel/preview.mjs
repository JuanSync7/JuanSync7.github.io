import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
export async function preview() {
 const supplied=process.argv.find(a=>a.startsWith('--url='))?.slice(6)??process.env.VOXEL_URL;
 if(supplied)return {url:supplied,close(){}};
 const server=createServer();await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 const address=server.address();if(!address||typeof address==='string')throw Error('No preview port');
 const port=address.port;await new Promise(done=>server.close(done));
 const child=spawn(process.execPath,['node_modules/astro/astro.js','preview','--host','127.0.0.1','--port',String(port)],{env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},stdio:'ignore'});
 const url=`http://127.0.0.1:${port}`;
 try{for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Voxel preview exited');try{if((await fetch(`${url}/lab/voxel-scene/`)).ok)return {url,close(){child.kill();}};}catch{/* wait for startup */}await new Promise(r=>setTimeout(r,200));}throw Error('Voxel preview did not become ready');}catch(e){child.kill();throw e;}
}
