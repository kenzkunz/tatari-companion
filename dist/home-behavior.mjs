export const ROSTER=['Zapup','Frostnip','Pyropup','Frugling','Blueflick','Sparkit'];
export const ambientAction=random=>{const roll=random();return roll<.8?'Move':roll<.9?'Rest':'Eat'};
export const appearance=(variants,random)=>random()<.01&&variants.color_1?'color_1':'default';
export function createWorld(manifest,{random=Math.random,count=5}={}){
 const pool=[...ROSTER];for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 const walkers=pool.slice(0,Math.min(5,count)).map((name,i)=>({name,variant:appearance(manifest[name],random),x:(i+.5)/Math.min(count,5),target:random(),dir:1,speed:.024+random()*.018,action:'Move',loops:Infinity,queue:[],ready:false,cooldown:0,special:0,inside:false,token:0,timer:0}));
 const clips=c=>manifest[c.name][c.variant];
 function set(c,action,loops=1){c.action=clips(c)[action]?action:'Idle';c.loops=loops;c.timer=0;c.ready=false;c.token++;}
 function resume(c){c.queue=[];c.target=.03+random()*.94;c.speed=.024+random()*.018;c.dir=c.target>=c.x?1:-1;set(c,'Move',Infinity)}
 function sequence(c,actions){c.queue=actions.slice(1);set(c,actions[0].action,actions[0].loops??1)}
 function loopEnded(c){if(c.action==='Move'||c.action==='Disable')return;if(--c.loops>0)return;if(c.queue.length){const next=c.queue.shift();set(c,next.action,next.loops??1)}else resume(c)}
 function reactToAnger(pyro){for(const c of walkers)if(c.name==='Zapup'&&c.action==='Move'&&random()<.8){c.dir=pyro.x>=c.x?1:-1;sequence(c,[{action:'HowlB',loops:1}]);c.cooldown=8}}
 function encounter(a,b){a.cooldown=b.cooldown=10;a.dir=b.x>=a.x?1:-1;b.dir=-a.dir;const frug=[a,b].find(c=>c.name==='Frugling');if(frug&&random()<.2){sequence(frug,[{action:'Stab'}]);return}
 const zap=[a,b].find(c=>c.name==='Zapup'),spark=[a,b].find(c=>c.name==='Sparkit');if(zap&&spark&&random()<.5){sequence(zap,[{action:'HowlA',loops:1}]);sequence(spark,[{action:'Shock',loops:1}]);return}
 if(random()<.5){const winner=random()<.5?a:b,loser=winner===a?b:a;sequence(winner,[{action:'Attack',loops:2},{action:'Cheer',loops:2}]);sequence(loser,[{action:'Attack',loops:2},{action:'Death',loops:1},{action:'Disable',loops:1}]);return}
 const faster=random()<.5?a:b;faster.speed*=1.7;
 }
 const previous=new Map();
 function tick(dt){for(const c of walkers){c.cooldown=Math.max(0,c.cooldown-dt);c.special=Math.max(0,c.special-dt);if(!c.ready)continue;if(c.action==='Disable'){c.timer+=dt;if(c.timer>=3)resume(c);continue}if(c.fallback&&c.action!=='Move'){c.timer+=dt;const duration=Math.max(.01,clips(c)[c.action].duration);if(c.timer>=duration){c.timer-=duration;loopEnded(c)}}if(c.action!=='Move')continue;c.dir=c.target>=c.x?1:-1;c.x+=c.dir*c.speed*dt;if(Math.abs(c.target-c.x)<.006){c.x=c.target;const action=ambientAction(random);if(action==='Move')resume(c);else sequence(c,[{action,loops:action==='Rest'?10:2}]);continue}const middle=Math.abs(c.x-.5)<.1;if(c.name==='Pyropup'&&middle&&!c.inside&&c.special===0){c.special=12;if(random()<.1){sequence(c,[{action:'Anger'}]);reactToAnger(c)}}c.inside=middle;}
 for(let i=0;i<walkers.length;i++)for(let j=i+1;j<walkers.length;j++){const a=walkers[i],b=walkers[j],key=i+':'+j,diff=a.x-b.x,old=previous.get(key);previous.set(key,diff);if(old!==undefined&&old*diff<0){const frug=[a,b].find(c=>c.name==='Frugling'),other=frug===a?b:a;if(frug&&frug.action==='Move'&&['Sparkit','Pyropup','Blueflick'].includes(other.name)&&random()<.1)sequence(frug,[{action:'BurnJump'}])}if(a.action==='Move'&&b.action==='Move'&&!a.cooldown&&!b.cooldown&&Math.abs(diff)<.07)encounter(a,b)}
 }
 return {walkers,tick,loopEnded,resume,sequence,encounter};
}
