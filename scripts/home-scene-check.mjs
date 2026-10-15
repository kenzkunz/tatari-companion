import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HomeScene,ROSTER,selectRoster,groundLayout} from '../dist/home-scene-model.mjs';
const manifest=JSON.parse(await readFile(new URL('../dist/assets/homepage/manifest.json',import.meta.url)));
const make=(random=()=>.5)=>new HomeScene(manifest,{random,width:1200,height:200,size:240});
const tick=(s,t)=>{for(let i=0;i<Math.ceil(t/.02);i++)s.tick(.02);};
let s=make(()=>0);assert.deepEqual(s.actors.map(a=>a.name),ROSTER);assert.equal(s.actors[0].variant,'Zapup');assert(s.actors.slice(1).every(a=>a.variant.endsWith('-Glitter')));
s=make(()=>.03);assert(s.actors.every(a=>!a.variant.includes('Glitter')),'Glitter cutoff is strictly 3%');
for(const [type,first,second] of [['battle','Zapup','Frostnip'],['stab','Frugling','Frostnip'],['burn','Frugling','Pyropup'],['shock','Sparkit','Zapup'],['smell','Pyropup','Frostnip']]){
 s=make();const a=s.actors.find(a=>a.name===first),b=s.actors.find(a=>a.name===second),dir=a.dir;
 assert(s.start(type,a,b));assert(!s.start('battle',s.actors[1],s.actors[2]),'Only one pair can interact');
 if(type==='battle'){assert.equal(a.action,'Attack');assert.equal(b.action,'Attack');tick(s,4.02);assert([a.action,b.action].includes('Cheer'));assert([a.action,b.action].includes('Death'));}
 if(type==='stab'){assert.equal(a.action,'Stab');assert.equal(a.dir,-dir);tick(s,3.04);assert.equal(a.dir,dir);assert.equal(a.action,'Move');}
 if(type==='burn'){assert.equal(a.action,'BurnJump');tick(s,manifest[a.variant].BurnJump.duration+.02);assert.equal(a.action,'BurnRun');tick(s,6.02);assert.equal(a.action,'BurnJump');}
 if(type==='shock'){assert.equal(b.action,'Attack');tick(s,manifest[b.variant].Attack.duration+.02);assert.equal(a.action,'Shock');}
 if(type==='smell'){assert.equal(a.action,'Smell');tick(s,manifest[a.variant].Smell.duration+.04);assert.equal(a.dir,-dir);}
 tick(s,25);assert.equal(s.pair,null,type+' releases pair lock');
}
for(const [roll,action,min,max] of [[.05,'Rest',10,15],[.15,'Idle',5,15],[.25,'Eat',4,8]]){
 s=make();s.random=()=>roll;const a=s.actors[0];a.decision=0;s.tick(.01);assert.equal(a.action,action);assert(a.remaining>=min&&a.remaining<=max);
}
for(const actions of Object.values(manifest))for(const asset of Object.values(actions)){assert(asset.duration>0);assert(asset.bounds[2]>asset.bounds[0]);assert(asset.durations.every(d=>d>0));await readFile(new URL('../dist/'+asset.src,import.meta.url));}
console.log('Homepage passed: five actors, glitter cutoff, one-pair lock, battle, stab direction, burn sequence, shock timing, smell turn, pause ranges and all asset paths.');

// Encounters are evaluated once at their approach/pass boundary, not every frame.
function fixture(){const s=make(()=>.99);s.actors.forEach((a,i)=>{a.x=80+i*230;a.y=190;a.targetY=190;a.decision=99;a.speed=32;});return s;}
s=fixture();let a=s.actors[0],b=s.actors[3];a.x=400;b.x=400+(s.body(a)+s.body(b))*.5;a.y=b.y=60;a.targetY=b.targetY=60;a.dir=1;b.dir=-1;s.random=()=>.09;s.tick(.02);assert.equal(s.pair?.type,'battle');
s=fixture();a=s.actors[2];b=s.actors[0];a.x=400;b.x=400+(s.body(a)+s.body(b))*.5;a.y=b.y=60;a.targetY=b.targetY=60;a.dir=1;b.dir=-1;s.random=()=>.1;s.tick(.02);assert.equal(s.pair?.type,'shock');
for(const [otherName,type] of [['Pyropup','burn'],['Frostnip','stab']]){s=fixture();a=s.actors[4];b=s.actors.find(a=>a.name===otherName);const threshold=s.body(a)/6+s.body(b)/2;b.x=400;a.x=400+threshold-.5;a.y=b.y=60;a.targetY=b.targetY=60;a.dir=1;b.dir=-1;s.random=()=>.1;s.tick(.02);assert.equal(s.pair?.type,type);}
s=fixture();a=s.actors[1];b=s.actors[3];a.x=400;b.x=400+(s.body(a)+s.body(b))*.5;a.y=b.y=60;a.targetY=b.targetY=60;a.dir=b.dir=1;b.action='Idle';b.remaining=10;s.random=()=>.1;s.tick(.02);assert.equal(s.pair?.type,'smell');
console.log('Natural encounter triggers passed: approach, crossing, shock, burn, stab and idle-target smell.');

s=make();for(const a of s.actors){const scale=({Pyropup:1.4,Sparkit:1.2,Frugling:1.4,Frostnip:.85})[a.name]||1;assert.equal(s.sizeOf(a),240*scale);assert.equal(s.body(a),s.sizeOf(a)*(manifest[a.variant].Move.bounds[2]-manifest[a.variant].Move.bounds[0])/512);}
console.log('Actor sizes and matching collision bounds passed.');

s=fixture();a=s.actors[0];b=s.actors[3];a.x=400;b.x=400+(s.body(a)+s.body(b))*.5;a.y=b.y=60;a.targetY=b.targetY=60;a.dir=1;b.dir=-1;s.random=()=>.10;s.tick(.02);assert.equal(s.pair,null,'Battle does not trigger at the 10% cutoff');

assert.equal(selectRoster(true,()=>0).length,2);assert.equal(selectRoster(false,()=>0).length,4);assert.equal(selectRoster(false,()=>.99).length,5);for(let i=0;i<50;i++){const roster=selectRoster(i%2===0);assert.equal(new Set(roster).size,roster.length);assert(roster.every(n=>ROSTER.includes(n)));const s=new HomeScene(manifest,{roster});assert.equal(s.actors.length,roster.length);}

for(const [w,h] of [[1852,911],[1440,900],[390,844],[1920,500]]){const g=groundLayout(w,h);const scale=Math.max(w/1920,h/1080),horizon=(h-1080*scale)/2+736*scale;assert(g.top>horizon);const scene=new HomeScene(manifest,{height:g.height});for(const a of scene.actors)assert(g.top+a.y>=horizon&&g.top+a.y<h-g.bottom);}
