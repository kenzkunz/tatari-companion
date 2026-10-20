import {publishedData} from './site-data.mjs?v=announcement2';
import {renderAnnouncement} from './announcement-view.mjs?v=ticker1';
const header=document.querySelector('header:has(.navbar),header.navbar')??document.querySelector('.navbar')?.closest('header');
if(header&&!document.body.classList.contains('admin-app')){
 const record=await publishedData('announcement');
 if(record&&record.values.visibility==='Visible'){
  const key='site-announcement:'+JSON.stringify(record.values);let dismissed=false;try{dismissed=localStorage.getItem(key)==='dismissed';}catch{}
  if(!dismissed){const bar=renderAnnouncement(record.values);bar.addEventListener('announcement-dismiss',()=>{try{localStorage.setItem(key,'dismissed');}catch{}header.querySelector('a,button')?.focus();});header.after(bar);}
 }
}
