import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tierStarRange,tierFoodMinimum,bulkTierPlan,emptyRoster,validateRoster,rosterTier} from '../dist/my-tatari-model.mjs';
const catalog=JSON.parse(await readFile('dist/tatari-data/roster.json','utf8'));catalog.starProgression=JSON.parse(await readFile('dist/tatari-data/star-progression.json','utf8'));
const unit=catalog.units.find(u=>u.id>10&&u.forms.length===4),tier=unit.forms[2].evolution,min=tierStarRange(unit,tier).min;
assert(min>1);assert.equal(tierStarRange(unit,unit.forms[0].evolution).min,1);assert.equal(tierStarRange(unit,tier).max,84);assert.throws(()=>tierStarRange(unit,99));
const roster=emptyRoster();roster.accountLevel=1739;roster.units[unit.id]={owned:true,tier:unit.forms[0].evolution,stars:1,copies:0,food:unit.feedingStages[0].stage,glitter:true};const before=structuredClone(roster);
const result=bulkTierPlan(catalog,roster,[unit.id,unit.id],rosterTier(unit,tier));assert.equal(result.changes.length,1);assert.equal(result.next.units[unit.id].stars,min);assert.equal(result.next.units[unit.id].copies,0);assert.equal(result.next.units[unit.id].food,tierFoodMinimum(unit,tier));assert.equal(result.next.units[unit.id].glitter,true);assert.deepEqual(roster,before);validateRoster(result.next,catalog);
const high=structuredClone(roster);high.units[unit.id].stars=70;high.units[unit.id].copies=1;const kept=bulkTierPlan(catalog,high,[unit.id],3);assert.equal(kept.next.units[unit.id].stars,70);assert.equal(kept.next.units[unit.id].copies,1);
const starter=catalog.units.find(u=>u.id===1);roster.units[1]={owned:true,tier:starter.forms[0].evolution,stars:1,copies:0,food:starter.feedingStages[0].stage,glitter:false};const mixed=bulkTierPlan(catalog,roster,[1,unit.id,999],3);assert.equal(mixed.changes.length,1);assert.equal(mixed.skipped.length,2);assert.equal(mixed.next.units[1].tier,starter.forms[0].evolution);assert.throws(()=>bulkTierPlan(catalog,roster,[unit.id],5));
const done=bulkTierPlan(catalog,result.next,[unit.id],3);assert.equal(done.changes.length,0);assert.equal(done.skipped[0].reason,'Already set');
for(const u of catalog.units)for(const f of u.forms){const range=tierStarRange(u,f.evolution);assert(range.min<=84);assert(range.min>=1)}
console.log('Passed tier star minimums, high-star allowance, display-tier mapping, bulk deduplication, unsupported/not-owned skips, copy reset, field preservation, no-op and source immutability.');

const noFood=bulkTierPlan(catalog,roster,[unit.id],3,{minimumFood:false});assert.equal(noFood.next.units[unit.id].food,roster.units[unit.id].food);
const fed=structuredClone(roster);fed.units[unit.id].food=unit.feedingStages.at(-1).stage;assert.equal(bulkTierPlan(catalog,fed,[unit.id],3).next.units[unit.id].food,fed.units[unit.id].food);
assert.equal(tierFoodMinimum(unit,unit.forms[0].evolution),unit.feedingStages[0].stage);assert.equal(tierFoodMinimum(catalog.units.find(u=>u.id===12),2),0,'Optional OR food condition is not mandatory');
console.log('Passed required food minimums, optional-alternative exclusion, food opt-out and higher-food preservation.');
