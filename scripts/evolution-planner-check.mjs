import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planGoal,copiesNeeded,validateGoals,assessQuest,questEvents,eventWindows} from '../dist/evolution-planner-model.mjs';
const catalog=JSON.parse(await readFile('dist/tatari-data/roster.json','utf8'));catalog.starProgression=JSON.parse(await readFile('dist/tatari-data/star-progression.json','utf8'));
const schedule=JSON.parse(await readFile('dist/data.json','utf8'));
assert.equal(copiesNeeded(catalog,4,2,24),122);assert.equal(copiesNeeded(catalog,21,3,24),18);assert.equal(copiesNeeded(catalog,27,5,24),0);
const roster={accountLevel:1739,units:{13:{owned:true,tier:2,stars:4,copies:2,food:0},11:{owned:true,tier:3,stars:27,copies:0,food:8},1:{owned:true,tier:1,stars:1,copies:0,food:0}}};
const frozen=JSON.stringify(roster),goal=planGoal(catalog,roster,{unit:13,target:4});assert.equal(goal.steps.length,2);assert.equal(goal.requiredStars,24);assert.equal(goal.wishboxes,122);assert(!goal.ready);assert.equal(JSON.stringify(roster),frozen);
const starter=planGoal(catalog,roster,{unit:1,target:2});assert.equal(starter.wishboxes,0);assert(starter.copies>0);assert(!starter.wishboxEligible);
assert.throws(()=>planGoal(catalog,roster,{unit:14,target:2}));assert.throws(()=>planGoal(catalog,roster,{unit:13,target:2}));assert.throws(()=>validateGoals(Array.from({length:6},(_,i)=>({unit:i,target:2}))));assert.throws(()=>validateGoals([{unit:13,target:3},{unit:13,target:4}]));
const frost=planGoal(catalog,roster,{unit:11,target:4});assert.equal(frost.copies,0);assert(frost.requirements[0].automatic&&frost.requirements[0].done);const event=frost.requirements.find(q=>q.events.length);assert.deepEqual(questEvents(event),['Fishing Contest','Raft Race']);
const own=frost.requirements.find(q=>q.condition.includes('PetTIDCountByElementStar'));assert(own.automatic);assert.equal(own.current,1);
const completed=assessQuest(event,{...roster,catalog},null,event.target);assert(completed.done);assert(!completed.automatic);
const windows=eventWindows([frost,goal],schedule,Date.UTC(2026,9,19));assert(windows.some(w=>w.name==='Fishing Contest'));assert(windows.some(w=>w.name==='Raft Race'));assert.equal(new Set(windows.map(w=>w.name)).size,windows.length);assert(windows.every(w=>w.end>Date.UTC(2026,9,19)));
const acquire=catalog.units.flatMap(u=>u.forms).flatMap(f=>f.trial?.quests||[]).find(q=>q.condition==='ed.ConditionX.Counter(63)>=30');assert(acquire);assert.equal(assessQuest(acquire,{...roster,catalog},null,0).missing,30);
console.log('Passed five-goal limit, copy sums, saved progress deduction, starter ineligibility, food and companion checks, manual trial progress, event alternatives and UTC opportunities.');

const {completedGoalRoster}=await import('../dist/evolution-planner-model.mjs');
const {finishEvolution}=await import('../dist/evolution-planner-client.mjs');
const goalToFinish={unit:13,target:4},latest=structuredClone(roster);latest.units[13].stars=28;latest.units[13].food=9;latest.units[13].copies=3;latest.units[13].glitter=true;latest.accountLevel=1800;
const changed=completedGoalRoster(catalog,latest,goalToFinish);assert.equal(changed.units[13].tier,4);assert.deepEqual({...changed.units[13],tier:2},latest.units[13]);assert.deepEqual(changed.units[11],latest.units[11]);assert.equal(changed.accountLevel,1800);assert.equal(latest.units[13].tier,2);
let savedArgs;const success=await finishEvolution(catalog,'actor-one',goalToFinish,{load:async actor=>{assert.equal(actor,'actor-one');return {roster:latest,revision:19}},save:async(...args)=>{savedArgs=args;return {roster:args[1],revision:20}}});assert.equal(savedArgs[0],'actor-one');assert.equal(savedArgs[2],19);assert.equal(success.roster.units[13].tier,4);assert(success.saved);
const finished=structuredClone(latest);finished.units[13].tier=4;const repeat=await finishEvolution(catalog,'actor-one',{unit:13,target:3},{load:async()=>({roster:finished,revision:21}),save:async()=>{throw Error('Must not downgrade or save twice')}});assert.equal(repeat.saved,false);assert.equal(repeat.roster.units[13].tier,4);
await assert.rejects(()=>finishEvolution(catalog,'actor-one',goalToFinish,{load:async()=>({roster:latest,revision:19}),save:async()=>{throw Error('Roster changed on another device')}}),/another device/);
await assert.rejects(()=>finishEvolution(catalog,'actor-one',goalToFinish,{load:async()=>null,save:async()=>{throw Error('Unexpected save')}}),/could not be found/);
console.log('Passed finish evolution: fresh roster merge, tier-only update, preserved settings, expected revision, repeat/no-downgrade and failure handling (offline).');

const nav=await readFile('components/public-navbar.html','utf8');assert(nav.includes('<a href="/evolution-planner.html">Evolution Trial Planner</a>'));assert(!nav.includes('aria-disabled="true">Evolution Trial</span>'));
