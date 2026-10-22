import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chipClaimedBy} from '../dist/drafter-chips.mjs';
const {chips}=JSON.parse(await readFile('dist/guide-data/horde.json','utf8'));
assert.deepEqual(chips.filter(c=>c.unique).map(c=>c.id),[33,41,46]);
for(const chip of chips){const duo={mode:'duo',chips:[{id:chip.id,player:1}]};assert.equal(chipClaimedBy(chip,duo,2),chip.unique?1:null);assert.equal(chipClaimedBy(chip,duo,1),null);assert.equal(chipClaimedBy(chip,{mode:'duo',chips:[{id:chip.id,player:2}]},1),chip.unique?2:null);assert.equal(chipClaimedBy(chip,{mode:'duo',chips:[]},2),null);assert.equal(chipClaimedBy(chip,{...duo,mode:'solo'},2),null);}
console.log('Passed all 49 chip flags, both ownership directions, non-unique sharing, release and Solo behavior.');
