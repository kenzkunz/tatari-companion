// Retain filtered batches during navigation; explicit Refresh starts a fresh search.
const searches=new Map();
export function resetEligiblePages(){searches.clear()}
export async function eligiblePage({fetchBatch,isEligible,page,size=20,cancelled=()=>false,cacheKey=null}){
 const start=page*size,needed=start+size+1,batchSize=50;
 let state=cacheKey===null?null:searches.get(cacheKey);
 if(!state){state={eligible:[],offset:0,done:false,pending:null};if(cacheKey!==null)searches.set(cacheKey,state)}
 while(state.eligible.length<needed&&!state.done){
  if(cancelled())return null;
  if(!state.pending){state.pending=(async()=>{const batch=await fetchBatch(state.offset,batchSize);const flags=await Promise.all(batch.map(isEligible));state.eligible.push(...batch.filter((row,i)=>flags[i]));state.offset+=batch.length;state.done=batch.length<batchSize})().finally(()=>{state.pending=null})}
  await state.pending;if(cancelled())return null;
 }
 return {rows:state.eligible.slice(start,start+size),hasNext:state.eligible.length>start+size};
}
