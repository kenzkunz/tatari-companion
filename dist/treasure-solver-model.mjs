export function cellsOf(p,n){return Array.from({length:p.w*p.h},(_,i)=>(p.y+Math.floor(i/p.w))*n+p.x+i%p.w);}
export function placements(t,n){const out=[];for(const [w,h] of [[t.width,t.height],...(t.rotate&&t.width!==t.height?[[t.height,t.width]]:[])])for(let y=0;y<=n-h;y++)for(let x=0;x<=n-w;x++)out.push({id:t.id,x,y,w,h,cells:cellsOf({x,y,w,h},n)});return out;}
export function estimate(set,n,empty,found,{limit=50000,milliseconds=1800,random=Math.random}={}){
 const blocked=new Set([...empty,...found.flatMap(p=>cellsOf(p,n))]);
 const pieces=[];for(const t of set.treasures){const count=t.count-found.filter(p=>p.id===t.id).length;if(count<0)return {error:'Too many copies of this treasure.'};const options=placements(t,n).filter(p=>p.cells.every(c=>!blocked.has(c)));for(let i=0;i<count;i++)pieces.push(options);}
 pieces.sort((a,b)=>a.length-b.length);if(pieces.some(p=>!p.length))return {error:'These observations leave no valid treasure placement. Undo or correct a tile.'};
 const exactSums=Array(n*n).fill(0),occupied=new Set(blocked),path=[];let exactCount=0,nodes=0,aborted=false;const exactStart=Date.now();
 function visit(depth){if(aborted)return;if(++nodes>200000||Date.now()-exactStart>300){aborted=true;return;}if(depth===pieces.length){exactCount++;for(const p of path)for(const c of p.cells)exactSums[c]++;return;}for(const p of pieces[depth]){if(p.cells.some(c=>occupied.has(c)))continue;p.cells.forEach(c=>occupied.add(c));path.push(p);visit(depth+1);path.pop();p.cells.forEach(c=>occupied.delete(c));if(aborted)return;}}
 visit(0);if(!aborted){if(!exactCount)return {error:'These observations leave no valid layouts. Undo or correct a tile.'};return {probabilities:exactSums.map(v=>v/exactCount),effective:exactCount,accepted:exactCount,exact:true};}
 const sums=Array(n*n).fill(0);let total=0,squares=0,accepted=0;const start=Date.now();
 for(let k=0;k<limit&&Date.now()-start<milliseconds;k++){const used=new Set(blocked),chosen=[];let weight=1,valid=true;for(const options of pieces){const available=options.filter(p=>p.cells.every(c=>!used.has(c)));if(!available.length){valid=false;break;}weight*=available.length;const p=available[Math.floor(random()*available.length)];chosen.push(p);p.cells.forEach(c=>used.add(c));}if(!valid)continue;accepted++;total+=weight;squares+=weight*weight;for(const p of chosen)for(const c of p.cells)sums[c]+=weight;}
 if(!accepted)return {error:'No valid layouts were found in this run. Check observations or retry; this does not prove the board is impossible.'};
 return {probabilities:sums.map(v=>v/total),effective:total*total/squares,accepted};
}
