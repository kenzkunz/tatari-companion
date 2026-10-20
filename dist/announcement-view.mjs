let styled=false;
export function renderAnnouncement(values){
 if(!styled){const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./site-announcement.css',import.meta.url).href;document.head.append(css);styled=true;}
 const bar=document.createElement('aside');bar.className='announcement';bar.setAttribute('aria-label','Site announcement');bar.hidden=values.visibility!=='Visible';
 const mark=document.createElement('span');mark.className='announcement-mark';mark.textContent=values.label;
 const copy=document.createElement('p');copy.className='announcement-copy';const title=document.createElement('strong');title.textContent=values.headline;copy.append(title,document.createTextNode(values.message));bar.append(mark,copy);
 if(values.extraLabel&&values.extraUrl){try{const url=new URL(values.extraUrl);if(url.protocol==='https:'){const link=document.createElement('a');link.className='announcement-link';link.textContent=values.extraLabel;link.href=url.href;bar.append(link);}}catch{}}
 if(values.dismissible==='Yes'){const close=document.createElement('button');close.type='button';close.className='announcement-close';close.setAttribute('aria-label','Dismiss announcement');close.textContent='×';close.onclick=()=>{bar.hidden=true;bar.dispatchEvent(new Event('announcement-dismiss'));};bar.append(close);}
 return bar;
}
