import {renderAnnouncement} from './announcement-view.mjs?v=ticker3';
const values={"visibility":"Visible","label":"SITE NOTICE","headline":"Website closure","message":"Due to affiliated creator copying my website, this website will no longer active and will be shut down completely on December 2026. Thanks for everyone supports thus far. Contact me on Discord : kenzkunz for any inquiries.","extraLabel":"","extraUrl":"","dismissible":"Yes"};
const header=document.querySelector('header:has(.navbar),header.navbar')??document.querySelector('.navbar')?.closest('header');
if(header&&!document.body.classList.contains('admin-app')){
 if(values.visibility==='Visible'){
  const key='site-announcement:'+JSON.stringify(values);let dismissed=false;try{dismissed=localStorage.getItem(key)==='dismissed';}catch{}
  if(!dismissed){const bar=renderAnnouncement(values);bar.addEventListener('announcement-dismiss',()=>{try{localStorage.setItem(key,'dismissed');}catch{}header.querySelector('a,button')?.focus();});header.after(bar);}
 }
}
