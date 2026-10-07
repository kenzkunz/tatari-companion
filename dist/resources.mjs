import './navigation.mjs';
import {PAYOUTS,UNLOCKS,unlocked} from './engine.mjs';
const $=id=>document.getElementById(id),fmt=n=>Math.round(n).toLocaleString('en-US');
const worker=new Worker('/worker.mjs',{type:'module'}),pending=new Map();let counter=0,revision=0,data,mode='have',multiplier=60,refire=true,gold=true,delay;
const eventIcons={'Fishing Contest':'fishingcontest.png','Cozy Farm':'cozyfarm.png','Treasure Hunt':'treasurehunt.png','Raft Race':'raftrace.png','Zobo Shooter':'zoboshooter.png'};
const resourceNames={rods:'Fishing Rods',fertilizer:'Magic Fertilizer',pickaxes:'Iron Pickaxes',raft:'Rafts',zobo:'Bullet Coins',energy_drinks:'Energy Drinks',pinballs:'Pinballs Earned',candy:'Candy',catch_tatari:'Capsule / Catch Tatari',blue_card_packs:'Blue Card Packs',boost_x2_minutes:'×2 Boost',jackpot:'Star Hits',card_hole:'Card Hole hits'};
const resourceIcons={rods:'fishrod.png',fertilizer:'cozyfarm.png',pickaxes:'treasurehunt.png',raft:'raftrace.png',zobo:'zoboshooter.png',energy_drinks:'cans.png',pinballs:'pb.png',candy:'candy.png',catch_tatari:'catch.png',blue_card_packs:'bluecard.png',boost_x2_minutes:'x2.png',jackpot:'jackpot.png',card_hole:'cards.png'};
worker.onmessage=({data:message})=>{const p=pending.get(message.id);if(!p)return;pending.delete(message.id);message.error?p.reject(Error(message.error)):p.resolve(message.result);};
worker.onerror=()=>{pending.forEach(p=>p.reject(Error('Could not finish the estimate. Please reload and try again.')));pending.clear();};
function calculate(kind,input){return new Promise((resolve,reject)=>{const id=++counter;pending.set(id,{resolve,reject});worker.postMessage({id,kind,input,party:data.party});});}
function amount(){const value=$('amount').value.trim();if(!/^\d[\d,]*$/.test(value))throw Error('Enter a whole number from 1 to 10,000,000.');const n=Number(value.replaceAll(',',''));if(!Number.isInteger(n)||n<1||n>10000000)throw Error('Enter a whole number from 1 to 10,000,000.');return n;}
function options(){let n;try{n=amount();}catch{n=0;}const available=unlocked(n);if(!available.includes(multiplier))multiplier=1;$('multipliers').replaceChildren(...Object.keys(UNLOCKS).map(value=>{const m=Number(value),b=document.createElement('button');b.type='button';b.textContent='×'+m;b.disabled=!available.includes(m);b.setAttribute('aria-pressed',String(m===multiplier));b.setAttribute('aria-label','Multiplier '+m);b.title=b.disabled?'Requires '+fmt(UNLOCKS[m])+' Pinballs':'Use ×'+m;b.onclick=()=>{multiplier=m;options();schedule();};return b;}));}
function row(key,q,activity=false){const box=document.createElement('div');box.className='reward-row'+(activity?' activity-first':'');box.title=resourceNames[key];const img=document.createElement('img');img.src='/assets/'+resourceIcons[key];img.alt=resourceNames[key];const value=document.createElement('strong');const lo=key==='jackpot'||key==='card_hole'?q.low50:q.low,hi=key==='jackpot'||key==='card_hole'?q.high50:q.high;value.textContent=(lo===hi?fmt(lo):fmt(lo)+' – '+fmt(hi))+(key==='boost_x2_minutes'?' min':'');const label=document.createElement('span');label.className='reward-label';label.textContent=resourceNames[key];value.append(label);box.append(img,value);return box;}
function schedule(){revision++;clearTimeout(delay);$('rewards').replaceChildren();$('estimate-note').textContent='';$('rewards').setAttribute('aria-busy','true');$('calc-status').textContent='Updating estimate…';delay=setTimeout(run,250);}
function rewardRows(result,event,partyIncluded=true){const values=partyIncluded?result.haul:result.machine;return [PAYOUTS[event][0],'energy_drinks','pinballs','candy','catch_tatari','blue_card_packs','boost_x2_minutes'].map(key=>row(key,values[key]??{low:0,high:0})).concat(row('jackpot',result.jackpot,true),row('card_hole',result.card_hole));}
async function run(){
 const version=revision;if(!data)return;
 try{
  const n=amount(),event=$('event').value;$('rewards').replaceChildren();$('calc-status').textContent=mode==='have'?'Estimating rewards…':'Estimating starting Pinballs…';
  if(mode==='have'){
   const result=await calculate('forward',{amount:n,event,gold,multiplier,refire});if(version!==revision)return;
   $('rewards').replaceChildren(...rewardRows(result,event));$('calc-status').textContent='×'+multiplier+' · starts at zero Party progress.';
  }else{
   const includeParty=refire,result=await calculate('reverse',{target:n,event,party:includeParty});if(version!==revision)return;
   const starting=row('pinballs',result);starting.title='Pinballs Needed';starting.querySelector('img').alt='Pinballs Needed';starting.querySelector('.reward-label').textContent='Pinballs Needed';starting.classList.add('starting-estimate');$('rewards').append(starting);
   const heading=document.createElement('h2');heading.className='preview-heading';heading.textContent='Rewards';
   const typical=document.createElement('p');typical.className='preview-subtitle';typical.textContent='Using '+fmt(result.median)+' Pinballs · ×1';
   $('rewards').append(heading);typical.hidden=true;
   if(result.median<=10000000){
    const preview=await calculate('forward',{amount:result.median,event,gold:true,multiplier:1,refire:includeParty});if(version!==revision)return;
    $('rewards').append(...rewardRows(preview,event,includeParty));
   }else{typical.textContent+=' · rewards preview available up to 10,000,000 Pinballs.';}
   $('calc-status').textContent='Target '+fmt(n)+' '+resourceNames[PAYOUTS[event][0]]+'.';
  }
 }catch(error){if(version!==revision)return;$('rewards').replaceChildren();$('calc-status').textContent=error.message;}
 finally{if(version===revision)$('rewards').setAttribute('aria-busy','false');}
}
function changeMode(next){mode=next;$('calculator-content').classList.toggle('need-mode',mode==='need');document.querySelector('#refire').nextElementSibling.src=mode==='need'?'/assets/bulb.png':'/assets/refire.png';for(const [id,key] of [['have-tab','have'],['need-tab','need']]){$(id).setAttribute('aria-selected',String(mode===key));$(id).tabIndex=mode===key?0:-1;}$('calculator-content').setAttribute('aria-labelledby',mode==='have'?'have-tab':'need-tab');$('amount-label').textContent=mode==='have'?'Pinballs':'Target amount';$('multiplier-section').hidden=mode==='need';$('gold-modifier').hidden=mode==='need';$('refire-title').textContent=mode==='have'?'Zero Pinball Mode':'Include Tatari Party Pinball Reward';$('refire').setAttribute('aria-label',$('refire-title').textContent);$('refire-copy').textContent=mode==='have'?'Re-fire Pinballs returned by the Tatari Party track.':'Include Party rewards and returned Pinballs, from zero progress.';$('rewards-title').textContent=mode==='have'?'Rewards':'Pinballs Needed';$('amount').value=mode==='have'?'18,000':'6,000';options();schedule();}
$('have-tab').onclick=()=>changeMode('have');$('need-tab').onclick=()=>changeMode('need');document.querySelector('.mode-tabs').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();changeMode(e.key==='Home'?'have':e.key==='End'?'need':mode==='have'?'need':'have');$(mode==='have'?'have-tab':'need-tab').focus();}};
$('amount').oninput=()=>{options();schedule();};$('amount').onblur=()=>{try{$('amount').value=fmt(amount());}catch{}};
$('event').onchange=()=>{$('event-icon').src='/assets/'+eventIcons[$('event').value];schedule();};
$('refire').onclick=()=>{refire=!refire;$('refire').setAttribute('aria-checked',String(refire));schedule();};$('gold').onclick=()=>{gold=!gold;$('gold').setAttribute('aria-checked',String(gold));schedule();};
try{const response=await fetch('/data.json');if(!response.ok)throw Error('Could not load calculator data.');data=await response.json();options();schedule();}catch(error){$('calc-status').textContent=error.message;}
