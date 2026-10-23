import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fishResult,coinValue} from '../dist/fishing-coins-model.mjs';
const {fish}=JSON.parse(await readFile('dist/fishing-data.json','utf8'));
const examples=[[1,'589.14',4477],[39,'2.99',2657],[38,'678.76',2511],[28,'267.82',2437],[27,'1.70',2509],[23,'28.32',2582],[20,'23.88',2626],[5,'3093.57',2165],[4,'24567.15',2456],[3,'276.64',2600],[2,'302.16',2387],[41,'60.97',1530],[40,'0.19',1614],[32,'241.66',1111],[31,'0.40',1542],[30,'497.89',1145]];
for(const [id,kg,expected] of examples)assert.equal(fishResult(kg,fish.find(f=>f.id===id)).current,expected,'Screenshot fish '+id);
assert.equal(fish.length,41);
for(const f of fish){assert.equal(fishResult(String(f.maxRaw/100),f).gain,0);assert.equal(fishResult('0',f).gain,coinValue(f.maxRaw,f.price));assert.equal(fishResult('',f).state,'blank');for(const bad of ['-1','NaN','Infinity','1e3','0.001',String(f.maxRaw/100+1)])assert.equal(fishResult(bad,f).state,'invalid');if(f.minRaw>1)assert.equal(fishResult('0.01',f).state,'invalid')}
console.log('Passed all 16 screenshot coin values, 41 fish maxima, uncaught/blank records and invalid input boundaries.');
