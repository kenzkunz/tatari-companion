import assert from 'node:assert/strict';
import {chipTargets} from '../dist/drafter-chips.mjs';
const known=new Map([['a',{element:2}],['b',{element:3}]]),chip={id:29,name:'Exile'};
const make=(mode='duo')=>({gameMode:'horde',mode,cells:Array(36).fill(null)});
const unit=player=>({key:player===1?'a':'b',level:1,player});
const indices=(d,p)=>chipTargets(chip,d,known,p).targets.map(t=>t.index);
for(const neighbor of [1,6,8,13]){const d=make();d.cells[7]=unit(1);d.cells[neighbor]=unit(2);assert.deepEqual(indices(d,1),[],'P2 orthogonal neighbor must suppress P1');assert.deepEqual(indices(d,2),[],'P1 orthogonal neighbor must suppress P2');}
for(const neighbor of [0,2,12,14]){const d=make();d.cells[7]=unit(1);d.cells[neighbor]=unit(2);assert.deepEqual(indices(d,1),[7]);assert.deepEqual(indices(d,2),[neighbor]);}
const edge=make();edge.cells[5]=unit(1);edge.cells[6]=unit(2);assert.deepEqual(indices(edge,1),[5],'Row boundary must not wrap');assert.deepEqual(indices(edge,2),[6]);
const same=make();same.cells[7]=unit(1);same.cells[8]=unit(1);assert.deepEqual(indices(same,1),[]);
const separate=make();separate.cells[0]=unit(1);separate.cells[35]=unit(2);assert.deepEqual(indices(separate,1),[0]);assert.deepEqual(indices(separate,2),[35],'Do not highlight the other owner');separate.cells[35]=null;assert.deepEqual(indices(separate,1),[0]);assert.deepEqual(indices(separate,2),[]);
const solo=make('solo');solo.cells[0]=unit(1);assert.deepEqual(indices(solo,1),[0]);solo.cells[1]=unit(1);assert.deepEqual(indices(solo,1),[]);solo.cells[1]=null;assert.deepEqual(indices(solo,1),[0],'Removing the neighbor restores eligibility');assert.deepEqual(indices(make(),1),[]);
console.log('Exile passed: both-owner orthogonal adjacency, diagonal allowance, row edges, owner-only targets, solo and neighbor removal.');
