import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateRoster,rosterPortrait} from '../dist/my-tatari-model.mjs';
import {entryFor,artworkFor} from '../dist/tierlist-model.mjs';
import {rangeTiles} from '../dist/drafter-ranges.mjs';
const read=async p=>JSON.parse(await readFile('dist/'+p,'utf8'));
const [catalog,index,drafter,ranges,effects]=await Promise.all(['tatari-data/roster.json','tatari-data/portrait-index.json','drafter-roster.json','drafter-ranges.json','tatari-data/effect-catalog.json'].map(read));
const unit=catalog.units.find(u=>u.id===68);assert(unit);assert.equal(unit.element,4);assert.equal(unit.role.en,'Tank');
assert.deepEqual(unit.forms.map(f=>f.name.en),['Bonobean','Titanape','Grangutan','Primakong']);
assert.deepEqual(unit.feedingStages.map(f=>f.stage),Array.from({length:17},(_,i)=>i));
assert.deepEqual(unit.forms.map(f=>f.trial?.requiredStars??null),[6,18,36,null]);
assert.deepEqual(unit.forms.flatMap(f=>f.trial?.quests.map(q=>q.target)||[]),[20,3,15000,7,45000,150]);
catalog.portraits=index.images;
for(const form of unit.forms){
 const settings={owned:true,tier:form.evolution,stars:84,food:16,copies:0,glitter:true};
 assert(validateRoster({version:1,accountLevel:3600,units:{68:settings}},catalog).units[68].glitter);
 const portrait=rosterPortrait(unit,settings,catalog);assert.notEqual(portrait,form.portrait);await readFile('dist/tatari-data/'+portrait);
 const key='68-'+form.evolution;assert(drafter.entries.some(e=>e.key===key));assert(rangeTiles(ranges,{key,level:1,mode:'horde',cols:6,rows:6,index:32,enemyRows:6}).attack.size>0);
 for(const marker of [key,key+'-flash']){const entry=entryFor(catalog.units,marker);assert(entry);await readFile('dist/'+artworkFor(entry,'icon'));await readFile('dist/'+artworkFor(entry,'character'));}
 assert(effects.forms[key].some(s=>s.effectId==='buff:6891'&&s.level===5));assert(effects.forms[key].some(s=>s.effectId==='mechanic:knockback'&&s.level===7));
}
assert(effects.effects['unresolved:6804:4'].excludedModes.includes('horde'));
assert.equal(drafter.entries.filter(e=>e.unitId===68).length,4);
console.log('Passed Bonobean identity, all food/trial ranges, normal/Glitter assets, roster validation, drafting geometry, tierlist artwork and skill unlock tags.');
