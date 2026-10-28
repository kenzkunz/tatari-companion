import {campPoints,candidates} from './radish-model.mjs?v=2';
import {ATTEMPTS,createRun,beginAttempt,recordResult,setDirection,setDistance,canSetClue,restoreRun,undoAttempt} from './radish-run-state.mjs?v=2';
const $=id=>document.getElementById(id),canvas=$('camp-map'),ctx=canvas.getContext('2d'),viewport=$('map-scroll');
const W=1960,H=1000,step=8,pad=20,viewLeft=646,viewRight=1246;
const surface=document.createElement('div');surface.className='map-surface';viewport.append(surface);surface.append(canvas);
let layout,points=[],clues=[],origin={x:60,y:60},zoom=4,possible=[],background,ready=false;
let renderScale=1,pan=null,pixelRatio=1;const pointers=new Map();let pinch=null,suppressTap=false;const markerImage=new Image();markerImage.onload=()=>draw();markerImage.src=new URL('./radish-assets/aim-reticle.png',import.meta.url).href;
let arrowTint;const arrowImage=new Image(),caughtImage=new Image();for(const [img,file] of [[arrowImage,'direction-arrow.png'],[caughtImage,'caught-radish.png']]){img.onload=()=>{if(img===arrowImage){const tint=document.createElement('canvas');tint.width=img.naturalWidth;tint.height=img.naturalHeight;const c=tint.getContext('2d');c.drawImage(img,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#fff36a';c.fillRect(0,0,tint.width,tint.height);arrowTint=tint;}draw();};img.src=new URL('./radish-assets/'+file,import.meta.url).href;}
const project=(x,y)=>({x:pad+(x+y)*step,y:H/2+(x-y)*step/2});
function diamond(c,x,y,fill,stroke){const p=project(x,y);c.beginPath();c.moveTo(p.x,p.y-step/2);c.lineTo(p.x+step,p.y);c.lineTo(p.x,p.y+step/2);c.lineTo(p.x-step,p.y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=.45;c.stroke();}}
const scenery=new Image();scenery.src=new URL('./radish-assets/camp-map.webp?v=2',import.meta.url).href;
function buildBackground(){background=true;}
function drawBackground(c){
 c.fillStyle='#52abc4';c.fillRect(0,0,W,H);
 if(scenery.complete&&scenery.naturalWidth)c.drawImage(scenery,0,0,W,H);
 const camp=new Set(points.map(p=>p.x+','+p.y));
 for(const p of points)diamond(c,p.x,p.y,'rgba(190,229,237,.18)','rgba(24,85,100,.3)');
 c.beginPath();
 for(const {x,y} of points){const p=project(x,y),top=[p.x,p.y-step/2],right=[p.x+step,p.y],bottom=[p.x,p.y+step/2],left=[p.x-step,p.y];
  for(const [dx,dy,a,b] of [[0,1,top,right],[1,0,right,bottom],[0,-1,bottom,left],[-1,0,left,top]])if(!camp.has((x+dx)+','+(y+dy))){c.moveTo(...a);c.lineTo(...b);}}
 c.strokeStyle='#faffef';c.lineWidth=2;c.stroke();
 for(const [x0,y0,x1,y1,special] of layout.regions)if(special)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)diamond(c,x,y,'#d7c19a','#9a825c');
}
const terrain=new Map(),terrainUndo=[],terrainKey='radish-camp-terrain-v1';
let mapMode='search',campCells=new Set(),terrainStroke=null;
function saveTerrain(){try{localStorage.setItem(terrainKey,JSON.stringify([...terrain]));$('terrain-status').textContent=terrain.size+' marked cells · saved on this device';}catch{$('terrain-status').textContent=terrain.size+' marked cells · available for this visit';}}
function terrainChanged(){ $('terrain-undo').disabled=!terrainUndo.length;draw(); }
function snapshotTerrain(){terrainUndo.push([...terrain]);if(terrainUndo.length>30)terrainUndo.shift();}
function setMapMode(mode){mapMode=mode;for(const b of document.querySelectorAll('[data-map-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mapMode===mode));viewport.dataset.mode=mode;$('terrain-hint').textContent=mode==='search'?'Tap a search point. Swipe or drag to move; pinch or scroll to zoom.':mode==='move'?'Swipe or drag to move; pinch or scroll to zoom.':'Tap or drag to paint '+mode+'. Only camp cells can be edited.';if(layout)render(false);}
for(const b of document.querySelectorAll('[data-map-mode]'))b.onclick=()=>setMapMode(b.dataset.mapMode);
$('terrain-undo').onclick=()=>{const previous=terrainUndo.pop();if(!previous)return;terrain.clear();for(const [key,value] of previous)terrain.set(key,value);saveTerrain();terrainChanged();};
$('terrain-reset').onclick=()=>{if(!terrain.size)return;snapshotTerrain();terrain.clear();saveTerrain();terrainChanged();};
function paintCell(x,y){const radius=Number($('terrain-brush').value);for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const key=(x+dx)+','+(y+dy);if(campCells.has(key))terrain.set(key,mapMode);}}
function paintAt(e){const p=mapPoint(e);if(!p)return;const last=terrainStroke.last||p,n=Math.max(Math.abs(p.x-last.x),Math.abs(p.y-last.y),1);for(let i=0;i<=n;i++)paintCell(Math.round(last.x+(p.x-last.x)*i/n),Math.round(last.y+(p.y-last.y)*i/n));terrainStroke.last=p;terrainChanged();}
function drawTerrain(){for(const [key,type] of terrain){const [x,y]=key.split(',').map(Number);diamond(ctx,x,y,type==='ground'?'#b6cf87':'#70bfd4',type==='ground'?'#8aa45d':'#4497b0');}}
function draw(){if(!background)return;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(pixelRatio*renderScale,0,0,pixelRatio*renderScale,-(viewLeft*renderScale+viewport.scrollLeft)*pixelRatio,-viewport.scrollTop*pixelRatio);drawBackground(ctx);drawTerrain();if(clues.length)for(const p of possible)diamond(ctx,p.x,p.y,'rgba(255,196,62,.72)','#9d6b00');for(let i=0;i<clues.length;i++){const p=project(clues[i].x,clues[i].y);ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fillStyle='#6b6388';ctx.fill();ctx.fillStyle='white';ctx.font='bold 10px Poppins,sans-serif';ctx.textAlign='center';ctx.fillText(String(clues[i].attempt),p.x,p.y+3);}const p=project(origin.x,origin.y);ctx.beginPath();ctx.ellipse(p.x,p.y,3*Math.SQRT2*step,3*Math.SQRT2*step/2,0,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.09)';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2/renderScale;ctx.stroke();const markerSize=30/renderScale;if(markerImage.complete&&markerImage.naturalWidth)ctx.drawImage(markerImage,p.x-markerSize/2,p.y-markerSize/2,markerSize,markerSize);else{ctx.fillStyle='#ffd457';ctx.strokeStyle='#74401a';ctx.lineWidth=2/renderScale;ctx.font='bold '+(20/renderScale)+'px Poppins,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeText('!',p.x,p.y);ctx.fillText('!',p.x,p.y);ctx.textBaseline='alphabetic';}drawCaught();drawAnchor();}

function size(center=false){
 renderScale=(viewport.clientWidth/W)*zoom;pixelRatio=window.devicePixelRatio||1;
 surface.style.width=((viewRight-viewLeft)*renderScale)+'px';surface.style.height=(H*renderScale)+'px';
 const width=viewport.clientWidth,height=viewport.clientHeight;
 canvas.style.width=width+'px';canvas.style.height=height+'px';canvas.style.margin='0';
 const bw=Math.round(width*pixelRatio),bh=Math.round(height*pixelRatio);if(canvas.width!==bw)canvas.width=bw;if(canvas.height!==bh)canvas.height=bh;
 $('zoom-value').textContent=Math.round((zoom/4-1)*100)+'%';$('zoom-out').disabled=zoom<=4;$('zoom-in').disabled=zoom>=12;
 if(center){const p=project(origin.x,origin.y);viewport.scrollLeft=(p.x-viewLeft)*renderScale-width/2;viewport.scrollTop=p.y*renderScale-height/2;}draw();
}
function viewPoint(e){const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left-viewport.clientLeft,y:e.clientY-r.top-viewport.clientTop};}
function worldAt(p){return {x:viewLeft+(p.x+viewport.scrollLeft)/renderScale,y:(p.y+viewport.scrollTop)/renderScale};}
function zoomTo(value,at={x:viewport.clientWidth/2,y:viewport.clientHeight/2},anchor=worldAt(at)){zoom=Math.max(4,Math.min(12,value));size();viewport.scrollLeft=(anchor.x-viewLeft)*renderScale-at.x;viewport.scrollTop=anchor.y*renderScale-at.y;draw();}
viewport.addEventListener('wheel',e=>{e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1);zoomTo(zoom*Math.exp(-delta*.0015),viewPoint(e));},{passive:false});
let drawQueued=false;viewport.addEventListener('scroll',()=>{if(!drawQueued){drawQueued=true;requestAnimationFrame(()=>{drawQueued=false;draw();});}},{passive:true});
function setOrigin(x,y){origin={x:Math.max(0,Math.min(119,Math.round(x))),y:Math.max(0,Math.min(119,Math.round(y)))};render();}
function mapPoint(e){if(!layout)return null;const local=viewPoint(e);if(local.x<0||local.y<0||local.x>viewport.clientWidth||local.y>viewport.clientHeight)return null;const p=worldAt(local),wx=(p.x-pad)/step,wy=(p.y-H/2)/(step/2);return {x:Math.round((wx+wy)/2),y:Math.round((wx-wy)/2)};}
function selectMapPoint(e){const p=mapPoint(e);if(p)setOrigin(p.x,p.y);}
function touchPair(){const [a,b]=[...pointers.values()];return {distance:Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY),mid:viewPoint({clientX:(a.clientX+b.clientX)/2,clientY:(a.clientY+b.clientY)/2})};}
function cancelHold(){if(pan?.holdTimer){clearTimeout(pan.holdTimer);pan.holdTimer=null;}}
viewport.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;pointers.set(e.pointerId,{clientX:e.clientX,clientY:e.clientY});viewport.setPointerCapture(e.pointerId);
 if(pointers.size===2){cancelHold();if(terrainStroke){terrainStroke=null;saveTerrain();}pan=null;suppressTap=true;const pair=touchPair();pinch={distance:Math.max(1,pair.distance),zoom,anchor:worldAt(pair.mid)};return;}
 if(pointers.size>2||suppressTap)return;
 if(mapMode==='ground'||mapMode==='water'){snapshotTerrain();terrainStroke={id:e.pointerId,last:null,startX:e.clientX,startY:e.clientY};if(e.pointerType!=='touch')paintAt(e);return;}
 pan={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false,aim:false,holdTimer:null};
 if(e.pointerType==='touch'&&mapMode==='search'&&hasClueTarget())pan.holdTimer=setTimeout(()=>{if(!pan||pan.id!==e.pointerId||pan.moved||pointers.size!==1)return;pan.aim=true;aiming=true;previewArrow(pointers.get(e.pointerId));render(false);},450);
});
viewport.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId)){if(aiming&&e.pointerType!=='touch'&&mapMode==='search')previewArrow(e);return;}
 pointers.set(e.pointerId,{clientX:e.clientX,clientY:e.clientY});
 if(pinch&&pointers.size>=2){const pair=touchPair();zoomTo(pinch.zoom*pair.distance/pinch.distance,pair.mid,pinch.anchor);e.preventDefault();return;}
 if(suppressTap)return;if(terrainStroke&&e.pointerId===terrainStroke.id){if(terrainStroke.last||Math.hypot(e.clientX-terrainStroke.startX,e.clientY-terrainStroke.startY)>5)paintAt(e);e.preventDefault();return;}
 if(!pan||e.pointerId!==pan.id)return;if(pan.aim){previewArrow(e);e.preventDefault();return;}
 const dx=e.clientX-pan.x,dy=e.clientY-pan.y;if(Math.hypot(dx,dy)>5){pan.moved=true;cancelHold();}
 if(pan.moved){viewport.classList.add('is-dragging');viewport.scrollLeft=pan.left-dx;viewport.scrollTop=pan.top-dy;e.preventDefault();}
});
function endPan(e){
 if(!pointers.has(e.pointerId))return;const hold=e.type==='pointerup'&&pan?.aim,select=e.type==='pointerup'&&!suppressTap&&pan&&!pan.moved&&!pan.aim&&mapMode==='search';
 cancelHold();pointers.delete(e.pointerId);if(terrainStroke&&terrainStroke.id===e.pointerId){if(e.type==='pointerup'&&!terrainStroke.last)paintAt(e);terrainStroke=null;saveTerrain();}
 pan=null;pinch=null;viewport.classList.remove('is-dragging');if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);
 if(hold)lockArrow();else if(select){if(aiming){if(e.pointerType!=='touch'){previewArrow(e);lockArrow();}else $('aim-hint').textContent='Hold on the map, aim from the anchor, then release to lock the arrow.';}else selectMapPoint(e);}
 if(!pointers.size)suppressTap=false;else suppressTap=true;
}
viewport.addEventListener('pointerup',endPan);viewport.addEventListener('pointercancel',endPan);viewport.addEventListener('lostpointercapture',endPan);viewport.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('keydown',e=>{
 if(aiming&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();draftAngle=((draftAngle??0)+(['ArrowRight','ArrowUp'].includes(e.key)?1:-1)+360)%360;$('angle').value=Math.round(draftAngle);$('angle-value').textContent=$('angle').value+'°';draw();return;}
 const d={ArrowRight:[1,1],ArrowLeft:[-1,-1],ArrowUp:[-1,1],ArrowDown:[1,-1]}[e.key];
 if(d){e.preventDefault();setOrigin(origin.x+d[0],origin.y+d[1]);}
 else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(mapMode==='ground'||mapMode==='water'){snapshotTerrain();paintCell(origin.x,origin.y);saveTerrain();terrainChanged();}else if(aiming)lockArrow();else if(!$('go').disabled)$('go').click();}
});

const runKey='radish-search-run-v1';
let run=createRun(),aiming=false,draftAngle=null;
const lastSearch=()=>run.attempts.at(-1);
const hasClueTarget=()=>canSetClue(run);
function saveRun(){try{localStorage.setItem(runKey,JSON.stringify({run,origin}));}catch{}}
function restoreSavedRun(){try{const saved=JSON.parse(localStorage.getItem(runKey)||'null');if(saved){run=restoreRun(saved.run);const p=saved.origin;if(p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<120&&p.y>=0&&p.y<120)origin={...p};aiming=hasClueTarget()&&lastSearch().angle===null;draftAngle=lastSearch()?.angle??null;}}catch{run=createRun();}}
function render(save=true){
 clues=run.clues;possible=candidates(points,clues);const used=run.attempts.length,last=lastSearch(),miss=hasClueTarget();
 $('attempt-boxes').replaceChildren();for(let i=0;i<ATTEMPTS;i++){const box=document.createElement('li');box.textContent=String(i+1);box.classList.toggle('used',i<used);box.setAttribute('aria-label','Attempt '+(i+1)+(i<used?' used':' available'));$('attempt-boxes').append(box);}
 $('run-score').textContent=(ATTEMPTS-used)+' attempts left · '+run.caught+' caught';
 $('reset-run').hidden=used<ATTEMPTS;$('undo-attempt').disabled=!used;
 $('go').disabled=!ready||run.phase!=='ready'||aiming||['ground','water'].includes(mapMode);
 $('go-hint').textContent=used===ATTEMPTS?'All six attempts used.':run.phase==='result'?'Record the result of this search.':run.phase==='clue'||aiming?'Set the arrow and distance clue.':'Place the ring, then press Go.';
 $('point-label').textContent=origin.x===60&&origin.y===60?'Center ring selected':'Ring ready at your selected point';
 $('arrow-fields').disabled=!miss||run.phase==='result';$('distance-fields').disabled=!miss||last.angle===null||aiming;
 $('lock-arrow').disabled=!miss||!aiming;$('aim-again').disabled=!miss||aiming;
 $('angle').value=draftAngle??last?.angle??0;$('angle-value').textContent=$('angle').value+'°';
 for(const radio of document.querySelectorAll('[name=band]'))radio.checked=miss&&radio.value===last.band;
 $('clue-title').textContent=miss?(aiming?'Aim from the anchor':'Match the indicator'):used===ATTEMPTS?'Run complete':'Ready to search';
 $('aim-hint').textContent=miss?(aiming?(last.result==='found'?'Next radish: ':'')+'Move your pointer from the anchor and click to lock. On a phone, hold, aim, and release.':last.band?'Clue saved. Place the next ring and press Go, or aim again to correct this arrow.':'Arrow locked. Choose Near, Medium, or Far.'):used===ATTEMPTS?'Use Reset run for a fresh set of six attempts.':'Use the center ring or choose a point, press Go, then record Found or Not found.';
 $('map-status').textContent=run.phase==='result'?'Did you find a radish?':aiming?'Aim from the search anchor · click or hold to set':clues.length?(possible.length?possible.length.toLocaleString()+' possible grids':'Clues do not overlap'):used===ATTEMPTS?'Run complete · '+run.caught+' caught':'Choose a ring position · '+(ATTEMPTS-used)+' attempts left';
 $('result-count').classList.toggle('conflict',clues.length>0&&!possible.length);
 $('result-count').textContent=clues.length?(possible.length?possible.length.toLocaleString()+' possible grids':'Clues do not overlap'):run.phase==='clue'?'Set the search clue':used===ATTEMPTS?'Run complete':run.caught?'Ready for the next radish':'Ready for attempt '+(used+1);
 $('result-message').textContent=clues.length?(possible.length?'Yellow cells match the clues for the current radish.':'Check the anchor, arrow, and distance indicator. Aim again to correct the latest clue.'):run.phase==='clue'?'Lock the arrow from the anchor, then choose the distance indicator.':used===ATTEMPTS?run.caught+' radish'+(run.caught===1?'':'es')+' caught in six attempts.':'The ring marks your next search. Go works from the default center too.';
 $('run-history').replaceChildren();run.attempts.forEach((a,i)=>{const li=document.createElement('li');li.textContent='Attempt '+(i+1)+' · '+(a.result==='found'?'Found':a.result==='miss'?'Not found':'Awaiting result');if(a.result==='miss'||a.result==='found'&&a.angle!==null){const detail=document.createElement('span');detail.textContent=(a.result==='found'?'Next radish · ':'')+(a.angle===null?'Set the arrow direction':a.angle+'° · '+({near:'Near',mid:'Medium',far:'Far'}[a.band]||'Choose indicator'));li.append(detail);}$('run-history').append(li);});
 if(save)saveRun();draw();
}
function openResult(){if(!$('search-result').open){$('search-result-description').textContent='Attempt '+run.attempts.length+' of '+ATTEMPTS+'. Record what happened in the game.';$('search-result').showModal();}}
$('go').onclick=()=>{try{run=beginAttempt(run,origin);aiming=false;draftAngle=null;render();openResult();}catch(error){$('form-error').textContent=error.message;}};
function chooseResult(result){run=recordResult(run,result);aiming=canSetClue(run);draftAngle=null;$('search-result').close();setMapMode('search');render();canvas.focus({preventScroll:true});}
$('result-found').onclick=()=>chooseResult('found');$('result-missed').onclick=()=>chooseResult('miss');
$('search-result').addEventListener('cancel',e=>e.preventDefault());
function undoSearch(){run=undoAttempt(run);origin={...(lastSearch()?.point||{x:60,y:60})};aiming=hasClueTarget()&&lastSearch().angle===null;draftAngle=lastSearch()?.angle??null;$('form-error').textContent='';render();size(true);}
$('cancel-search').onclick=()=>{$('search-result').close();undoSearch();};$('undo-attempt').onclick=undoSearch;
$('reset-run').onclick=()=>{run=createRun();origin={x:60,y:60};aiming=false;draftAngle=null;zoom=4;$('form-error').textContent='';setMapMode('search');render();size(true);};
function previewArrow(e){if(!hasClueTarget())return;const p=worldAt(viewPoint(e)),a=project(lastSearch().point.x,lastSearch().point.y);if(Math.hypot(p.x-a.x,p.y-a.y)<2/renderScale)return;draftAngle=(Math.atan2(a.y-p.y,p.x-a.x)*180/Math.PI+360)%360;$('angle').value=Math.round(draftAngle)%360;$('angle-value').textContent=$('angle').value+'°';draw();}
function lockArrow(){if(!hasClueTarget())return;run=setDirection(run,draftAngle??lastSearch().angle??0);draftAngle=lastSearch().angle;aiming=false;render();openDistance();}
$('lock-arrow').onclick=lockArrow;$('aim-again').onclick=()=>{if(!hasClueTarget())return;aiming=true;draftAngle=lastSearch().angle;setMapMode('search');render();canvas.focus({preventScroll:true});};
$('angle').addEventListener('input',()=>{aiming=true;draftAngle=Number($('angle').value);$('angle-value').textContent=draftAngle+'°';draw();});$('angle').addEventListener('change',lockArrow);
function applyDistance(band){if(!hasClueTarget()||lastSearch().angle===null)return;run=setDistance(run,band);$('distance-dialog').close();render();canvas.focus({preventScroll:true});}
function openDistance(){if(hasClueTarget()&&lastSearch().angle!==null&&!$('distance-dialog').open)$('distance-dialog').showModal();}
for(const radio of document.querySelectorAll('[name=band]'))radio.addEventListener('change',()=>{if(radio.checked)applyDistance(radio.value);});
for(const button of document.querySelectorAll('[data-distance]'))button.onclick=()=>applyDistance(button.dataset.distance);
$('distance-back').onclick=()=>$('distance-dialog').close();
function drawCaught(){if(!caughtImage.complete||!caughtImage.naturalWidth)return;const w=45/renderScale,h=w*caughtImage.naturalHeight/caughtImage.naturalWidth;for(const a of run.attempts)if(a.result==='found'){const p=project(a.point.x,a.point.y);ctx.drawImage(caughtImage,p.x-w/2,p.y-h*.65,w,h);}}
function drawAnchor(){const last=lastSearch();if(!last)return;const p=project(last.point.x,last.point.y);if(last.result!=='found'){ctx.beginPath();ctx.arc(p.x,p.y,6/renderScale,0,Math.PI*2);ctx.fillStyle='#246b8f';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2/renderScale;ctx.stroke();}if(!hasClueTarget())return;const angle=aiming?draftAngle:last.angle;if(angle===null||!arrowImage.complete||!arrowImage.naturalWidth)return;const count={near:1,mid:2,far:3}[last.band]||1;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-angle*Math.PI/180);const size=30/renderScale;for(let i=0;i<count;i++){ctx.save();ctx.globalAlpha=[.4,.68,1][3-count+i];ctx.shadowColor='#ffe731';ctx.shadowBlur=8/renderScale;const x=(24+i*25)/renderScale;ctx.drawImage(arrowTint||arrowImage,x,-size/2,size,size);ctx.globalCompositeOperation='source-atop';ctx.restore();}ctx.restore();}

$('zoom-in').onclick=()=>zoomTo(zoom+1);$('zoom-out').onclick=()=>zoomTo(zoom-1);$('fit').onclick=()=>{zoom=4;size(true);};new ResizeObserver(()=>size()).observe(viewport);
try{const response=await fetch(new URL('./radish-layout.json?v=2',import.meta.url));if(!response.ok)throw Error();layout=await response.json();points=campPoints(layout);campCells=new Set(points.map(p=>p.x+','+p.y));try{const saved=JSON.parse(localStorage.getItem(terrainKey)||'[]');if(Array.isArray(saved))for(const entry of saved)if(Array.isArray(entry)&&campCells.has(entry[0])&&['ground','water'].includes(entry[1]))terrain.set(entry[0],entry[1]);}catch{}saveTerrain();await scenery.decode().catch(()=>{});buildBackground();restoreSavedRun();ready=true;setMapMode('search');render();size(true);if(run.phase==='result')openResult();}catch{$('result-count').textContent='Map unavailable';$('result-message').textContent='Please reload to try again.';$('go').disabled=true;}
