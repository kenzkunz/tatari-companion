
import {HomeScene,selectRoster,groundLayout} from './home-scene-model.mjs';
const field=document.getElementById('field');
const manifest=await (await fetch(new URL('./assets/homepage/manifest.json',import.meta.url))).json();
const mobile=matchMedia('(max-width: 900px)');
const landscape=field.closest('.landscape');
const dimensions=()=>{const ground=groundLayout(landscape.clientWidth,landscape.clientHeight);field.style.top=ground.top+'px';field.style.bottom=ground.bottom+'px';return {width:field.clientWidth,height:field.clientHeight,size:1.2*Math.min(280,Math.max(150,field.clientWidth*.21))};};
let scene;
const bytes=new Map();
function load(src){if(!bytes.has(src))bytes.set(src,fetch(new URL('./'+src,import.meta.url)).then(r=>{if(!r.ok)throw Error('Animation unavailable');return r.arrayBuffer();}));return bytes.get(src);}
let frame=0,last=0;
let views=[];
function populate(){
 for(const v of views){v.generation++;v.decoder?.close();v.el.remove();}
 scene=new HomeScene(manifest,{...dimensions(),roster:selectRoster(mobile.matches)});
 views=scene.actors.map(a=>{
 const el=document.createElement('div');el.className='home-tatari';el.dataset.name=a.name;el.dataset.variant=a.variant;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const image=document.createElement('img');image.alt='';image.draggable=false;image.hidden=true;el.append(canvas,image);field.append(el);
 return {a,el,canvas,image,ctx:canvas.getContext('2d'),serial:-1,decoder:null,ready:false,busy:false,index:-1,generation:0};
});
 render();start();
}
async function change(v){
 const generation=++v.generation;v.serial=v.a.animationSerial||0;v.ready=false;v.index=-1;v.decoder?.close();v.decoder=null;
 const asset=manifest[v.a.variant][v.a.action];v.asset=asset;v.el.dataset.action=v.a.action;
 try{
  if(!('ImageDecoder' in window))throw Error('Native WebP playback');
  const data=await load(asset.src);if(generation!==v.generation)return;
  const decoder=new ImageDecoder({data:data.slice(0),type:'image/webp',preferAnimation:true});v.decoder=decoder;await decoder.tracks.ready;
  if(generation!==v.generation){decoder.close();return;}v.ready=true;v.canvas.hidden=false;v.image.hidden=true;paint(v,0);
 }catch(error){if(generation!==v.generation)return;v.image.src=new URL('./'+asset.src,import.meta.url);v.image.hidden=false;v.canvas.hidden=true;v.el.dataset.playback='native';}
}
async function paint(v,index){
 if(!v.ready||v.busy||index===v.index)return;v.busy=true;const decoder=v.decoder,generation=v.generation;
 try{const {image}=await decoder.decode({frameIndex:index});if(generation===v.generation){v.ctx.clearRect(0,0,512,512);v.ctx.drawImage(image,0,0,512,512);v.index=index;}image.close();}catch(error){/* A state change can close an in-flight decoder. */}finally{v.busy=false;}
}
function render(){
 for(const v of views){
  const {a,el}=v,asset=manifest[a.variant][a.action],move=manifest[a.variant].Move,size=scene.sizeOf(a);
  el.style.width=size+'px';el.style.height=size+'px';el.style.left=(a.x-size/2)+'px';el.style.top=(a.y-size*move.bounds[3]/512)+'px';el.style.zIndex=String(Math.round(a.y*10));el.style.transform=`scaleX(${a.dir})`;
  if(v.serial!==(a.animationSerial||0))change(v);
  const rate=a.action==='Move'?a.speed/32:a.action==='BurnRun'?2:1;
  let time=(a.elapsed*rate*1000)%Math.max(1,asset.duration*1000),index=0;
  while(index<asset.durations.length-1&&time>=asset.durations[index]){time-=asset.durations[index++];}
  paint(v,index);
 }
}
function animate(now){frame=0;const dt=last?Math.min((now-last)/1000,.05):0;last=now;scene.tick(dt);render();if(!document.hidden)frame=requestAnimationFrame(animate);}
function start(){cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(animate);}
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);if(!document.hidden)start();});
mobile.addEventListener('change',populate);
new ResizeObserver(()=>{if(!scene)return;const {width,height,size}=dimensions();scene.resize(width,height,size);render();}).observe(landscape);
populate();
