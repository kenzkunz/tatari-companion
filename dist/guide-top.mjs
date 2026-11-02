const guide=document.querySelector('.guide-shell');
if(guide&&!document.querySelector('.guide-top')){
 const button=document.createElement('button');
 button.type='button';button.className='guide-top';button.hidden=true;
 button.setAttribute('aria-label','Back to top');button.title='Back to top';
 const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='↑';
 button.append(arrow,document.createTextNode('Top'));guide.append(button);
 const update=()=>{button.hidden=window.scrollY<Math.max(320,window.innerHeight*.75);};
 window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
 button.addEventListener('click',()=>{
  if(!guide.hasAttribute('tabindex'))guide.tabIndex=-1;
  guide.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 });
}
