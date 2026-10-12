import {renderFormatted} from './content-format.mjs';
import {supabase} from './auth-client.mjs';
const blocks=[...document.querySelectorAll('[data-site-content]')];
if(blocks.length){
 const root=new URL('.',import.meta.url).pathname;
 const page=decodeURIComponent(location.pathname).slice(root.length).replace(/\/$/,'');
 const key=page.endsWith('.html')?page:page+'.html';
 try{const {data,error}=await supabase.rpc('published_site_content',{p_page:key});if(!error&&data&&typeof data==='object')for(const block of blocks){const text=data[block.dataset.siteContent];if(typeof text==='string')renderFormatted(block,text);}}catch{/* Original page content remains available if CMS is offline. */}
}
