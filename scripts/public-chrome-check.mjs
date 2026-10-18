import assert from 'node:assert/strict';
import {auditChrome,chrome} from './shared-chrome.mjs';
import {readFile} from 'node:fs/promises';
const shared=await chrome(),rows=await auditChrome();
for(const r of rows)if(!r.exception){assert(r.navbar,r.page+' navbar mismatch');assert(r.footer,r.page+' footer mismatch');const text=await readFile('dist/'+r.page,'utf8');assert(text.includes('/public-navbar.css'),r.page+' missing navbar styles');assert(text.includes('/footer.css'),r.page+' missing footer styles');}
const nav=shared.navbar.match(/<nav\b[\s\S]*?<\/nav>/)[0],links=[...nav.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(links).size,links.length,'Duplicate navbar link');
assert(links.includes('/events/island-goldrush.html'));assert(links.includes('/events/sparkly-spa.html'));
console.log('Passed exact shared navbar/footer and required styles on '+rows.filter(r=>!r.exception).length+' public pages.');

const pageLayout=await readFile("dist/page-layout.css","utf8"),footerStyle=await readFile("dist/footer.css","utf8");
assert(!pageLayout.includes(".footer-inner"),"General page layout must not override the shared footer");
assert(footerStyle.includes(".site-footer>.footer-inner{width:100%;max-width:1800px"),"Shared footer must own container width independent of stylesheet order");
