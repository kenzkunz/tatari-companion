export function libraryPager(list,onChange){
 const nav=document.createElement('nav');nav.className='library-pagination';nav.setAttribute('aria-label','Result pages');list.after(nav);
 let page=1,lastKey='';
 return {reset(){page=1},items(records,key){if(key!==lastKey){page=1;lastKey=key}const pages=Math.max(1,Math.ceil(records.length/20));page=Math.min(page,pages);nav.replaceChildren();nav.hidden=records.length===0;
 const button=(text,target,disabled=false,current=false)=>{const b=document.createElement('button');b.type='button';b.className='btn secondary';b.textContent=text;b.disabled=disabled;if(current)b.setAttribute('aria-current','page');b.onclick=()=>{page=target;onChange();nav.querySelector('[aria-current=page]')?.focus({preventScroll:true});list.scrollIntoView({block:'start',behavior:'auto'})};nav.append(b)};
 button('Previous',page-1,page===1);const first=Math.max(1,Math.min(page-2,pages-4)),last=Math.min(pages,first+4);for(let i=first;i<=last;i++)button(String(i),i,false,i===page);button('Next',page+1,page===pages);
 return records.slice((page-1)*20,page*20)}};
}
