// Register only on supported secure origins. Cache failure must never block the site.
if ('serviceWorker' in navigator && window.isSecureContext) {
 const register=()=>navigator.serviceWorker.register(new URL('./image-cache-worker.js',import.meta.url),{scope:new URL('./',import.meta.url).pathname,updateViaCache:'none'}).catch(()=>{});
 if(document.readyState==='complete')void register();
 else window.addEventListener('load',register,{once:true});
}
