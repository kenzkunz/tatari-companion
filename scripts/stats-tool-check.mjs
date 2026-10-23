import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveBuild,advantage,dojoBadgeIds} from '../dist/tatari-stats-model.mjs';
const data=JSON.parse(await readFile(new URL('../dist/tatari-data/roster.json',import.meta.url),'utf8'));
const input={pet:11,tier:4,stars:27,food:8,badgeMode:'pick',badges:[1001,1002,1003,1004,1005,1006]};
const result=resolveBuild(data,input);for(const [a,n] of Object.entries({ATK:44277.95,HP:122087.20,DEF:10506.67}))assert(Math.abs(result.values[a]-n)<.01);
assert.deepEqual(result.values,resolveBuild(data,{...input,badges:[...input.badges,1001]}).values);
assert.deepEqual(resolveBuild(data,{...input,badgeMode:'none'}).values,resolveBuild(data,{...input,badges:[]}).values);
assert.throws(()=>resolveBuild(data,{...input,stars:0}));assert.throws(()=>resolveBuild(data,{...input,food:17}));assert.throws(()=>resolveBuild(data,{...input,tier:9}));
assert.equal(advantage(2,1),'left');assert.equal(advantage(1,2),'right');assert.equal(advantage(1,1),null);
for(const unit of data.units)for(const form of unit.forms)for(const stars of [1,84]){const r=resolveBuild(data,{pet:unit.id,tier:form.evolution,stars,food:1,badgeMode:'none',badges:[]});assert(Object.values(r.values).every(Number.isFinite));assert(Object.values(r.grades).every(Boolean));}
console.log('Passed stats tool sample, badge modes, input boundaries, comparisons and every Tatari form.');

assert.deepEqual(dojoBadgeIds(data,2,4),[1001,1002,1003,1004,1005]);assert.equal(dojoBadgeIds(data,2,6).length,7);

const allElements=[2,3,4,6,5];for(const e of allElements)assert.equal(dojoBadgeIds(data,e,6).length,7);
const allBadges=allElements.flatMap(e=>dojoBadgeIds(data,e,6));assert.equal(new Set(allBadges).size,35);
assert.deepEqual(resolveBuild(data,{...input,badges:[...input.badges,...dojoBadgeIds(data,3,6)]}).values,result.values);
console.log('Passed all five dojo selections; stat bonuses remain matched to the selected Tatari element.');

for(const unit of data.units){const max=Math.max(...unit.feedingStages.map(r=>r.stage));for(const food of unit.feedingStages.filter(f=>f.stage>=12&&f.stage<=16).map(f=>f.stage)){const r=resolveBuild(data,{pet:unit.id,tier:unit.forms.at(-1).evolution,stars:84,food,badgeMode:'none',badges:[]});assert(Object.values(r.values).every(Number.isFinite));assert(Object.values(r.grades).every(Boolean));}if(max<16)assert.throws(()=>resolveBuild(data,{pet:unit.id,tier:1,stars:1,food:16,badgeMode:'none',badges:[]}));}
console.log('Passed food stages 12–16 with actual per-Tatari availability and grade artwork.');

// Spa is additive with food/dojo, applies independently per stat and respects T4.
const {coreStats}=await import('../dist/tatari-model.mjs'); const plain=coreStats(data.standards500[result.unit.element],data.stars[input.stars],result.form.growth);
const spa=resolveBuild(data,{...input,spa:{ATK:20,HP:6,DEF:0}});
for(const [stat,percent] of Object.entries({ATK:20,HP:6,DEF:0}))assert(Math.abs(spa.values[stat]-(result.values[stat]+plain[stat]*percent/100))<.00001);
const lower={...input,tier:1,spa:{ATK:20,HP:10,DEF:5}};
assert.deepEqual(resolveBuild(data,lower).values,resolveBuild(data,{...lower,spa:{}}).values);
assert(resolveBuild(data,{...lower,lowerTierSpa:true}).values.ATK>resolveBuild(data,lower).values.ATK);
for(const value of [-1,101,NaN,Infinity])assert.throws(()=>resolveBuild(data,{...input,spa:{ATK:value}}));
console.log('Passed independent Spa percentages, additive stacking, tier restriction and invalid input checks.');

const {buildStandard,applyOwnedTatari}=await import('../dist/tatari-stats-model.mjs');
data.levelStandards=JSON.parse(await readFile('dist/tatari-data/level-standards.json','utf8'));
assert.equal(Object.keys(data.levelStandards.levels).length,3600,'Active level table must cover levels 1–3600');
for(let level=1;level<=3600;level++){
  const progressRows=data.levelStandards.levels[level];
  assert(progressRows && Object.keys(progressRows).length>0,'Missing active level '+level);
  for(const [progress,values] of Object.entries(progressRows)){
    assert(values.length===5,'Expected one value per element at level '+level+', progress '+progress);
    assert(values.every(value=>Number.isFinite(value)&&value>0),'Invalid active level data at level '+level+', progress '+progress);
  }
}
for(const element of [2,3,4,5,6])assert.deepEqual(buildStandard(data,element,{statMode:'normal',level:500,progress:0}),Object.fromEntries(['ATK','HP','DEF'].map(k=>[k+'Standard',data.standards500[element][k+'Standard']])));
assert.deepEqual(buildStandard(data,2,{statMode:'normal',level:1}),{ATKStandard:15,HPStandard:50,DEFStandard:5});
for(const element of [2,3,4,5,6])for(const level of [1,32,33,500,1739,2400,2401,3600])for(const progress of Object.keys(data.levelStandards.levels[level]))assert(Object.values(buildStandard(data,element,{statMode:'normal',level,progress})).every(n=>Number.isFinite(n)&&n>0));
for(const build of [{level:0},{level:3601},{level:1.5},{level:1,progress:4},{level:500,progress:5}])assert.throws(()=>buildStandard(data,2,{statMode:'normal',...build}));
assert.deepEqual(resolveBuild(data,{...input,statMode:'normal',level:500,progress:0}).values,result.values);
const normal=resolveBuild(data,{...input,statMode:'normal',level:1739});assert(normal.values.ATK>result.values.ATK);
assert(resolveBuild(data,{...input,food:0,statMode:'normal',level:1}).values.ATK>0);
const saved={accountLevel:1739,units:{11:{owned:true,tier:4,stars:27,food:0}}};const before=JSON.stringify(saved),manual={...input,level:500};const applied=applyOwnedTatari(manual,saved);assert.equal(applied.level,1739);assert.equal(applied.food,0);assert.equal(manual.food,8);assert.equal(JSON.stringify(saved),before);assert.throws(()=>applyOwnedTatari({...manual,pet:22},saved));
const normalSpa=resolveBuild(data,{...input,statMode:'normal',level:1739,spa:{ATK:20}});const normalCore=coreStats(buildStandard(data,2,{statMode:'normal',level:1739}),data.stars[input.stars],result.form.growth);assert(Math.abs(normalSpa.values.ATK-normal.values.ATK-normalCore.ATK*.2)<1e-6);
console.log('Passed normal levels 1–3600, element upgrade steps, exact level-500 parity, stage-zero food, account roster copying and level-aware Spa.');
