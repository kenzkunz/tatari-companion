import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {webcrypto,createHash} from 'node:crypto';
const template=await readFile('dist/image-cache-worker.js','utf8');
const data=new TextEncoder().encode('test-image');
const asset={hash:createHash('sha256').update(data).digest('hex'),bytes:data.length};
const root='https://example.test/tatari-companion/';
function setup({manifest={'assets/a.webp':asset,'assets/b.webp':asset},limit=1000,failCache=false,badBody=false}={}){
 const handlers={},stores=new Map();let network=0,offline=false;
 const caches={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async name=>{
  if(failCache)throw Error('Storage denied');if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);
  return {keys:async()=>[...store.keys()].map(k=>new Request(k)),match:async key=>store.get(typeof key==='string'?key:key.url)?.clone(),put:async(key,r)=>{store.set(typeof key==='string'?key:key.url,r.clone())},delete:async key=>store.delete(typeof key==='string'?key:key.url)};
 }};
 const context=vm.createContext({URL,Request,Response,Headers,Uint8Array,crypto:webcrypto,caches,encodeURIComponent,fetch:async request=>{network++;assert(new URL(request.url).searchParams.has('__image_rev'));if(offline)throw Error('Offline');return new Response(badBody?'wrong':data,{headers:{'content-type':'image/webp'}})},self:{location:{href:root+'image-cache-worker.js'},skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(name,handler)=>handlers[name]=handler}});
 vm.runInContext(template.replace('/* IMAGE_ASSETS */{}',JSON.stringify(manifest)).replace('MAX_ENTRIES=1000','MAX_ENTRIES='+limit),context);
 return {stores,caches,offline:()=>{offline=true},network:()=>network,dispatch:async(path,options)=>{let response;const waits=[];handlers.fetch({request:new Request(new URL(path,root),options),waitUntil:p=>waits.push(p),respondWith:p=>response=p});if(!response)return null;const result=await response;await Promise.all(waits);return result;},activate:async()=>{let p;handlers.activate({waitUntil:value=>p=value});await p;}};
}
let env=setup();assert.equal(await (await env.dispatch('assets/a.webp')).text(),'test-image');assert.equal(env.network(),1);env.offline();assert.equal(await (await env.dispatch('assets/a.webp')).text(),'test-image');assert.equal(env.network(),1,'Cache hit needs no network');
for(const path of ['account.html','data.json','constructor','https://example.test/other/assets/a.webp','https://outside.test/assets/a.webp'])assert.equal(await env.dispatch(path),null,'Unlisted/private/out-of-scope resources bypass cache');
assert.equal(await env.dispatch('assets/a.webp',{headers:{Range:'bytes=0-1'}}),null);
assert.equal(await env.dispatch('assets/a.webp',{method:'POST'}),null);
env=setup({failCache:true});assert.equal(await(await env.dispatch('assets/a.webp')).text(),'test-image','Storage failure leaves network available');
env=setup({badBody:true});await env.dispatch('assets/a.webp');assert.equal([...env.stores.values()][0].size,0,'Incorrect content cannot poison cache');
env=setup({limit:1});await env.dispatch('assets/a.webp');await env.dispatch('assets/b.webp');assert.equal([...env.stores.values()][0].size,1,'Entry bound enforced');
const store=[...env.stores.values()][0];store.set(root+'assets/a.webp?__image_rev=old',new Response('old'));await env.activate();assert(!store.has(root+'assets/a.webp?__image_rev=old'),'Stale artwork removed');
console.log('Image cache passed: offline hits, content hash checks, eviction, stale artwork cleanup, scope, private-data bypass, ranges and storage failure fallback.');
