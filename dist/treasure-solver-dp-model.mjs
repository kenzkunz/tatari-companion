// Row-major frontier DP, written for this solver. Rectangles start at their
// top-left cell; the frontier records occupancy ahead of the current cell.
export function exactDP(set,n,blocked,found,{stateBudget=600000,timeBudget=2500}={}){
 if(n>8)return null;
 const groups=new Map();
 for(const t of set.treasures){const remaining=t.count-found.filter(p=>p.id===t.id).length;if(remaining<0)return {error:'Too many copies of this treasure.'};if(!remaining)continue;const dims=t.rotate?[Math.min(t.width,t.height),Math.max(t.width,t.height)]:[t.width,t.height],key=dims.join(',')+','+t.rotate;const g=groups.get(key)||{w:dims[0],h:dims[1],rotate:t.rotate,count:0};g.count+=remaining;groups.set(key,g);}
 const types=[...groups.values()],steps=[];let radix=1,initial=0;
 for(const t of types){steps.push(radix);initial+=t.count*radix;radix*=t.count+1;}
 const M=n*n,choices=Array.from({length:M},()=>[]);
 for(let pos=0;pos<M;pos++)for(let type=0;type<types.length;type++){const t=types[type];for(const [w,h] of [[t.w,t.h],...(t.rotate&&t.w!==t.h?[[t.h,t.w]]:[])]){if(pos%n+w>n||Math.floor(pos/n)+h>n)continue;let bits=0;const cells=[];let valid=true;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const offset=y*n+x,c=pos+offset;if(offset>=31||blocked.has(c))valid=false;bits|=1<<offset;cells.push(c);}if(valid)choices[pos].push({type,bits,cells});}}
 const free=Array(M+1).fill(0);for(let i=M-1;i>=0;i--)free[i]=free[i+1]+(blocked.has(i)?0:1);
 const area=Array.from({length:radix},(_,code)=>types.reduce((a,t,i)=>a+(Math.floor(code/steps[i])%(t.count+1))*t.w*t.h,0));
 function popcount(mask){let c=0;while(mask){mask&=mask-1;c++;}return c;}
 const memo=Array.from({length:M},()=>new Map()),start=Date.now();let states=0,aborted=false;
 const has=(code,type)=>Math.floor(code/steps[type])%(types[type].count+1)>0;
 function suffix(pos,mask,code){if(aborted)return 0;if(code===0)return 1;if(area[code]>free[pos]-popcount(mask))return 0;if(pos===M)return code===0&&mask===0?1:0;const key=mask*radix+code,cache=memo[pos];if(cache.has(key))return cache.get(key);if(++states>stateBudget||(states%1024===0&&Date.now()-start>timeBudget)){aborted=true;return 0;}let total=suffix(pos+1,mask>>>1,code);if(!(mask&1)&&!blocked.has(pos))for(const p of choices[pos])if(has(code,p.type)&&!(mask&p.bits))total+=suffix(pos+1,(mask|p.bits)>>>1,code-steps[p.type]);if(!Number.isSafeInteger(total)){aborted=true;return 0;}cache.set(key,total);return total;}
 const total=suffix(0,0,initial);if(aborted)return null;if(!total)return {error:'These observations leave no valid layouts. Undo or correct a tile.'};
 const coverage=Array(M).fill(0);let forward=new Map([[initial,1]]);
 function completions(pos,mask,code){return code===0?1:pos===M?(code===0&&mask===0?1:0):(memo[pos].get(mask*radix+code)||0);}
 for(let pos=0;pos<M;pos++){const next=new Map();for(const [key,prefix] of forward){const mask=Math.floor(key/radix),code=key%radix;function edge(nextMask,nextCode,placed){const count=completions(pos+1,nextMask,nextCode);if(!count)return;const k=nextMask*radix+nextCode;next.set(k,(next.get(k)||0)+prefix);if(placed)for(const c of placed.cells)coverage[c]+=prefix*count;}edge(mask>>>1,code,null);if(!(mask&1)&&!blocked.has(pos))for(const p of choices[pos])if(has(code,p.type)&&!(mask&p.bits))edge((mask|p.bits)>>>1,code-steps[p.type],p);}forward=next;}
 return {probabilities:coverage.map(c=>c/total),effective:total,accepted:total,exact:true,method:'dp',states};
}
