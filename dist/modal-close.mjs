const closeSelector='button[aria-label^="Close" i],button.modal-close,button.dialog-close,button.share-close-icon,button[id^="close"],button[id$="-close"]';
function standardize(dialog){
 if(dialog.querySelector('.standard-modal-close'))return;
 let close=dialog.querySelector(closeSelector)||[...dialog.querySelectorAll('button')].find(b=>['Close','×','✕'].includes(b.textContent.trim()));
 let header=dialog.querySelector('.modal-head,.trade-dialog-heading,.badge-dialog-heading');
 if(!header){const heading=dialog.querySelector(':scope > h1,:scope > h2,:scope > h3');header=document.createElement('div');header.className='standard-modal-header';if(heading){heading.before(header);header.append(heading)}else dialog.prepend(header)}
 if(!close){close=document.createElement('button');close.type='button';close.onclick=()=>dialog.close()}
 close.classList.add('standard-modal-close');close.setAttribute('aria-label','Close dialog');close.replaceChildren(document.createTextNode('×'));header.classList.add('standard-modal-header');header.append(close);
}
function scan(){document.querySelectorAll('dialog').forEach(standardize)}
scan();let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan()})}).observe(document.body,{childList:true,subtree:true});
