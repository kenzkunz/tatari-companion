import {publishedData} from './site-data.mjs?v=site-data5';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderFooter(target,v){
 const link=(name,url)=>{const a=el('a',name),u=new URL(url);if(u.protocol!=='https:')throw Error('Invalid footer link');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';return a;};
 const disclaimer=el('p',v.disclaimer);disclaimer.append(el('br'),'For more information see ',link(v.privacyLabel,v.privacyUrl),' and ',link(v.termsLabel,v.termsUrl),'.');
 const credits=el('p',v.credits);credits.append(el('br'),v.thanks);
 const contact=el('p'),contactLink=link(v.contactLabel,v.contactUrl);contactLink.className='footer-issue discord-contact';contact.append(contactLink);
 const children=[el('h2',v.title),disclaimer,credits,contact];
 if(v.extraLabel&&v.extraUrl){const extra=el('p');extra.append(link(v.extraLabel,v.extraUrl));children.push(extra);}
 const updated=el('p','Last Update '),time=el('time',new Intl.DateTimeFormat('en-GB',{timeZone:'UTC'}).format(new Date(v.lastUpdate+'T00:00:00Z')));time.dateTime=v.lastUpdate;updated.className='last-update';updated.append(time,'.');children.push(updated);target.replaceChildren(...children);
}
if(document.querySelector('.site-footer .footer-copy')){const record=await publishedData('footer');if(record)try{renderFooter(document.querySelector('.site-footer .footer-copy'),record.values)}catch{}}
