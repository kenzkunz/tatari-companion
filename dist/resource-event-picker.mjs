const select=document.getElementById('event'),tray=document.getElementById('event-tray');
const artwork={'Fishing Contest':'fishingcontest.png','Cozy Farm':'cozyfarm.png','Treasure Hunt':'treasurehunt.png','Raft Race':'raftrace.png','Zobo Shooter':'zoboshooter.png'};
for(const option of select.options){const button=document.createElement('button'),image=document.createElement('img'),label=document.createElement('span');button.type='button';button.dataset.event=option.value;image.src='/assets/'+artwork[option.value];image.alt='';label.textContent=option.value;button.append(image,label);button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change'));paint();};tray.append(button);}
function paint(){tray.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.event===select.value)));}
select.addEventListener('change',paint);paint();
