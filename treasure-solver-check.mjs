import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {estimate,placements,cellsOf} from './dist/treasure-solver-model.mjs';
const single={id:1,width:1,height:1,count:1,rotate:false},set={treasures:[single]};
assert.deepEqual(estimate(set,2,[],[]).probabilities,[.25,.25,.25,.25]);
assert.deepEqual(estimate(set,2,[0,1,2],[]).probabilities,[0,0,0,1]);
assert.deepEqual(estimate(set,2,[],[{id:1,x:0,y:0,w:1,h:1}]).probabilities,[0,0,0,0]);
assert(estimate(set,2,[0,1,2,3],[]).error);
assert.equal(placements({id:2,width:1,height:2,rotate:true},2).length,4);
assert.deepEqual(cellsOf({x:1,y:0,w:1,h:2},2),[1,3]);
const domino={treasures:[{id:2,width:1,height:2,rotate:true,count:1}]};
assert.deepEqual(estimate(domino,2,[],[]).probabilities,[.5,.5,.5,.5]);
assert.deepEqual(estimate(domino,2,[0],[]).probabilities,[0,.5,.5,1]);
const data=JSON.parse(await readFile('dist/treasure-data/stages.json','utf8'));let checked=0;
for(const stage of data.stages)for(const group of stage.sets){const r=estimate(group,stage.rows,[],[],{limit:1500,milliseconds:120});assert(!r.error,`Stage ${stage.stage}, set ${group.id}: ${r.error}`);const area=group.treasures.reduce((sum,t)=>sum+t.count*t.width*t.height,0);assert(Math.abs(r.probabilities.reduce((a,b)=>a+b,0)-area)<1e-7);assert(r.probabilities.every(p=>p>=0&&p<=1+1e-10));for(const t of group.treasures)await readFile('dist/'+t.image);checked++;}
console.log(`Treasure solver checks passed: hand-calculated probabilities, observations, rotations, and ${checked} stage sets.`);
