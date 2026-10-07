import './navigation.mjs';
import {randomWalkSpeed,avoidCrowding} from './walking.mjs';
// Only the user's eight tier-1 Tataris are eligible.
const roster=['Zapup','Frostnip','Pyropup','Frugling','Blueflick','Sparkit','Cheerling','Punchimp'];
const pool=[...roster];for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
const selected=pool.slice(0,3+Math.floor(Math.random()*3));
const mobile=matchMedia('(max-width: 900px)'),mobileCount=1+Math.floor(Math.random()*2);
const field=document.getElementById('field');let last=0,frame=0;
let critters=[];
function populate(){field.replaceChildren();const visible=selected.slice(0,mobile.matches?mobileCount:selected.length);critters=visible.map((name,i)=>{const image=document.createElement('img');image.className='tatari';image.alt='';image.draggable=false;image.dataset.tier='1';image.dataset.name=name;image.src='assets/'+name.toLowerCase()+'-walk.gif';image.style.bottom=(i%3*2)+'%';image.style.zIndex=String(3-i%3);field.append(image);const x=(i+.3)/visible.length;return{name,image,x,target:Math.random(),speed:randomWalkSpeed(),size:image.getBoundingClientRect().width,wait:0,avoid:0};});critters.forEach(render);}
mobile.addEventListener('change',populate);
function render(c){const width=field.clientWidth,size=c.image.getBoundingClientRect().width,travel=Math.max(0,width-size);c.image.style.left=(c.x*travel)+'px';c.image.style.transform=`scaleX(${c.target>=c.x?1:-1})`;}
function animate(now){frame=0;if(document.hidden)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;avoidCrowding(critters,field.clientWidth,dt);critters.forEach(c=>{if(c.wait>0)c.wait-=dt;else{c.x+=Math.sign(c.target-c.x)*c.speed*dt;if(Math.abs(c.target-c.x)<.004){c.x=c.target;c.target=.02+Math.random()*.96;c.speed=randomWalkSpeed();c.wait=.4+Math.random()*.8;}}render(c);});frame=requestAnimationFrame(animate);}
function start(){cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(animate);}
document.addEventListener('visibilitychange',start);new ResizeObserver(()=>critters.forEach(c=>{c.size=c.image.getBoundingClientRect().width;render(c);})).observe(field);populate();start();
