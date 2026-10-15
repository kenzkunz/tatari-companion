/* Build injects hashes of public artwork. No HTML, scripts, JSON, or account data is cached. */
const ASSETS=/* IMAGE_ASSETS */{};
const ROOT=new URL('./',self.location.href);
const PREFIX='tatari-images-'+encodeURIComponent(ROOT.pathname)+'-';
const CACHE=PREFIX+'v1';
const MAX_BYTES=128*1024*1024,MAX_ENTRIES=1000,MAX_FILE=8*1024*1024;
let writes=Promise.resolve();
function assetFor(request){
 if(request.method!=='GET'||request.headers.has('range'))return null;
 const url=new URL(request.url);
 if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return null;
 const path=decodeURI(url.pathname.slice(ROOT.pathname.length)),asset=Object.hasOwn(ASSETS,path)?ASSETS[path]:null;
 if(!asset||asset.bytes>MAX_FILE)return null;
 const key=new URL(path,ROOT);key.searchParams.set('__image_rev',asset.hash);
 return {...asset,path,key:key.href};
}
let inventory;
async function prune(cache){
 if(!inventory){
  inventory=new Map();
  for(const key of await cache.keys()){
   const asset=assetFor(key);
   if(!asset||key.url!==asset.key){await cache.delete(key);continue;}
   inventory.set(key.url,asset.bytes);
  }
 }
 let total=[...inventory.values()].reduce((sum,n)=>sum+n,0);
 while(inventory.size&&(total>MAX_BYTES||inventory.size>MAX_ENTRIES)){
  const [key,bytes]=inventory.entries().next().value;await cache.delete(key);inventory.delete(key);total-=bytes;
 }
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 try{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);inventory=null;await prune(await caches.open(CACHE));}catch{}
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 let asset;try{asset=assetFor(event.request);}catch{return;}if(!asset)return;
 // Attach persistence during dispatch, so even a quick response keeps its background write alive.
 let finish;const settled=new Promise(resolve=>{finish=resolve});event.waitUntil(settled);
 event.respondWith((async()=>{
  let cache;try{cache=await caches.open(CACHE);const cached=await cache.match(asset.key);if(cached){finish();return cached;}}catch{}
  try{
   // Fingerprinted network URL avoids stale artwork from an older ordinary HTTP cache entry.
   const response=await fetch(new Request(asset.key,event.request));
   if(!cache||!response.ok||response.type==='opaque'){finish();return response;}
   const copy=response.clone();
   writes=writes.catch(()=>{}).then(async()=>{
    try{
     const data=await copy.arrayBuffer();if(data.byteLength!==asset.bytes)return;
     const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');
     if(hash!==asset.hash)return;
     const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');
     await prune(cache);await cache.put(asset.key,new Response(data,{status:response.status,statusText:response.statusText,headers}));inventory.delete(asset.key);inventory.set(asset.key,asset.bytes);await prune(cache);
    }catch{/* Quota/private-mode failures leave normal network loading available. */}
   });
   writes.finally(finish);return response;
  }catch(error){finish();throw error;}
 })());
});
