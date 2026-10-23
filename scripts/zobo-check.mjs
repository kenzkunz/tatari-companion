import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const data=await read('dist/zobo-data.json'),catalog=await read('dist/zobo-catalog.json'),horde=await read('dist/guide-data/horde.json');
const expected=catalog.enemies.filter(u=>u.selectable);
assert.deepEqual(data.units.map(u=>u.id),expected.map(u=>u.id));
assert.equal(new Set(data.units.map(u=>u.id)).size,74);
assert.equal(data.units.filter(u=>u.boss).length,31);
assert.equal(data.units.flatMap(u=>u.skills).length,129);
for(const unit of data.units){const old=expected.find(u=>u.id===unit.id);assert.equal(unit.name,old.name);assert.equal(unit.element,old.element);assert(unit.id<800000,'Boss Challenge variants must stay out');await fs.access('dist/'+unit.icon.replace(/^\//,''));for(const stat of ['ATK','HP','DEF'])assert(Number.isFinite(unit.growth[stat])&&unit.growth[stat]>0);assert.equal(unit.horde.recorded,horde.waves.some(w=>w.enemies.some(e=>e.id===unit.id)));for(const skill of unit.skills){assert(skill.description);assert(!/[\u3400-\u9fff]|#\.[A-Za-z]|skill_[A-Za-z]/.test(JSON.stringify(skill)));assert(skill.details.some(([label])=>label==='Cooldown'));}}
assert(!/D:\\|luac|decoded-pgame|Prefab/.test(JSON.stringify(data)),'Private source artifacts must stay out of public data');
console.log('Passed 74 localized identities/assets, 129 skills, growth values, Horde references, placeholder checks and Boss Challenge exclusion.');
