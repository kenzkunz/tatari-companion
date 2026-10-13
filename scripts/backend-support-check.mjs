import assert from 'node:assert/strict';
import {chipTargets} from '../dist/drafter-chips.mjs';
const known=new Map([['a',{element:2}],['b',{element:3}],['c',{element:4}]]),draft={gameMode:'horde',mode:'duo',cells:Array(36).fill(null)},chip={id:32,name:'Backend Support'};
draft.cells[1]={key:'a',level:1,player:1};draft.cells[19]={key:'b',level:1,player:1};draft.cells[31]={key:'c',level:1,player:1};draft.cells[13]={key:'a',level:1,player:2};
assert.deepEqual(chipTargets(chip,draft,known,1).targets.map(m=>m.index),[19]);
assert.deepEqual(chipTargets(chip,draft,known,2).targets,[]);
draft.cells[19]=null;assert.deepEqual(chipTargets(chip,draft,known,1).targets.map(m=>m.index),[31]);
draft.cells[1]=null;assert.deepEqual(chipTargets(chip,draft,known,1).targets,[]);
console.log('Backend Support passed: gaps, exact-one condition, same column and player ownership.');
