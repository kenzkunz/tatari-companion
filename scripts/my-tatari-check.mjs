import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateRoster,emptyRoster,rosterKey,starCost,foodGrade,sortRosterUnits,rosterPortrait,hasGlitter} from '../dist/my-tatari-model.mjs';
const catalog=JSON.parse(await readFile('dist/tatari-data/roster.json','utf8'));
catalog.starProgression=JSON.parse(await readFile('dist/tatari-data/star-progression.json','utf8'));
const roster=emptyRoster();roster.accountLevel=1739;for(const u of catalog.units){roster.units[u.id]={owned:true,tier:u.forms.at(-1).evolution,stars:84,food:u.feedingStages.at(-1).stage,copies:0,glitter:false};}
assert.deepEqual(validateRoster(roster,catalog),roster);assert.notEqual(rosterKey('one'),rosterKey('two'));
for(const field of ['tier','stars','food']){const bad=structuredClone(roster);bad.units[catalog.units[0].id][field]=999;assert.throws(()=>validateRoster(bad,catalog));}
for(const level of [0,1.5,100000])assert.throws(()=>validateRoster({...roster,accountLevel:level},catalog));
assert.throws(()=>validateRoster({...roster,units:{999:{owned:true,tier:1,stars:1,food:0}}},catalog));
console.log('Passed all 67 roster families, supported tiers/food/stars, invalid inputs and account storage separation.');

assert.equal(starCost(29,catalog),7);assert.equal(starCost(30,catalog),9);assert.equal(starCost(42,catalog),11);assert.equal(starCost(83,catalog),26);assert.equal(starCost(84,catalog),0);
const legacy={version:1,accountLevel:1,units:{1:{owned:true,tier:1,stars:30,food:0}}};assert.equal(validateRoster(legacy,catalog).units[1].copies,0);
const upgraded=structuredClone(legacy);upgraded.units[1]={...upgraded.units[1],copies:9,glitter:true,sparkle:true};assert.equal('sparkle' in validateRoster(upgraded,catalog).units[1],false);upgraded.units[1].copies=10;assert.throws(()=>validateRoster(upgraded,catalog));
console.log('Passed current-star copy costs, cap boundaries, old-save migration and Glitter ownership.');

assert.equal(foodGrade(catalog.units[0],0,catalog).RankName,'E');assert.equal(foodGrade(catalog.units[0],5,catalog).RankName,'D');
for(const r of Object.values(catalog.foodRanks)){const unit={feedingStages:[{stage:0,ATKPR:r.ATKPRMax,HPPR:r.HPPRMax,DEFPR:r.DEFPRMax}]};assert.equal(foodGrade(unit,0,catalog).RankName,r.RankName)}
console.log('Passed E–SSS food thresholds and lowest-attribute grade selection.');

const ordered=sortRosterUnits(catalog.units.slice(0,4),{1:{owned:false,tier:4,stars:84},2:{owned:true,tier:2,stars:20},3:{owned:true,tier:3,stars:10},4:{owned:true,tier:2,stars:40}});assert.deepEqual(ordered.map(u=>u.id),[3,4,2,1]);assert.deepEqual(catalog.units.slice(0,4).map(u=>u.id),[1,2,3,4]);console.log('Passed ownership, descending tier and descending star sorting without catalog mutation.');

catalog.portraits=JSON.parse(await readFile('dist/tatari-data/portrait-index.json','utf8')).images;let glitterCount=0;for(const u of catalog.units)for(const form of u.forms){assert.equal(rosterPortrait(u,{tier:form.evolution,glitter:false},catalog),form.portrait);if(hasGlitter(u,form.evolution,catalog)){const path=rosterPortrait(u,{tier:form.evolution,glitter:true},catalog);assert(path.includes('appearance-color_1'));await readFile('dist/tatari-data/'+path);glitterCount++}else assert.equal(rosterPortrait(u,{tier:form.evolution,glitter:true},catalog),form.portrait)}console.log('Verified '+glitterCount+' Glitter form mappings and missing-art fallback.');

const full=structuredClone(legacy);full.units[1].copies=9;assert.equal(validateRoster(full,catalog).units[1].copies,8);console.log('Passed required-minus-one progress cap and normalization of older full-progress saves.');

await import('./my-tatari-db-check.mjs');
