import {loadGuideData} from './site-data.mjs';
const $=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
const img=(src,alt='')=>{const n=el('img');n.src=src;n.alt=alt;n.loading='lazy';return n;};
const data=await loadGuideData('goldrush');
function supply(n){const v=el('span',undefined,'gold-icon-value');v.append(el('span',fmt(n)),img(data.assets.drink,'Energy Drinks'));return v;}
function iconText(icon,text,alt=''){const v=el('span',undefined,'gold-icon-value');v.append(img(icon,alt),el('span',text));return v;}
function exhaustionValue(value){const n=el('span',undefined,'gold-icon-value');n.append(el('strong','+'+value+'%'),img(data.assets.exhausted,'Exhaustion'));return n;}
function points(n){return iconText(data.assets.points,fmt(n),'Points');}
function row(values){const r=el('tr');for(const v of values){const c=el('td');c.append(v instanceof Node?v:document.createTextNode(String(v)));r.append(c);}return r;}
$('gold-tile-rows').replaceChildren(...data.tiles.map(t=>row([t.name,t.defenders,iconText(data.assets.productionPoints,fmt(t.perMinute),'Clam points'),iconText(data.assets.productionPoints,fmt(t.perHour),'Clam points')])));
$('daily-rows').replaceChildren(...data.daily.map(d=>row(['Day '+d.Day,Object.keys(d.ShellGridIDs).length?'Active clam day':'—','+'+d.ScoreRatePct+'%'])));
$('role-rows').replaceChildren(...[['leader','League Leader',1,'5%','Manage titles, mark tiles and post announcements'],['elite','Elite',2,'5%','Mark tiles and post announcements'],['vanguard','Vanguard',4,'3%','Mark tiles and post announcements'],[null,'Member','—','0%','Follow the league plan']].map(([art,name,count,discount,desc])=>{const title=el('span',undefined,'gold-icon-value');if(art)title.append(img(data.assets[art]));title.append(el('span',name));return row([title,count,discount,desc]);}));
const normal=data.buffs.filter(b=>b.Level<=10);
$('boost-rows').replaceChildren(...normal.map(b=>row([iconText(data.assets.boost,'Lv '+b.Level,'Boost'),supply(b.Cost),'+'+b.ATKPR+'%','+'+b.HPPR+'%','+'+b.DEFPR+'%'])));
$('cost-level').replaceChildren(...normal.map(b=>{const o=el('option','Lv '+b.Level+' - '+b.Cost+' Cans');o.value=b.Level;return o;}));$('cost-level').value='10';
$('fatigue-rows').replaceChildren(row([iconText(data.assets.attack,'1–10','Attack'),'-',iconText(data.assets.drink,'1x','Energy Drinks')]),...data.exhaustion.map((e,i)=>row([iconText(data.assets.attack,e.AttackTimes+(i===data.exhaustion.length-1?'+':'–'+(data.exhaustion[i+1].AttackTimes-1)),'Attack'),iconText(data.assets.exhausted,'+'+e.ExtraCostPct+'%','Exhaustion'),iconText(data.assets.drink,fmt(1+e.ExtraCostPct/100)+'x','Energy Drinks')])));
function numeric(id,min,max){const n=Number($(id).value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):min;}
function fatigue(next){return data.exhaustion.filter(e=>next>=e.AttackTimes).at(-1)?.ExtraCostPct||0;}
function cost(){const b=normal.find(b=>b.Level===Number($('cost-level').value)),next=Math.floor(numeric('cost-attacks',0,3000))+1,extra=fatigue(next),discount=Math.min(1,Number($('cost-role').value)+numeric('cost-spa',0,100)/100),bp=Math.floor(discount*10000+.5),charged=Math.floor(b.Cost*(10000+extra*100)*(10000-bp)/100000000);const box=el('div',undefined,'gold-result-lines');for(const [label,value] of [['Energy drinks at chosen threshold',supply(b.Cost)],['Attack count after attempt',String(next)],['Exhaustion Level',exhaustionValue(extra)],['Combined discount',fmt(discount*100)+'%'],['Estimated initial Energy Drink cost',supply(charged)]]){const n=el('span');n.append(el('span',label),value instanceof Node?value:el('strong',value));box.append(n);}$('cost-result').replaceChildren(box);}
for(const id of ['cost-level','cost-attacks','cost-role','cost-spa'])$(id).addEventListener('input',cost);cost();
$('loss-buff').replaceChildren(...[0,...normal.map(b=>b.HPPR)].map(v=>{const o=el('option','+'+v+'% HP');o.value=v;return o;}));$('loss-buff').value='20';
function loss(){const base=numeric('loss-hp',.001,1000000)*1000,buff=Number($('loss-buff').value),damage=numeric('loss-damage',0,1000000000),hp=base*(1+buff/100),unrounded=50*damage/hp,rounded=Math.ceil(unrounded),raw=Math.max(3,Math.min(50,rounded));const box=el('div',undefined,'gold-result-lines');for(const [label,value] of [['Modeled battle maximum HP',fmt(hp)],['Damage / modeled maximum HP',fmt(damage/hp*100)+'%'],['Before rounding and limits',fmt(unrounded)],['Estimated Energy Drink Loss',supply(raw)]]){const n=el('span');n.append(el('span',label),value instanceof Node?value:el('strong',value));box.append(n);}$('loss-result').replaceChildren(box);}
for(const id of ['loss-hp','loss-buff','loss-damage'])$(id).addEventListener('input',loss);
loss();
$('clam-gallery').replaceChildren(...[['clamclosed','Closed clam','Check the event countdown'],['clamwhole','Whole clam','100% owner harvest ratio'],['clamwrecked','Wrecked clam','70% owner harvest ratio'],['clamdamaged','Damaged clam','40% owner harvest ratio'],['clambase','Intact','Turns into an occupied Large Sea Crystal at 0%']].map(([icon,name,note])=>{const f=el('figure'),art=el('div',undefined,'gold-clam-art'),picture=img(data.assets[icon],name),size=data.clamSizing[icon];picture.style.width=size.width+'px';picture.style.height=size.height+'px';picture.style.left='calc(50% + '+size.x+'px)';picture.style.top='calc(50% + '+size.y+'px)';art.append(picture);f.append(art,el('figcaption',name),el('small',note));return f;}));
$('rally-rows').replaceChildren(...[[2000,4,11],[4000,8,12],[6000,12,13]].map(([price,people,level])=>{const b=data.buffs.find(b=>b.Level===level);return row([supply(price),people,iconText(data.assets.boost,'Lv '+level,'Boost'),'+'+b.ATKPR+'%','+'+b.HPPR+'%']);}));
for(let n=1;n<=6;n++){const o=el('option','Day '+n);o.value=n;$('reward-day').append(o);}for(let n=1;n<=4;n++){const o=el('option','Rank '+n);o.value=n;$('reward-league').append(o);}
function rewardList(items){const n=el('div',undefined,'gold-reward-items');for(const r of items){const v=el('span',undefined,'gold-reward-item');v.title=r.name;v.setAttribute('aria-label',fmt(r.amount)+' '+r.name);v.append(img(r.icon,''),el('b',fmt(r.amount)));if(!(r.type===12&&r.id===110002003))v.append(el('span',r.name));n.append(v);}return n;}
function sumRewards(entries){const totals=new Map();for(const entry of entries)for(const r of entry){const key=r.type+':'+r.id;if(!totals.has(key))totals.set(key,{...r,amount:0});totals.get(key).amount+=r.amount;}return [...totals.values()];}
function rewards(){const kind=$('reward-category').value;$('reward-day-label').hidden=kind!=='leagueDaily';$('reward-league-label').hidden=kind!=='leagueFinal';let entries=[];
 $('gold-attack-total').hidden=kind!=='attack';if(kind==='attack')$('gold-attack-total').replaceChildren(el('strong','Total attack rewards'),el('p','Select a kill threshold to see the rewards earned through that row.'));
 if(kind==='attack')entries=data.attackRewards.map(r=>({label:r.kills+' kills',rewards:r.reward}));
 if(kind==='leagueDaily')entries=data.leagueDaily.filter(r=>r.day===Number($('reward-day').value)).map(r=>({label:'League rank '+r.rank,rewards:r.rewards}));
 if(kind==='teamDaily'||kind==='teamFinal')entries=data[kind].map(r=>({label:'Team rank '+r.label,rewards:r.rewards}));
 if(kind==='leagueFinal')entries=data.leagueFinal.filter(r=>r.league===Number($('reward-league').value)).map(r=>({label:'Team bracket '+r.label,rewards:r.rewards}));
 if(kind==='mvp')entries=data.mvp.map(r=>({label:'League rank '+r.league,rewards:r.rewards}));
 $('gold-reward-list').replaceChildren(...entries.map((r,index)=>{const n=el(kind==='attack'?'button':'div',undefined,'reward-entry'+(kind==='attack'?' gold-milestone-row':''));n.append(el('strong',r.label),rewardList(r.rewards));if(kind==='attack'){n.type='button';n.setAttribute('aria-pressed','false');n.setAttribute('aria-label','Show total rewards through '+data.attackRewards[index].kills+' kills');n.addEventListener('click',()=>{for(const [i,b] of [...$('gold-reward-list').children].entries())b.setAttribute('aria-pressed',String(i===index));$('gold-attack-total').replaceChildren(el('strong','Total attack rewards through '+data.attackRewards[index].kills+' kills'),rewardList(sumRewards(data.attackRewards.slice(0,index+1).map(a=>a.reward))));});}return n;}));
}
for(const id of ['reward-category','reward-day','reward-league'])$(id).addEventListener('change',rewards);rewards();
let selectedMilestone=null;
function selectMilestone(index){selectedMilestone=index;for(const [i,b] of [...$('gold-team-milestones').children].entries())b.setAttribute('aria-pressed',String(i===index));const heading=el('strong','Total rewards through ');heading.append(points(data.teamMilestones[index].points));$('gold-team-total').replaceChildren(heading,rewardList(sumRewards(data.teamMilestones.slice(0,index+1).map(m=>m.rewards))));}
$('gold-team-milestones').replaceChildren(...data.teamMilestones.map((m,index)=>{const b=el('button',undefined,'reward-entry gold-milestone-row');b.type='button';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Show total rewards through '+fmt(m.points)+' team points');const label=el('strong');label.append(points(m.points));b.append(label,rewardList(m.rewards));b.addEventListener('click',()=>selectMilestone(index));return b;}));


function rallyEstimate(size,completed,discount,tileHP=3000,avgKills=30){
 const bp=Math.floor(Math.min(1,Math.max(0,discount))*10000+.5);
 const charge=(base,extra=0)=>Math.floor(base*(10000+extra*100)*(10000-bp)/100000000);
 const initial=charge(size);let left=initial,attempts=0,remaining=Math.max(0,tileHP);
 const required=Math.ceil(remaining/avgKills);
 if(bp===10000)return {initial,left,attempts:null,next:completed+1,remaining,kills:0,reason:'100% discount has no finite supply limit'};
 while(attempts<required&&attempts<10000){
  const needed=charge(100,fatigue(completed+attempts+1));
  if(needed>left)break;
  left-=needed;attempts++;
 }
 remaining=Math.max(0,tileHP-attempts*avgKills);
 return {initial,left,attempts,next:completed+attempts+1,remaining,kills:tileHP-remaining,reason:remaining===0?'Tile cleared':'Insufficient cans for the next attempt'};
}
function rallyCalculator(){
 const size=Number($('rally-size').value),completed=Math.floor(numeric('rally-attacks',0,3000));
 const discount=Number($('rally-role').value)+numeric('rally-spa',0,99)/100;
 const tileHP=Math.floor(numeric('rally-tile-hp',0,1000000)),avgKills=numeric('rally-avg-kills',.01,1000000);
 const r=rallyEstimate(size,completed,discount,tileHP,avgKills),box=el('div',undefined,'gold-result-lines');
 const values=[['Possible attack attempts',r.attempts===null?'Undefined at 100% discount':fmt(r.attempts)],['Possible refunded cans',supply(r.left)],['Estimated creation charge',supply(r.initial)],['Estimated kills',fmt(r.kills)],['Remaining tile HP',fmt(r.remaining)],['Attack count after rally',r.attempts===null?'—':fmt(r.next-1)],['Exhaustion after rally',r.attempts===null?'—':exhaustionValue(fatigue(r.next))]];
 for(const [label,value] of values){const n=el('span');n.append(el('span',label),value instanceof Node?value:el('strong',value));box.append(n);}
 $('rally-result').replaceChildren(box);
}
for(const id of ['rally-size','rally-attacks','rally-role','rally-spa','rally-tile-hp','rally-avg-kills'])$(id).addEventListener('input',rallyCalculator);
rallyCalculator();
