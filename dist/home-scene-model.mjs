export const ROSTER=['Zapup','Pyropup','Sparkit','Frostnip','Frugling'];
export const SIZE_SCALE={Pyropup:1.4,Sparkit:1.2,Frugling:1.4,Frostnip:.85};
export function selectRoster(mobile,random=Math.random){const pool=[...ROSTER];for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,mobile?2:4+Math.floor(random()*2));}
export function groundLayout(width,height){const scale=Math.max(width/1920,height/1080);const horizon=(height-1080*scale)/2+736*scale;const top=horizon+12,bottom=Math.max(24,height*.08);return {top,bottom,height:Math.max(1,height-top-bottom)};}
const walking=action=>action==='Move'||action==='BurnRun';
export class HomeScene {
 constructor(manifest,{random=Math.random,width=1200,height=180,size=240,roster=ROSTER}={}){
  this.random=random;this.manifest=manifest;this.width=width;this.height=height;this.size=size;this.time=0;this.pair=null;this.encounters=new Map();
  this.actors=roster.map((name,i)=>{const variant=name!=='Zapup'&&random()<.03?name+'-Glitter':name;return {name,variant,x:size/2+(width-size)*(i+.5)/roster.length,y:height*(.35+(i%3)*.26),dir:i%2?-1:1,speed:this.range(25,45),targetY:height*(.35+(i%3)*.26),action:'Move',elapsed:0,decision:this.range(6,12),sequence:null};});
 }
 range(a,b){return a+this.random()*(b-a)}
 duration(a,action){return this.manifest[a.variant][action].duration}
 set(a,action){a.action=action;a.elapsed=0;a.animationSerial=(a.animationSerial||0)+1;}
 resume(a){this.set(a,'Move');a.sequence=null;a.decision=this.range(6,14);a.speed=this.range(25,45);a.targetY=this.height*this.range(.35,.9);}
 resize(width,height,size){for(const a of this.actors){a.x=a.x/this.width*width;a.y=a.y/this.height*height;a.targetY=a.targetY/this.height*height;}this.width=width;this.height=height;this.size=size;}
 sizeOf(a){return this.size*(SIZE_SCALE[a.name]||1);}
 body(a){const b=this.manifest[a.variant].Move.bounds;return this.sizeOf(a)*(b[2]-b[0])/512;}
 sequence(a,steps){a.sequence=steps.map(s=>({...s}));this.next(a);}
 next(a){const s=a.sequence.shift();if(!s){this.resume(a);return;}if(s.flip)a.dir*=-1;this.set(a,s.action);a.remaining=s.seconds??this.duration(a,s.action);}
 start(type,a,b){
  if(this.pair)return false;
  const once=action=>({action});const wait=(action,seconds)=>({action,seconds});let sa,sb,total;
  if(type==='battle'){
   const winner=this.random()<.5?a:b,loser=winner===a?b:a;
   const win=[wait('Attack',4),wait('Cheer',5)],lose=[wait('Attack',4),once('Death'),wait('Disable',6)];
   sa=a===winner?win:lose;sb=b===winner?win:lose;total=Math.max(9,10+this.duration(loser,'Death'));
  }else if(type==='stab'){
   sa=[{action:'Stab',seconds:3,flip:true},{action:'Move',seconds:.001,flip:true}];sb=[wait('Move',3)];total=3.001;
  }else if(type==='burn'){
   const run=this.range(4,8);sa=[once('BurnJump'),wait('BurnRun',run),once('BurnJump')];total=2*this.duration(a,'BurnJump')+run;sb=[wait('Move',total)];
  }else if(type==='shock'){
   const attack=this.duration(b,'Attack'),shock=this.duration(a,'Shock');sa=[wait('Idle',attack),once('Shock')];sb=[once('Attack'),wait('Idle',shock)];total=attack+shock;
  }else if(type==='smell'){
   total=this.duration(a,'Smell');sa=[once('Smell'),{action:'Move',seconds:.001,flip:true}];sb=[wait('Idle',total)];total+=.001;
  }else return false;
  this.pair={type,actors:[a.name,b.name],remaining:total};this.sequence(a,sa);this.sequence(b,sb);return true;
 }
 tick(dt){
  dt=Math.min(dt,.1);this.time+=dt;
  for(const a of this.actors){
   a.previousX=a.x;a.elapsed+=dt;
   if(a.sequence){a.remaining-=dt;if(a.remaining<=0)this.next(a);}
   else if(a.action!=='Move'){a.remaining-=dt;if(a.remaining<=0)this.resume(a);}
   else {a.decision-=dt;if(a.decision<=0){const roll=this.random();if(roll<.3){const action=roll<.1?'Rest':roll<.2?'Idle':'Eat';this.set(a,action);a.remaining=action==='Rest'?this.range(10,15):action==='Idle'?this.range(5,15):this.range(4,8);}else{a.decision=this.range(6,14);a.speed=this.range(25,55);a.targetY=this.height*this.range(.35,.9);if(this.random()<.35)a.dir*=-1;}}}
   if(walking(a.action)){
    const rate=a.action==='BurnRun'?2:a.speed/32;a.x+=a.dir*32*rate*dt;a.y+=Math.sign(a.targetY-a.y)*Math.min(Math.abs(a.targetY-a.y),a.speed*.12*dt);
    const margin=this.body(a)/2+4;
    if(a.x<margin){a.x=margin;a.dir=1;}if(a.x>this.width-margin){a.x=this.width-margin;a.dir=-1;}
   }
  }
  if(this.pair){this.pair.remaining-=dt;if(this.pair.remaining<=0){const names=this.pair.actors;this.pair=null;for(const a of this.actors.filter(a=>names.includes(a.name)))if(a.sequence)this.resume(a);}return;}
  for(let i=0;i<this.actors.length;i++)for(let j=i+1;j<this.actors.length;j++){
   const a=this.actors[i],b=this.actors[j],key=i+':'+j;
   if(Math.abs(a.y-b.y)>(this.sizeOf(a)+this.sizeOf(b))*.115)continue;
   const gap=Math.abs(a.x-b.x),contact=(this.body(a)+this.body(b))*.5;
   const opposite=a.dir!==b.dir,moving=a.action==='Move'&&b.action==='Move';
   const approaching=(b.x-a.x)*a.dir>0&&opposite;
   if(moving&&approaching&&gap<=contact*1.08&&gap>=contact*.55&&(this.encounters.get(key+':near')||0)<=this.time){
    this.encounters.set(key+':near',this.time+8);
    const spark=[a,b].find(c=>c.name==='Sparkit'),zap=[a,b].find(c=>c.name==='Zapup');
    if(spark&&zap&&this.random()<.2){this.start('shock',spark,zap);return;}
    if(this.random()<.10){this.start('battle',a,b);return;}
   }
   const frog=[a,b].find(c=>c.name==='Frugling'),other=frog==a?b:a;
   if(frog&&moving&&opposite){
    const passed=(frog.x-other.x)*frog.dir,threshold=this.body(frog)/6+this.body(other)/2;
    const previous=((frog.previousX??frog.x)-(other.previousX??other.x))*frog.dir;
    if(passed>=threshold&&previous<threshold&&(this.encounters.get(key+':pass')||0)<=this.time){
     this.encounters.set(key+':pass',this.time+10);
     if(['Pyropup','Sparkit'].includes(other.name)&&this.random()<.2){this.start('burn',frog,other);return;}
     if(this.random()<.2){this.start('stab',frog,other);return;}
    }
   }
   const pup=[a,b].find(c=>c.name==='Pyropup'),target=pup===a?b:a;
   if(pup&&pup.action==='Move'&&target.action==='Idle'&&pup.dir===target.dir&&(target.x-pup.x)*pup.dir>0&&gap<contact*1.15&&(this.encounters.get(key+':smell')||0)<=this.time){
    this.encounters.set(key+':smell',this.time+10);if(this.random()<.5){this.start('smell',pup,target);return;}
   }
  }
 }
}
