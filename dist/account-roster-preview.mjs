{
 const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 const section=document.createElement('section');section.className='account-panel';const title=document.createElement('h2');title.textContent='My Tatari';const text=document.createElement('p');text.textContent='Set up your owned Tatari, stars, food and evolution tiers. Tatari level follows your account level.';const link=document.createElement('a');link.className='account-action';link.href=new URL('./my-tatari.html',import.meta.url);link.textContent='Set up owned Tatari';section.append(title,text,link);document.querySelector('#signed-in').append(section);
 if(local){const preview=section.cloneNode(true);preview.id='roster-local-entry';document.querySelector('#main').append(preview);const hint=document.createElement('p');hint.textContent='Local roster preview · browser storage only';preview.append(hint);
 const update=()=>{preview.hidden=!document.querySelector('#signed-in').hidden};new MutationObserver(update).observe(document.querySelector('#signed-in'),{attributes:true,attributeFilter:['hidden']});update();}
}
