import {supabase} from './auth-client.mjs';
const root=new URL('.',import.meta.url);
export function bannerURL(path){return supabase.storage.from('guide-banners').getPublicUrl(path).data.publicUrl;}
export function applyBox(target,kind){if(!['info','disclaimer'].includes(kind))return;const box=target.closest('.guide-note');if(!box)return;box.classList.toggle('guide-disclaimer',kind==='disclaimer');const warning=[...box.children].find(n=>n.tagName==='IMG'&&n.getAttribute('src')?.includes('warning.png'));if(kind==='info')warning?.remove();else if(!warning){const img=box.ownerDocument.createElement('img');img.src=new URL('./guide-assets/warning.png',root).href;img.alt='';box.prepend(img);}}
export function applyBanner(doc,path){if(!path)return;const img=doc.querySelector('[data-site-banner]');if(img){img.src=bannerURL(path);img.removeAttribute('srcset');}}
