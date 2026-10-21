import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const read=async path=>JSON.parse(await readFile(new URL('../dist/'+path,import.meta.url),'utf8'));
const data=await read('battle-data/stages.json'),catalog=await read('zobo-catalog.json'),summary=await read('battle-data/update-summary.json');
const enemies=new Map(catalog.enemies.map(e=>[e.id,e]));
assert.equal(data.stages.length,6400);assert.equal(new Set(data.stages.map(s=>s.name)).size,6400);
assert.equal(Object.keys(data.encounters).length,2671);
assert.deepEqual([summary.new,summary.changed,summary.unchanged],[429,404,1838]);
assert.equal(summary.changedStages,404);assert.deepEqual(summary.changedChapters,[24,25,26,27,28,29]);
const changes={new:0,changed:0,unchanged:0};let spawns=0;
for(const prefix of '0123456789abcdef'){
 const shard=await read('battle-data/encounters-'+prefix+'.json');
 for(const [key,battle] of Object.entries(shard.encounters)){
  const info=data.encounters[key];assert(info);changes[info.change]++;
  const totals=new Map();let last=-Infinity;
  for(const spawn of battle.spawns){assert(spawn.marker>=last);last=spawn.marker;assert(enemies.has(spawn.enemyId));assert(Number.isInteger(spawn.count)&&spawn.count>0);assert(spawn.lanes.length>0);assert(spawn.lanes.every(n=>Number.isInteger(n)&&n>=1&&(!battle.columns||n<=battle.columns)));totals.set(spawn.enemyId,(totals.get(spawn.enemyId)||0)+spawn.count);spawns++}
  assert.deepEqual([...totals].sort((a,b)=>a[0]-b[0]),info.enemies.map(e=>[e.id,e.count]));
 }
}
assert.deepEqual(changes,{new:429,changed:404,unchanged:1838});assert.equal(spawns,127540);
for(const stage of data.stages){assert(data.encounters[stage.encounter]);assert(stage.chapter>=1&&stage.chapter<=80);assert(stage.level.length===2);assert([stage.atk,stage.defense,stage.hp].every(n=>n>0))}
assert(data.stages.some(s=>s.name==='73-10'));assert.equal(catalog.enemies.filter(e=>e.boss&&e.selectable).length,31);assert(enemies.get(2001).selectable);
for(const enemy of catalog.enemies){assert(enemy.icon);assert(!/[\u3400-\u9fff]/.test(enemy.name));await access(new URL('../dist'+enemy.icon,import.meta.url))}
console.log('Passed all 2,671 encounter setups, 127,540 spawns, 6,400 stage links, patch coverage, localized enemies and 31 selectable bosses.');
