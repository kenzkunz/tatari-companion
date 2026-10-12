import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {chrome,normalizeChrome} from './shared-chrome.mjs';
const {navbar:header,footer}=await chrome();
let count=0;
for(const folder of ['dist/events','dist/information']){
 let names;try{names=await readdir(folder);}catch(e){if(e.code==='ENOENT')continue;throw e;}
 for(const name of names.filter(n=>n.endsWith('.html'))){const text=await readFile(folder+'/'+name,'utf8');if(!text.includes('public-info-page'))continue;count++;
  assert(normalizeChrome(text).includes(normalizeChrome(header)),name+' has stale or missing navbar');assert(text.includes(footer),name+' has stale or missing footer');
  for(const file of ['home.css','footer.css','guides.css','information-template.css','navigation.mjs'])assert(text.includes('/'+file),name+' missing '+file);
  assert(text.includes('class="guide-paper"'));assert(text.includes('class="guide-index"'));assert(text.includes('data-site-banner'));
  const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,name+' duplicated element ID');
  const blocks=[...text.matchAll(/data-site-content="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(blocks).size,blocks.length,name+' duplicated content block');
 }
}
assert(count>0);console.log('Passed shared chrome, required styles, template structure and stable block IDs for '+count+' template pages.');
