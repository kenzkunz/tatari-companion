let serverAvailable;
export async function readyExchangePage(client,payload,page,size){
 if(serverAvailable===false)return null;
 const response=await client.rpc('exchange_search_ready',{...payload,p_offset:page*size,p_limit:size+1});
 if(response.error){if(['PGRST202','42883'].includes(response.error.code)){serverAvailable=false;return null}throw response.error}
 serverAvailable=true;const records=response.data||[];return {rows:records.slice(0,size),hasNext:records.length>size};
}
