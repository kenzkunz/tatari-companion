import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {searchMatches,minimumStars,coreStats} from '../dist/tatari-model.mjs';
const data=JSON.parse(await readFile(new URL('../dist/tatari-data/roster.json',import.meta.url),'utf8'));
assert.deepEqual(coreStats({ATKStandard:100,DEFStandard:200,HPStandard:300},{ATKCoef:1.2,ATKAdd:10,DEFCoef:2,DEFAdd:20,HPCoef:1,HPAdd:60},{ATK:2,DEF:2,HP:5}),{ATK:260,DEF:840,HP:1800});
assert.equal(data.units.length,67);assert.equal(data.units.reduce((n,u)=>n+u.forms.length,0),248);
const frost=data.units.find(u=>u.id===11);
for(const query of ['Frostpaw','Frostnip2','cat'])assert(searchMatches(frost,query));assert(!searchMatches(frost,'missing xyz'));
assert.deepEqual(frost.forms.map(f=>minimumStars(frost,f)),[0,3,6,24]);
for(const u of data.units)for(const f of u.forms){const stars=minimumStars(u,f);if(stars!==null)assert(Object.values(coreStats(data.level500,data.stars[stars],f.growth)).every(Number.isFinite));for(const img of [u.elementImage,u.roleImage,f.portrait,f.playerhead,...Object.values(f.skills).flat().map(s=>s.image)].filter(Boolean))assert((await stat(new URL('../dist/tatari-data/'+img,import.meta.url))).isFile());assert(!('raw' in f));}
console.log('Passed formula vector, aliases, evolution-star mapping, all form stats and referenced artwork.');
