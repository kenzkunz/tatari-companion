import {displayContent} from './content-revisions.mjs?v=1';
import {applyBox,applyBanner} from './guide-media.mjs';
import {renderFormatted} from './content-format.mjs';
import {supabase} from './auth-client.mjs';
const blocks=[...document.querySelectorAll('[data-site-content]')];
if(blocks.length){
 const root=new URL('.',import.meta.url).pathname;
 const page=decodeURIComponent(location.pathname).slice(root.length).replace(/\/$/,'');
 const key=page.endsWith('.html')?page:page+'.html';
 try{const {data,error}=await supabase.rpc('published_site_content',{p_page:key});if(!error&&data&&typeof data==='object')for(const block of blocks){const text=data[block.dataset.siteContent];if(typeof text==='string')renderFormatted(block,await displayContent(key,block.dataset.siteContent,text));}}catch{}
 try{const {data,error}=await supabase.rpc('public_guide_media',{p_page:key});if(!error&&data){applyBanner(document,data.banner);for(const [id,kind] of Object.entries(data.boxes??{})){const target=blocks.find(b=>b.dataset.siteContent===id);if(target)applyBox(target,kind);}}}catch{/* Static GitHub content remains usable when the CMS is unavailable. */}
}
