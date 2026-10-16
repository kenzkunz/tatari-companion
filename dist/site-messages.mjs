if(!document.getElementById('callback-status')){
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./messages.css?v=sitewide1',import.meta.url);document.head.append(style);
 await import('./messages.mjs');
}
