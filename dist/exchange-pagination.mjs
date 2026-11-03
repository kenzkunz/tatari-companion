// Filter source batches before applying the visible page offset.
export async function eligiblePage({fetchBatch,isEligible,page,size=20,cancelled=()=>false}){
 const start=page*size,needed=start+size+1,eligible=[];let offset=0;
 while(eligible.length<needed){if(cancelled())return null;const batch=await fetchBatch(offset,size);if(cancelled())return null;const flags=await Promise.all(batch.map(isEligible));if(cancelled())return null;eligible.push(...batch.filter((row,i)=>flags[i]));offset+=batch.length;if(batch.length<size)break}
 return {rows:eligible.slice(start,start+size),hasNext:eligible.length>start+size};
}
