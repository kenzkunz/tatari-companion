import {supabase,currentUser,accountUrl,login} from './auth-client.mjs';

const button=document.querySelector('.account-nav');
if(button){
  const dialog=document.createElement('dialog');
  dialog.className='navbar-login-dialog';
  dialog.setAttribute('aria-labelledby','navbar-login-title');
  dialog.innerHTML='<div class="modal-head"><h2 id="navbar-login-title">Sign in</h2><button class="login-dialog-close" type="button" aria-label="Close">×</button></div><div class="login-dialog-body"><p>Continue with Discord to access your account.</p><button class="discord-login-action" type="button"><img src="/assets/discord-login.svg" alt=""><span>Continue with Discord</span></button><p class="login-dialog-status" role="status" aria-live="polite"></p></div>';
  document.body.append(dialog);
  const closeButton=dialog.querySelector('.login-dialog-close');
  const discordButton=dialog.querySelector('.discord-login-action');
  const status=dialog.querySelector('.login-dialog-status');
  const paint=user=>{
    button.textContent=user?'Account':'Login';
    button.setAttribute('aria-label',user?'Open your account':'Continue with Discord');
    button.dataset.signedIn=String(!!user);
  };
  button.addEventListener('click',()=>{
    if(button.dataset.signedIn==='true'){location.assign(accountUrl);return;}
    status.textContent='';
    if(!dialog.open)dialog.showModal();
    discordButton.focus();
  });
  closeButton.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  discordButton.addEventListener('click',async()=>{
    discordButton.disabled=true;
    status.textContent='Opening Discord…';
    try{await login('discord');}
    catch(error){status.textContent=error?.message||'Discord sign-in could not be started.';discordButton.disabled=false;}
  });
  supabase.auth.onAuthStateChange((_event,session)=>paint(session?.user));
  currentUser().then(paint).catch(()=>paint(null));
}

import './uid-guard.mjs?v=switch1';

import './admin-entry.mjs';
