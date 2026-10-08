import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {searchMatches,minimumStars,coreStats,calculatedStats,databaseDefaults,compactStat} from '../dist/tatari-model.mjs';
const data=JSON.parse(await readFile(new URL('../dist/tatari-data/roster.json',import.meta.url),'utf8'));
assert.deepEqual(coreStats({ATKStandard:100,DEFStandard:200,HPStandard:300},{ATKCoef:1.2,ATKAdd:10,DEFCoef:2,DEFAdd:20,HPCoef:1,HPAdd:60},{ATK:2,DEF:2,HP:5}),{ATK:260,DEF:840,HP:1800});
assert.equal(data.units.length,67);assert.equal(data.units.reduce((n,u)=>n+u.forms.length,0),248);
const frost=data.units.find(u=>u.id===11);
for(const query of ['Frostpaw','Frostnip2','cat'])assert(searchMatches(frost,query));assert(!searchMatches(frost,'missing xyz'));
assert.deepEqual(frost.forms.map(f=>minimumStars(frost,f)),[0,3,6,24]);
for(const u of data.units)for(const f of u.forms){const stars=minimumStars(u,f);if(stars!==null)assert(Object.values(coreStats(data.level500,data.stars[stars],f.growth)).every(Number.isFinite));for(const img of [u.elementImage,u.roleImage,f.portrait,f.playerhead,...Object.values(f.skills).flat().map(s=>s.image)].filter(Boolean))assert((await stat(new URL('../dist/tatari-data/'+img,import.meta.url))).isFile());assert(!('raw' in f));}
console.log('Passed formula vector, aliases, evolution-star mapping, all form stats and referenced artwork.');

assert.equal(data.attributeLevels500[2],868);
const sample=calculatedStats(data,frost,frost.forms[3],{stars:27,foodStage:8,badgeIds:[1001,1002,1003,1004,1005,1006]});
for(const [a,expected] of Object.entries({ATK:44277.95,HP:122087.20,DEF:10506.67}))assert(Math.abs(sample[a]-expected)<0.01,a+' sample mismatch');
assert.deepEqual(sample,calculatedStats(data,frost,frost.forms[3],{stars:27,foodStage:8,badgeIds:[1001,1002,1003,1004,1005,1006,1001]}));
const zero=calculatedStats(data,frost,frost.forms[0],{stars:0,foodStage:0});assert(zero.ATK>coreStats(data.standards500[2],data.stars[0],frost.forms[0].growth).ATK);
console.log('Passed corrected element-level lookup, supplied Frostnip sample, stage-zero bonuses and badge deduplication.');

assert.deepEqual(frost.forms.map(f=>databaseDefaults(frost,f)),[{stars:0,foodStage:0},{stars:3,foodStage:0},{stars:6,foodStage:3},{stars:24,foodStage:8}]);
assert.equal(compactStat(11669.73),'11.66K');assert.equal(compactStat(122087.2),'122.08K');assert.equal(compactStat(1234567.89),'1.23M');assert.equal(compactStat(999.99),'999');
for(const u of data.units)for(const f of u.forms){const defaults=databaseDefaults(u,f);if(defaults.stars!==null&&defaults.foodStage!==null)assert(Object.values(calculatedStats(data,u,f,defaults)).every(Number.isFinite));}
console.log('Passed automatic evolution defaults and compact floor formatting.');

assert(!/#\.[A-Za-z][A-Za-z0-9]*#/.test(JSON.stringify(data)), 'Unresolved skill text placeholder');

for(const u of data.units)for(const f of u.forms)for(const skills of Object.values(f.skills))assert(skills.every(s=>!JSON.stringify(s.name).includes('不用翻译')), 'Internal helper skill leaked into public cards');

const hordeIds=new Set();for(const u of data.units)for(const f of u.forms){assert(f.skills.normal.every(s=>!JSON.stringify(s.name).includes('不用翻译')));for(const s of f.skills.horde){hordeIds.add(s.id);assert(s.details.length>0,'Missing Horde details '+s.id);assert([3,5,7].includes(s.unlockLevel));assert(!/\$\{\d+\}|#\.[A-Za-z]/.test(JSON.stringify(s)),'Unresolved Horde value '+s.id);}}
assert.equal(hordeIds.size,201);
const ice=frost.forms[0].skills.horde[0];assert.deepEqual(ice.details.map(d=>d.text),['180%','30%','Unable to move or attack.','45%','1.5s']);
console.log('Audited all 67 families / 248 forms; no internal normal cards; 201 Horde skills have resolved in-game detail rows.');
