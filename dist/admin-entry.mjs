import {supabase,currentUser} from './auth-client.mjs';
const root=new URL('.',import.meta.url);
async function refresh(){document.querySelectorAll('[data-admin-entry]').forEach(n=>n.remove());if(!await currentUser())return;const {data,error}=await supabase.rpc('is_site_admin');if(error||data!==true)return;const host=document.querySelector('#signed-in');if(!host)return;const a=document.createElement('a');a.dataset.adminEntry='true';a.href=new URL('./admin.html',root).href;a.textContent='Open admin dashboard';a.className='gold-button';host.prepend(a);}
supabase.auth.onAuthStateChange(()=>setTimeout(()=>refresh().catch(()=>{}),0));refresh().catch(()=>{});
