const nav=document.getElementById('navigation'),menu=document.querySelector('.menu-toggle');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
const dropdowns=[...nav.querySelectorAll('details')];dropdowns.forEach(d=>d.addEventListener('toggle',()=>{if(d.open)dropdowns.forEach(other=>{if(other!==d)other.open=false;});}));
function closeMenus(){dropdowns.forEach(d=>d.open=false);nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}
document.addEventListener('click',event=>{if(!event.target.closest('.navbar'))closeMenus();});document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenus();});
document.getElementById('support')?.addEventListener('click',()=>location.assign('https://ko-fi.com/kenzkunz'));
