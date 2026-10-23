import {readdir,open,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const blocked=/\.(?:lua|luac|luae|luajit|ljbc|lpak|apk|apks|xapk|aab|unitypackage)$/i;
const citations=/\b[A-Za-z_][A-Za-z0-9_-]*\.lua(?:c|e|jit)?\b/i;
export async function assertPublicFiles(root='dist'){
 const files=[];async function visit(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())await visit(p);else files.push(p)}}await visit(root);
 for(let i=0;i<files.length;i+=24)await Promise.all(files.slice(i,i+24).map(async file=>{
  if(/(?:^|[\\/])(?:.*(?:txui_|txvx_|txsc_|Tatari__|Zobo__)).*\.(?:png|webp|jpe?g|svg|gif|avif)$/i.test(file))throw Error('Raw artwork filename in public output: '+path.relative(root,file));
  if(blocked.test(file))throw Error('Private game-source/package file in public output: '+path.relative(root,file));
  const handle=await open(file,'r');let bytes;try{const buffer=Buffer.alloc(4);await handle.read(buffer,0,4,0);bytes=buffer}finally{await handle.close()}
  if(bytes.subarray(0,4).equals(Buffer.from([27,76,117,97]))||bytes.subarray(0,3).equals(Buffer.from([27,76,74])))throw Error('Private bytecode signature in public output: '+path.relative(root,file));
  if(/\.(?:html|mjs|js|json|txt|md)$/i.test(file)){const text=await readFile(file,'utf8');if(/\"internalName\"\s*:/.test(text))throw Error('Internal roster name in public output: '+path.relative(root,file));if(/\bed\.ConditionX\b|\"SourceTable\"\s*:|\"SourceField\"\s*:/.test(text))throw Error('Internal engine metadata in public output: '+path.relative(root,file));if(citations.test(text))throw Error('Private source-path citation in public output: '+path.relative(root,file));}
 }));return files.length;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Public file guard passed: '+await assertPublicFiles()+' files.');
