import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {assertPublicFiles} from './public-files-check.mjs';
const root=await mkdtemp(path.join(tmpdir(),'companion-public-files-'));
try{
 await writeFile(path.join(root,'safe.json'),'{"coins":4477}');assert.equal(await assertPublicFiles(root),1);
 const examples=[['private.lua','return {}'],['private.luac','bytes'],['private.apk','bytes'],['image.png',Buffer.from([27,76,117,97])],['image.webp',Buffer.from([27,76,74,2])],['data.json','{"note":"Heroes/Rabbit.luac"}']];
 for(const [name,content]of examples){const file=path.join(root,name);await writeFile(file,content);await assert.rejects(assertPublicFiles(root));await rm(file);}
 console.log('Public file guard tests passed: package/source extensions, disguised bytecode, path citations and safe JSON.');
}finally{await rm(root,{recursive:true,force:true})}
