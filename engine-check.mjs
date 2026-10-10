import {readFileSync} from 'node:fs';
import {forward,reverse,binomial,RNG,unlocked,session} from './dist/engine.mjs';
const data=JSON.parse(readFileSync('./dist/data.json','utf8'));
const before=JSON.stringify(data);
const rng=new RNG(34);let sum=0,sum2=0;for(let i=0;i<10000;i++){const x=binomial(rng,18000,.22);sum+=x;sum2+=x*x}const mean=sum/10000,variance=sum2/10000-mean*mean;
if(Math.abs(mean-3960)>6||Math.abs(variance-3088.8)>200)throw Error('Binomial distribution mismatch');
const start=performance.now();
const low=forward(18000,'Fishing Contest',true,1,false,data.party),high=forward(18000,'Fishing Contest',true,100,false,data.party);
if(Math.abs(low.machine.rods.mean-3960)>8)throw Error('Forward mean mismatch');
if(high.haul.rods.high-high.haul.rods.low<=low.haul.rods.high-low.haul.rods.low)throw Error('Multiplier variance mismatch');
const off=reverse(6000,'Fishing Contest',false,data.party),on=reverse(6000,'Fishing Contest',true,data.party);
if(Math.abs(off.mean-6000/.22)>40||on.median>=off.median)throw Error('Reverse mismatch');
if(unlocked(500).includes(10)||unlocked(8000).at(-1)!==200)throw Error('Unlock mismatch');
for(const [event,variants]of Object.entries(data.party.tables))for(const [variant,rows]of Object.entries(variants)){const r=session(rng,18003,event,20,true,rows,variant==='gold_active');if(18003+r.earned!==r.spent+r.remaining)throw Error('PB conservation failed')}
if(Object.keys(data.album.cards).length!==135||data.album.cards['52'].name!=='No Racoons')throw Error('Card dataset mismatch');
if(JSON.stringify(data)!==before)throw Error('Calculation changed game data');
console.log(JSON.stringify({binomialMean:mean,binomialVariance:variance,forwardRods:low.machine.rods,reverseOff:off,reverseOn:on,seconds:(performance.now()-start)/1000}));

for(const replay of [false,true])for(let sample=1;sample<=100;sample++){const r=session(new RNG(sample),119,'Raft Race',60,replay,[{total_cost:1,rewards:{pinballs:60}}]);if(r.remaining!==119+r.earned-r.spent)throw Error('Pinball balance mismatch');if(r.reinvested>r.earned||r.reinvested<0)throw Error('Invalid reinvestment');if(r.reinvested!==(replay?Math.max(0,r.spent-119):0))throw Error('Original remainder counted as earned pinballs');}
console.log('Passed gross/remaining/reinvested accounting with original-budget remainders and replay on/off.');
