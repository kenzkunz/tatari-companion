import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {rangeTiles} from '../dist/drafter-ranges.mjs';
const data=JSON.parse(await readFile(new URL('../dist/drafter-ranges.json',import.meta.url),'utf8'));
const run=(overrides={})=>rangeTiles(data,{key:'12-1',level:1,mode:'horde',cols:6,rows:6,index:14,enemyRows:6,...overrides});
// Pyropup's normal rectangle includes lateral neighbours, and points forward on screen.
const pyro=run();assert(pyro.attack.has(49));assert(pyro.attack.has(43));assert(!pyro.attack.has(55));
// Frostnip is a column in ordinary modes, a radius-six diamond in the Arena profile.
const ice=run({key:'11-1'});assert(ice.attack.has(2));assert(!ice.attack.has(49));
const arena=run({key:'11-1',mode:'dojo',cols:3,rows:4,index:7,enemyRows:0});assert(arena.attack.has(0));assert(arena.attack.has(11));
// Horde level five adds Pyropup's self-centred surrounding skill area.
assert(!pyro.skill.has(55));assert(run({level:5}).skill.has(55));
// Clipping must never wrap an offset across rows or outside either field.
for(const index of [0,5,30,35])for(const key of Object.keys(data.forms)){
 const result=run({key,index});for(const set of [result.attack,result.skill])for(const tile of set)assert(tile>=0&&tile<72);
}
assert.equal(run({mode:'other'}).supported,false);assert.equal(run({mode:'goldrush'}).supported,false);
const before=JSON.stringify(data);run({level:7});assert.equal(JSON.stringify(data),before);
console.log('Drafter range geometry: source examples, mode differences, Horde unlocks, clipping, unsupported modes and immutability passed.');

// An off-board target cannot splash back into the board.
const fixture={forms:{test:{basic:1,horde:[]}},skills:{1:{target:'target',origin:'target',normal:{cast:{offsets:[[-1,0]]},effect:{offsets:[[1,0]]}}}}};
assert.equal(rangeTiles(fixture,{key:'test',mode:'horde',cols:6,rows:6,index:0}).skill.size,0);
