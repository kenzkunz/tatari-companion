import {supabase,currentUser,accountUrl} from './auth-client.mjs';
const button=document.querySelector('.account-nav');
if(button){button.addEventListener('click',()=>location.assign(accountUrl));const paint=user=>{button.textContent=user?'Account':'Login';button.setAttribute('aria-label',user?'Open your account':'Log in');};supabase.auth.onAuthStateChange((_event,session)=>paint(session?.user));currentUser().then(paint).catch(()=>paint(null));}
