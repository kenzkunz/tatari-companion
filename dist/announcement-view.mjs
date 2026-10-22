let stylesheetReady;
export function renderAnnouncement(values){
 if(!stylesheetReady)stylesheetReady=new Promise(resolve=>{const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./site-announcement.css?v=ticker3',import.meta.url).href;css.onload=resolve;css.onerror=resolve;document.head.append(css);});
 const bar=document.createElement('aside');bar.className='announcement';bar.setAttribute('aria-label','Site announcement');bar.hidden=values.visibility!=='Visible';
 const mark=document.createElement('span');mark.className='announcement-mark';mark.textContent=values.label;
 const copy=document.createElement('p');copy.className='announcement-copy';const title=document.createElement('strong');title.textContent=values.headline;const track=document.createElement('span');track.className='announcement-track';const content=document.createElement('span');content.className='announcement-text';content.append(title,document.createTextNode(values.message));track.append(content);copy.append(track);copy.tabIndex=0;copy.setAttribute('aria-label','Announcement text');bar.append(mark,copy);
 let animation,manualPaused=false,focusPaused=false,disposed=false;
 const control=document.createElement('button');control.type='button';control.className='announcement-motion';control.hidden=true;
 const syncPlayback=()=>{const paused=manualPaused||focusPaused;control.textContent=manualPaused?'Play':'Pause';control.setAttribute('aria-label',manualPaused?'Play announcement':'Pause announcement');control.setAttribute('aria-pressed',String(manualPaused));if(animation){paused?animation.pause():animation.play();bar.dataset.tickerState=paused?'paused':'running';}else bar.dataset.tickerState='static';};
 control.onclick=()=>{manualPaused=!manualPaused;syncPlayback();};bar.append(control);
 const measure=()=>{if(disposed||!bar.isConnected||!copy.clientWidth)return;animation?.cancel();animation=null;track.querySelector('[aria-hidden]')?.remove();const overflowing=content.scrollWidth>copy.clientWidth+1;copy.classList.toggle('is-overflowing',overflowing);control.hidden=!overflowing;if(overflowing){const repeat=content.cloneNode(true);repeat.setAttribute('aria-hidden','true');track.append(repeat);const distance=content.getBoundingClientRect().width+48;animation=track.animate([{transform:'translateX(0)'},{transform:`translateX(-${distance}px)`}],{duration:Math.max(10000,distance/45*1000),iterations:Infinity,easing:'linear'});}syncPlayback();};
 copy.addEventListener('focus',()=>{focusPaused=true;syncPlayback();});copy.addEventListener('blur',()=>{focusPaused=false;syncPlayback();});
 const observer=new ResizeObserver(measure);observer.observe(copy);observer.observe(content);stylesheetReady.then(measure);document.fonts?.ready.then(measure);
 bar.addEventListener('announcement-dismiss',()=>{disposed=true;observer.disconnect();animation?.cancel();});
 if(values.extraLabel&&values.extraUrl){try{const url=new URL(values.extraUrl);if(url.protocol==='https:'){const link=document.createElement('a');link.className='announcement-link';link.textContent=values.extraLabel;link.href=url.href;bar.append(link);}}catch{}}
 if(values.dismissible==='Yes'){const close=document.createElement('button');close.type='button';close.className='announcement-close';close.setAttribute('aria-label','Dismiss announcement');close.textContent='×';close.onclick=()=>{bar.hidden=true;bar.dispatchEvent(new Event('announcement-dismiss'));};bar.append(close);}
 return bar;
}
