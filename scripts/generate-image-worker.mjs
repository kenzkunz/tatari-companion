import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
export async function generateImageWorker(out){
 const assets={};
 async function walk(dir){for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=join(dir,e.name);if(e.isDirectory())await walk(file);else if(/\.(png|webp|jpe?g|gif|svg|avif)$/i.test(e.name)){const data=await readFile(file);assets[relative(out,file).replaceAll('\\','/')]={hash:createHash('sha256').update(data).digest('hex'),bytes:data.byteLength};}}}
 await walk(out);
 const file=join(out,'image-cache-worker.js'),source=await readFile(file,'utf8');
 await writeFile(file,source.replace('/* IMAGE_ASSETS */{}',JSON.stringify(assets)));
}
