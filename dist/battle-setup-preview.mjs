const root=new URL('./battle-data/',import.meta.url);
let indexPromise;const shardPromises=new Map();
const load=async url=>{const response=await fetch(url);if(!response.ok)throw Error('Battle setup data could not be loaded.');return response.json()};
const index=()=>indexPromise??=load(new URL('stages.json?v=165921',root));
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node};
export function battleSetupPreview(enemies,context,onSelect){
 const details=el('details');details.className='battle-setup-preview';details.append(el('summary','Stage battle setup · patch 165921'));
 const body=el('div');details.append(body);let initialized=false;
 details.addEventListener('toggle',async()=>{if(!details.open||initialized)return;initialized=true;body.textContent='Loading battle setups…';
  try{const data=await index(),byName=new Map(data.stages.map(s=>[s.name,s]));body.replaceChildren();
   const form=el('form'),label=el('label','Stage '),input=el('input'),button=el('button','View setup');input.type='text';input.placeholder='73-10';input.setAttribute('aria-label','Battle setup stage');input.value=context.fromChapter&&context.fromStage?context.fromChapter+'-'+context.fromStage:'1-1';button.type='submit';label.append(input);form.append(label,button);body.append(form);
   const result=el('div');result.setAttribute('aria-live','polite');body.append(result);let request=0;
   const show=async()=>{const current=++request,stage=byName.get(input.value.trim());result.replaceChildren();if(!stage){result.textContent='Choose a recorded stage from chapters 1–80 (for example, 73-10).';return}
    result.textContent='Loading encounter…';try{const prefix=stage.encounter[0];if(!shardPromises.has(prefix))shardPromises.set(prefix,load(new URL('encounters-'+prefix+'.json?v=165921',root)));const shard=await shardPromises.get(prefix);if(current!==request)return;const setup=shard.encounters[stage.encounter],summary=data.encounters[stage.encounter];result.replaceChildren();
     result.append(el('h3','Stage '+stage.name+(stage.boss?' · Boss stage':'')),el('p','Enemy level '+stage.level.join(' + ')+' · '+stage.stars+' stars · ATK ×'+stage.atk+' · DEF ×'+stage.defense+' · HP ×'+stage.hp));
     result.append(el('p',setup.columns+' lanes · Deployment limit '+setup.deploymentLimit+' · '+summary.enemies.reduce((n,e)=>n+e.count,0)+' enemies'));
     const use=el('button','Use this stage');use.type='button';use.onclick=()=>onSelect(stage);result.append(use);
     const roster=el('ul');roster.className='battle-enemy-list';for(const entry of summary.enemies){const enemy=enemies.find(e=>e.id===entry.id),item=el('li'),image=el('img');if(enemy?.icon){image.src=enemy.icon;image.alt='';image.loading='lazy';item.append(image)}item.append(el('span',(enemy?.name||'Zobo '+entry.id)+' ×'+entry.count+(enemy?.boss?' · Boss':'')));roster.append(item)}result.append(roster);
     const timeline=el('details');timeline.append(el('summary','Spawn sequence'));const wrap=el('div');wrap.className='battle-spawn-scroll';const table=el('table'),head=el('thead'),hr=el('tr');for(const title of ['Marker','Zobo','Count','Lanes','Interval'])hr.append(el('th',title));head.append(hr);table.append(head);const rows=el('tbody');for(const spawn of setup.spawns){const row=el('tr');for(const value of [spawn.marker,enemies.find(e=>e.id===spawn.enemyId)?.name||spawn.enemyId,spawn.count,spawn.lanes.join(', '),spawn.interval])row.append(el('td',String(value)));rows.append(row)}table.append(rows);wrap.append(table);timeline.append(wrap,el('p','Markers and intervals are recorded configuration values. Runtime timing and live-build identity are unverified.'));result.append(timeline);
    }catch(error){if(current===request)result.textContent=error.message}
   };form.onsubmit=event=>{event.preventDefault();show()};await show();
  }catch(error){body.textContent=error.message;initialized=false}
 });return details;
}
