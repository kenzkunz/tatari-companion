import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveBuild,advantage,dojoBadgeIds} from '../dist/tatari-stats-model.mjs';
const data=JSON.parse(await readFile(new URL('../dist/tatari-data/roster.json',import.meta.url),'utf8'));
const input={pet:11,tier:4,stars:27,food:8,badgeMode:'pick',badges:[1001,1002,1003,1004,1005,1006]};
const result=resolveBuild(data,input);for(const [a,n] of Object.entries({ATK:44277.95,HP:122087.20,DEF:10506.67}))assert(Math.abs(result.values[a]-n)<.01);
assert.deepEqual(result.values,resolveBuild(data,{...input,badges:[...input.badges,1001]}).values);
assert.deepEqual(resolveBuild(data,{...input,badgeMode:'none'}).values,resolveBuild(data,{...input,badges:[]}).values);
assert.throws(()=>resolveBuild(data,{...input,stars:0}));assert.throws(()=>resolveBuild(data,{...input,food:12}));assert.throws(()=>resolveBuild(data,{...input,tier:9}));
assert.equal(advantage(2,1),'left');assert.equal(advantage(1,2),'right');assert.equal(advantage(1,1),null);
for(const unit of data.units)for(const form of unit.forms)for(const stars of [1,84]){const r=resolveBuild(data,{pet:unit.id,tier:form.evolution,stars,food:1,badgeMode:'none',badges:[]});assert(Object.values(r.values).every(Number.isFinite));assert(Object.values(r.grades).every(Boolean));}
console.log('Passed stats tool sample, badge modes, input boundaries, comparisons and every Tatari form.');

assert.deepEqual(dojoBadgeIds(data,2,4),[1001,1002,1003,1004,1005]);assert.equal(dojoBadgeIds(data,2,6).length,7);
