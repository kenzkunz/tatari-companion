{
 const section=document.createElement('section');section.className='account-panel';const title=document.createElement('h2');title.textContent='My Tatari';const text=document.createElement('p');text.textContent='Set up your owned Tatari, stars, food and evolution tiers. Tatari level follows your account level.';const link=document.createElement('a');link.className='account-action';link.href=new URL('./my-tatari.html',import.meta.url);link.textContent='Set up owned Tatari';section.append(title,text,link);document.querySelector('#signed-in').append(section);
}
