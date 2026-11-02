import {loadAppData} from '/site-data.mjs?v=site-data5';
import {DAY,regularAt,pvpAt,hordeAt,dayEvents} from '/schedule-model.mjs';

const byId=id=>document.getElementById(id);
const definitions={
  'Cozy Farm':{short:'Farm',icon:'cozyfarm.png',guide:'cozy-farm'},
  'Fishing Contest':{short:'Fishing',icon:'fishingcontest.png',guide:'fishing'},
  'Treasure Hunt':{short:'Treasure',icon:'treasurehunt.png',guide:'treasure-hunt'},
  'Raft Race':{short:'Raft',icon:'raftrace.png',guide:'raft-race'},
  'Zobo Shooter':{short:'Zobo',icon:'zoboshooter.png',guide:'zobo-shooter'},
  'Gold Rush #1':{short:'GR#1',icon:'goldrush.png',guide:null},
  'Gold Rush #2':{short:'GR#2',icon:'goldrush.png',guide:null},
  'Gold Rush #3':{short:'GR#3',icon:'goldrush.png',guide:null},
  'Dune Rush':{short:'Dune',icon:'goldrush.png',guide:null},
  'Horde Invasion':{short:'Horde',icon:'hordes2.png',guide:'horde'}
};
const filterNames=Object.keys(definitions).filter(name=>name!=='Horde Invasion');
const checked=new Set(filterNames);
const utcDay=()=>Math.floor(Date.now()/DAY)*DAY;
const dateText=ms=>new Intl.DateTimeFormat('en',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(ms);
let data,monthOffset=0,selectedDate=utcDay(),renderedDay=utcDay(),feedSignature='';

function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function markEvent(node,name){node.dataset.event=name;return node;}
function picture(name){const image=el('img');image.src='/assets/'+definitions[name].icon;image.alt='';image.width=38;image.height=38;return image;}
function countdown(end){const seconds=Math.max(0,Math.floor((end-Date.now())/1000));if(seconds>=DAY/1000){const hours=Math.floor(seconds/3600);return `${Math.floor(hours/24)}d ${hours%24}h`;}return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');}
function feed(){
  const now=Date.now(),regular=regularAt(now,data.events.regular),nextRegular=regularAt(regular.end,data.events.regular),pvp=pvpAt(now,data.events.pvp),nextPvp=pvpAt(pvp.end,data.events.pvp),horde=hordeAt(now,data.horde);
  const live=[{name:regular.name,phase:`Day ${regular.day} of ${data.events.regular.duration_days}`,start:regular.start,end:regular.end,label:'Ends in'}];
  const upcoming=[{name:nextRegular.name,phase:'Next rotating event',end:nextRegular.start,label:'Starts in'}];
  if(horde.live)live.push({name:'Horde Invasion',phase:'Invasion active',end:Math.round(horde.end),label:'Ends in'});
  else upcoming.push({name:'Horde Invasion',phase:'Settlement in progress',end:Math.round(horde.end),label:'Starts in'});
  if(pvp.registration)upcoming.push({name:pvp.name,phase:'Registration open',end:pvp.start,label:'Starts in'});
  else{
    live.push({name:pvp.name,phase:`Day ${pvp.day} of ${data.events.pvp.duration_days}`,start:pvp.start,end:pvp.end,label:'Ends in'});
    upcoming.push({name:nextPvp.name,phase:'Registration opens next',end:nextPvp.registrationDate,label:'Opens in'});
  }
  live.sort((a,b)=>a.end-b.end);upcoming.sort((a,b)=>a.end-b.end);
  return {live,upcoming};
}
function renderFeed(){
  const groups=feed();
  const list=byId('event-list');list.replaceChildren();
  for(const [section,title] of [['live','Live now'],['upcoming','Coming up']]){
    const group=el('section','event-group');
    group.setAttribute('aria-label',title);
    const heading=el('h3','event-group-title',title);
    heading.append(el('span','',groups[section].length));group.append(heading);
    for(const event of groups[section]){
    const guide=definitions[event.name].guide;
    const link=markEvent(el(guide?'a':'article','event-row'),event.name);
    if(guide)link.href='/events/'+guide+'.html';
    link.setAttribute('aria-label',`${event.name}: ${event.phase}.`+(guide?' Open guide.':''));
    const content=el('div','event-row-content');content.append(el('strong','event-row-title',event.name));
    const phase=el('span','event-phase');if(section==='live')phase.append(el('i','live-dot'));phase.append(document.createTextNode(event.phase));content.append(phase);
    const time=el('div','event-countdown');const value=el('strong','',countdown(event.end));value.dataset.end=event.end;time.append(el('span','',event.label),value);
    link.append(picture(event.name),content,time);
    if(event.start){const progress=el('div','event-progress'),fill=el('i');fill.style.width=Math.min(100,Math.max(0,(Date.now()-event.start)/(event.end-event.start)*100))+'%';progress.append(fill);link.append(progress);}
    group.append(link);
    }
    if(!groups[section].length)group.append(el('p','empty-events','No events right now.'));
    list.append(group);
  }
  if(!list.childElementCount)list.append(el('p','empty-events','No events in this view.'));
  feedSignature=JSON.stringify(groups);
}
function eventsAt(ms){return dayEvents(ms,data).filter(event=>checked.has(event.fullName||event.name));}
function renderDetail(){
  byId('selected-date').textContent=dateText(selectedDate);
  byId('selected-status').textContent=selectedDate===utcDay()?'Today':'';
  const target=byId('selected-events');target.replaceChildren();
  for(const event of eventsAt(selectedDate)){
    const name=event.fullName||event.name,row=markEvent(el('div','selected-event'),name),text=el('div','selected-event-text'),heading=el('div','selected-event-heading');
    heading.append(el('strong','',name));
    if(definitions[name].guide){const guide=el('a','','Guide');guide.href='/events/'+definitions[name].guide+'.html';guide.setAttribute('aria-label',`${name} guide`);heading.append(guide);}
    text.append(heading,el('p','',event.registration?'Registration day':`Day ${event.day||Number(event.label.match(/D(\d+)/)?.[1])}`));
    row.append(picture(name),text);target.append(row);
  }
  if(!target.childElementCount)target.append(el('p','empty-events','No events match your selected filters.'));
}
function renderCalendar(){
  const today=new Date(),first=Date.UTC(today.getUTCFullYear(),today.getUTCMonth()+monthOffset,1),month=new Date(first),days=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate(),offset=(month.getUTCDay()+6)%7;
  byId('month-title').textContent=new Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(first);
  byId('previous-month').disabled=monthOffset===0;byId('next-month').disabled=monthOffset===2;
  const grid=byId('calendar-grid');grid.replaceChildren();
  for(let i=0;i<offset;i++){const blank=el('div','day-blank');blank.setAttribute('aria-hidden','true');grid.append(blank);}
  for(let day=1;day<=days;day++){
    const ms=Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),day),events=eventsAt(ms),button=el('button','calendar-day'+(ms===utcDay()?' today':''));
    button.type='button';button.dataset.date=String(ms);button.setAttribute('aria-pressed',String(ms===selectedDate));
    button.setAttribute('aria-label',dateText(ms)+': '+(events.length?events.map(event=>(event.fullName||event.name)+(event.registration?' registration':'')).join(', '):'No selected events'));
    if(ms===utcDay())button.setAttribute('aria-current','date');
    button.append(el('span','day-number',day));
    for(const event of events){const name=event.fullName||event.name,definition=definitions[name],badge=markEvent(el('span','day-event'+(event.fullName?' pvp':'')),name);badge.append(picture(name),el('span','',definition.short),el('b','',event.registration?'Reg':'D'+(event.day||event.label.match(/D(\d+)/)?.[1])));button.append(badge);}
    button.addEventListener('click',()=>{selectedDate=ms;for(const cell of grid.querySelectorAll('[data-date]'))cell.setAttribute('aria-pressed',String(Number(cell.dataset.date)===ms));renderDetail();});grid.append(button);
  }
  const remaining=(7-(offset+days)%7)%7;for(let i=0;i<remaining;i++){const blank=el('div','day-blank');blank.setAttribute('aria-hidden','true');grid.append(blank);}
  renderDetail();
}
function selectMonth(delta){monthOffset=Math.max(0,Math.min(2,monthOffset+delta));const date=new Date();selectedDate=monthOffset===0?utcDay():Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+monthOffset,1);if(data)renderCalendar();}
function updateFilterCount(){byId('filter-count').textContent=checked.size===filterNames.length?'All':checked.size;}
for(const name of filterNames){const label=markEvent(el('label'),name),checkbox=el('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.dataset.event=name;checkbox.addEventListener('change',()=>{checkbox.checked?checked.add(name):checked.delete(name);updateFilterCount();if(data)renderCalendar();});label.append(checkbox,document.createTextNode(name));byId('event-filters').append(label);}
byId('show-all').addEventListener('click',()=>{for(const checkbox of byId('event-filters').querySelectorAll('input')){checkbox.checked=true;checked.add(checkbox.dataset.event);}updateFilterCount();if(data)renderCalendar();});
byId('previous-month').addEventListener('click',()=>selectMonth(-1));byId('next-month').addEventListener('click',()=>selectMonth(1));
byId('today-button').addEventListener('click',()=>{monthOffset=0;selectedDate=utcDay();if(data)renderCalendar();});
document.addEventListener('click',event=>{const filters=document.querySelector('.calendar-filters');if(!filters.contains(event.target))filters.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelector('.calendar-filters').open=false;});
let swipeStart;const surface=document.querySelector('.calendar-body');surface.addEventListener('touchstart',event=>{swipeStart=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});surface.addEventListener('touchend',event=>{if(!swipeStart||!event.changedTouches.length)return;const dx=event.changedTouches[0].clientX-swipeStart.x,dy=event.changedTouches[0].clientY-swipeStart.y;swipeStart=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)selectMonth(dx<0?1:-1);},{passive:true});surface.addEventListener('touchcancel',()=>swipeStart=null,{passive:true});
function tick(){byId('reset-timer').textContent=countdown(utcDay()+DAY);for(const timer of document.querySelectorAll('[data-end]'))timer.textContent=countdown(Number(timer.dataset.end));if(data){const day=utcDay();if(day!==renderedDay){renderedDay=day;monthOffset=0;selectedDate=day;renderCalendar();}if(feedSignature!==JSON.stringify(feed()))renderFeed();}byId('today-label').textContent=new Intl.DateTimeFormat('en',{day:'numeric',month:'short',timeZone:'UTC'}).format(Date.now());}
tick();setInterval(tick,1000);
try{data=await loadAppData();renderFeed();renderCalendar();}catch{const retry=el('button','','Retry');retry.type='button';retry.addEventListener('click',()=>location.reload());const error=el('p','empty-events','Schedule data could not load. ');error.setAttribute('role','alert');error.append(retry);byId('event-list').replaceChildren(error);}
