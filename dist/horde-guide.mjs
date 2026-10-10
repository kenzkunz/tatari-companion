import {hordeSkillCards} from '/horde-cards-model.mjs';
const $=id=>document.getElementById(id),fmt=n=>Math.round(n).toLocaleString('en-US');
const text=v=>typeof v==='string'?v:v?.en||v?.zh||'';
const node=(tag,value,className)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(className)n.className=className;return n;};
const picture=(src,alt='')=>{const n=node('img');n.src=src;n.alt=alt;n.loading='lazy';return n;};
const energyValue=value=>{const n=node('span',undefined,'horde-energy-value');n.append(picture('/guide-assets/horde/energizer.png','Energizers'),node('span',fmt(value)));return n;};
const data=await fetch('/guide-data/horde.json').then(r=>{if(!r.ok)throw Error('Horde guide data unavailable');return r.json();});
const selectedWaves=()=>data.waves.filter(w=>w.difficulty===Number($('wave-difficulty').value));
const enemyTag=e=>{const n=node('span',undefined,'horde-enemy-tag');n.append(picture(e.icon),node('span',e.name+(e.count>1?' ×'+e.count:'')));return n;};

function renderWaves(){
  const waves=selectedWaves(),normal=waves.reduce((a,w)=>a+w.normal,0),bosses=waves.reduce((a,w)=>a+w.bosses,0),income=waves.reduce((a,w)=>a+w.income,0);
  $('wave-summary').textContent='25 waves · '+fmt(normal)+' normal enemies + '+bosses+' bosses · '+fmt(income)+' base kill Energy Candy per player if all configured enemies are defeated.';
  $('wave-list').replaceChildren(...waves.map(w=>{
    const d=node('details'),summary=node('summary'),boss=node('span',undefined,'horde-wave-bosses'),label=node('span','Wave '+w.wave,'horde-wave-label'),amount=node('span','+'+fmt(w.income),'horde-wave-income');
    amount.append(picture('/guide-assets/horde/energizer.png','Energizers'));boss.append(...w.enemies.filter(e=>e.boss).map(enemyTag));summary.append(label,boss,amount);
    const detail=node('div',undefined,'horde-wave-detail'),roster=node('div',undefined,'horde-wave-enemies');
    detail.append(node('p',w.normal+' normal + '+w.bosses+' boss enemies · ATK ×'+w.atk+' / HP ×'+w.hp+' / DEF ×'+w.defense+(w.chip?' · Chip selection-round definition':'')));
    roster.append(...w.enemies.map(enemyTag));detail.append(roster);d.append(summary,detail);return d;
  }));renderBudget();
}
function renderChips(){
  const search=$('chip-search').value.trim().toLowerCase(),quality=$('chip-quality').value,category=$('chip-category').value,wave=$('chip-wave').value;
  const chips=data.chips.filter(c=>(!search||(c.name+' '+c.description).toLowerCase().includes(search))&&(!quality||c.quality===Number(quality))&&(!category||c.category===category)&&(!wave||c.waves.includes(Number(wave))));
  $('chip-count').textContent=chips.length+' of '+data.chips.length+' chip variants';
  $('chip-list').replaceChildren(...chips.map(c=>{
    const row=node('article',undefined,'horde-chip'),copy=node('div'),heading=node('div',undefined,'horde-chip-title'),q={3:'Blue',5:'Gold',7:'Rainbow'}[c.quality]||'Quality '+c.quality;
    heading.append(node('strong',c.name),node('span',q,'horde-quality '+q.toLowerCase()));copy.append(heading,node('p',c.description),node('small',c.category+' · Eligible selection waves: '+c.waves.join(', ')+(c.unique?' · Exclusive to one player per run':'')));
    const art=node('span',undefined,'horde-chip-art');art.style.backgroundImage='url('+({Blue:'/guide-assets/horde/bluebg.png',Gold:'/guide-assets/horde/goldbg.png',Rainbow:'/guide-assets/horde/rainbowbg.png'}[q])+')';const img=picture(c.icon);img.style.width=c.sizing.width+'px';img.style.height=c.sizing.height+'px';img.style.left='calc(50% + '+c.sizing.x+'px)';img.style.top='calc(50% + '+c.sizing.y+'px)';art.append(img);row.append(art,copy);return row;
  }));if(!chips.length)$('chip-list').append(node('p','No chips match. Try another name or clear a filter.'));
}
let total=0;
$('rank-rows').replaceChildren(...data.ranks.map(r=>{
  total+=r.cost;const row=node('tr');row.append(node('td','Lv '+r.rank+(r.rank===8?' (cap unlock)':'')));for(const amount of [r.cost,total,r.death_refund]){const cell=node('td');cell.append(energyValue(amount));row.append(cell);}row.append(node('td',r.new_skill_index?'Horde skill '+r.new_skill_index:'—'));return row;
}));
$('rank-pr-rows').replaceChildren(...data.ranks.map(r=>{const row=node('tr');row.append(node('td','Lv '+r.rank),node('td',r.ATKPR+' / '+r.HPPR+' / '+r.DEFPR));return row;}));
for(let i=1;i<=8;i++){for(const id of ['level-from','level-to']){const o=node('option','Lv '+i+(i===8?' (cap unlock)':''));o.value=i;$(id).append(o);}}
$('level-from').value='1';$('level-to').value='3';
function renderLevel(){const from=Number($('level-from').value),to=Number($('level-to').value);if(to<from){$('level-result').textContent='Choose a target level at or above the current level.';return;}$('level-result').replaceChildren(energyValue(data.ranks.filter(r=>r.rank>from&&r.rank<=to).reduce((n,r)=>n+r.cost,0)),node('span',' Energizers to '+(from?'upgrade from Lv '+from:'deploy and upgrade')+' to Lv '+to+(to===8?'. Requires a level-cap unlock.':'.')));}
for(let i=0;i<=25;i++){const o=node('option',i?'Wave '+i:'Before the first wave');o.value=i;$('budget-wave').append(o);}$('budget-wave').value='25';
function renderBudget(){
  const wave=Number($('budget-wave').value),sec=wave*30;
  const kills=selectedWaves().filter(w=>w.wave<=wave).reduce((a,w)=>a+w.income,0);
  let passive=0;for(let t=5;t<=sec;t+=5)passive+=Math.max(0,25-5*Math.floor(t/90));
  const gross=400+kills+passive,lines=node('div',undefined,'horde-budget-lines');
  for(const [label,value] of [['Starting balance',400],['Base kill income through wave '+wave,kills],['Estimated passive income',passive],['Estimated Energizers obtained',gross]]){const row=node('span'),amount=node('span',undefined,'horde-energy-value');amount.append(node('strong',fmt(value)),picture('/guide-assets/horde/energizer.png','Energizers'));row.append(node('span',label),amount);lines.append(row);}
  $('budget-result').replaceChildren(lines);
}
for(const id of ['chip-search','chip-quality','chip-category','chip-wave'])$(id).addEventListener('input',renderChips);
$('budget-wave').addEventListener('input',renderBudget);
$('wave-difficulty').addEventListener('change',renderWaves);
for(const id of ['level-from','level-to'])$(id).addEventListener('change',renderLevel);
renderWaves();renderChips();renderLevel();

try{
  const roster=await fetch('/tatari-data/roster.json').then(r=>{if(!r.ok)throw Error('Tatari data unavailable');return r.json();});
  const units=roster.units.filter(u=>u.forms.some(f=>f.skills.horde?.length)).sort((a,b)=>text(a.forms[0].name).localeCompare(text(b.forms[0].name)));
  $('skill-tatari').replaceChildren(...units.map(u=>{const o=node('option',text(u.forms[0].name));o.value=u.id;return o;}));$('skill-tatari').value=units.some(u=>u.id===11)?'11':String(units[0].id);
  const trigger=$('skill-picker'),options=$('skill-options');
  const optionButtons=units.map(u=>{const b=node('button',undefined,'horde-tatari-option');b.type='button';b.setAttribute('role','option');b.dataset.unit=u.id;b.append(picture('/tatari-data/'+u.forms[0].portrait),node('span',text(u.forms[0].name)));b.addEventListener('click',()=>{$('skill-tatari').value=u.id;changeFamily();closePicker();trigger.focus();});return b;});options.replaceChildren(...optionButtons);
  function closePicker(){options.hidden=true;trigger.setAttribute('aria-expanded','false');}
  function openPicker(){options.hidden=false;trigger.setAttribute('aria-expanded','true');optionButtons.find(b=>b.dataset.unit===$('skill-tatari').value)?.focus();}
  trigger.addEventListener('click',()=>options.hidden?openPicker():closePicker());trigger.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();openPicker();}});
  options.addEventListener('keydown',e=>{const i=optionButtons.indexOf(document.activeElement);if(e.key==='Escape'){closePicker();trigger.focus();return;}let next;if(e.key==='ArrowDown')next=(i+1)%optionButtons.length;if(e.key==='ArrowUp')next=(i-1+optionButtons.length)%optionButtons.length;if(e.key==='Home')next=0;if(e.key==='End')next=optionButtons.length-1;if(next!==undefined){e.preventDefault();optionButtons[next].focus();}});
  document.addEventListener('click',e=>{if(!trigger.parentElement.contains(e.target))closePicker();});trigger.parentElement.addEventListener('focusout',e=>{if(!trigger.parentElement.contains(e.relatedTarget))closePicker();});
  function family(){return units.find(u=>u.id===Number($('skill-tatari').value));}
  function renderSkills(){
    const f=family().forms.find(f=>f.evolution===Number($('skill-evolution').value));
    $('skill-heading').replaceChildren(picture('/tatari-data/'+f.portrait,text(f.name)),node('strong',text(f.name)));
    $('skill-cards').replaceChildren(...hordeSkillCards(f).map(card=>{
      const article=node('article',undefined,'horde-skill-card'),header=node('header');header.append(node('strong',card.label),node('span',card.label==='Regular'?'Base skill':'Skill unlock'));article.append(header);
      for(const s of card.skills){article.append(node('h3',text(s.name)),node('p',text(s.description)));const values=node('div',undefined,'horde-skill-values');
        for(const d of s.details||[]){const title=text(d.title);if(title.toLowerCase().includes('arena factor'))continue;const v=node('div',undefined,'horde-skill-value');v.append(node('b',title+(d.type==='Effect'||d.value===null?'':' '+text(d.text))));if(d.type==='Effect'||d.value===null)v.append(node('span',text(d.text)));values.append(v);}article.append(values);
      }return article;
    }));$('skill-cards').scrollLeft=0;
  }
  function changeFamily(){const u=family();$('skill-picker-icon').src='/tatari-data/'+u.forms[0].portrait;$('skill-picker-name').textContent=text(u.forms[0].name);for(const b of optionButtons)b.setAttribute('aria-selected',String(Number(b.dataset.unit)===u.id));$('skill-evolution').replaceChildren(...u.forms.map(f=>{const o=node('option','Tier '+f.evolution+' · '+text(f.name));o.value=f.evolution;return o;}));renderSkills();}
  $('skill-tatari').addEventListener('change',changeFamily);$('skill-evolution').addEventListener('change',renderSkills);changeFamily();
}catch(e){$('skill-cards').replaceChildren(node('p','Skill data could not load. Refresh the page to try again.'));console.error(e);}
