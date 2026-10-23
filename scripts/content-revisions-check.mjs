import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {revisedContent} from '../dist/content-revisions-model.mjs';
const updates=JSON.parse(await readFile('dist/content-revisions.json','utf8')),digest=async text=>createHash('sha256').update(text).digest('hex');
for(const [page,blocks]of Object.entries(updates))for(const block of Object.keys(blocks)){const custom='A newer custom guide edit.';assert.equal(await revisedContent(updates,page,block,custom,digest),custom);assert.equal(await revisedContent(updates,page,block,null,digest),null);}
const old='Original note',next='Updated note',map={'example.html':{note:{[await digest(old)]:next}}};assert.equal(await revisedContent(map,'example.html','note',old,digest),next);assert.equal(await revisedContent(map,'other.html','note',old,digest),old);assert.equal(await revisedContent(map,'example.html','other',old,digest),old);assert.equal(await revisedContent(map,'example.html','note',next,digest),next);
console.log('Passed exact-note display updates, page/block isolation, new-edit preservation, null handling and repeat behavior.');
