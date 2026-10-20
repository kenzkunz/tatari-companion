let styled=false;
export function renderAnnouncement(values){
 if(!styled){const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./site-announcement.css?v=scroll1',import.meta.url).href;document.head.append(css);styled=true;}
 const bar=document.createElement('aside');bar.className='announcement';bar.setAttribute('aria-label','Site announcement');bar.hidden=values.visibility!=='Visible';
 const mark=document.createElement('span');mark.className='announcement-mark';mark.textContent=values.label;
 const copy=document.createElement('p');copy.className='announcement-copy';const title=document.createElement('strong');title.textContent=values.headline;const track=document.createElement('span');track.className='announcement-track';track.append(title,document.createTextNode(values.message));copy.append(track);copy.tabIndex=0;copy.setAttribute('aria-label','Announcement text');bar.append(mark,copy);
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let animation,paused=false;
 const measure=()=>{animation?.cancel();animation=null;const distance=track.scrollWidth-copy.clientWidth;copy.classList.toggle('is-overflowing',distance>1);if(distance>1&&!motion.matches){animation=track.animate([{transform:'translateX(0)',offset:0},{transform:'translateX(0)',offset:.12},{transform:`translateX(-${distance}px)`,offset:.88},{transform:`translateX(-${distance}px)`,offset:1}],{duration:Math.max(10000,distance*45),iterations:Infinity,direction:'alternate',easing:'linear'});if(paused)animation.pause();}};
 const pause=()=>{paused=true;animation?.pause();};const resume=()=>{paused=bar.matches(':hover')||bar.contains(document.activeElement);if(!paused)animation?.play();};bar.addEventListener('mouseenter',pause);bar.addEventListener('mouseleave',resume);bar.addEventListener('focusin',pause);bar.addEventListener('focusout',()=>queueMicrotask(resume));
 const observer=new ResizeObserver(measure);observer.observe(copy);observer.observe(track);motion.addEventListener('change',measure);bar.addEventListener('announcement-dismiss',()=>{observer.disconnect();animation?.cancel();motion.removeEventListener('change',measure);});
 if(values.extraLabel&&values.extraUrl){try{const url=new URL(values.extraUrl);if(url.protocol==='https:'){const link=document.createElement('a');link.className='announcement-link';link.textContent=values.extraLabel;link.href=url.href;bar.append(link);}}catch{}}
 if(values.dismissible==='Yes'){const close=document.createElement('button');close.type='button';close.className='announcement-close';close.setAttribute('aria-label','Dismiss announcement');close.textContent='×';close.onclick=()=>{bar.hidden=true;bar.dispatchEvent(new Event('announcement-dismiss'));};bar.append(close);}
 return bar;
}
