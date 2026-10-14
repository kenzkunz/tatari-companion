let client;async function rpc(name,args={}){client??=await import('./auth-client.mjs');const {data,error}=await client.supabase.rpc(name,args);if(error){if(['PGRST202','42883','42P01'].includes(error.code))throw Error('Community tierlists need the database setup before account saving and publishing are available.');throw Error(error.message)}return data}
export async function saveTierlist(id,revision,state,publish){client??=await import('./auth-client.mjs');if(!await client.currentUser())throw Error('Sign in to save or publish a tierlist.');return rpc('tierlist_save_v1',{p_id:id,p_revision:revision,p_name:state.title,p_payload:state,p_publish:publish})}
export const listTierlists=mine=>rpc(mine?'tierlist_list_mine_v1':'tierlist_list_public_v1');
export const readTierlist=(id,privateCopy)=>rpc('tierlist_read_v1',{p_id:id,p_private:privateCopy});
export const manageTierlist=(id,revision,action)=>rpc('tierlist_manage_v1',{p_id:id,p_revision:revision,p_action:action});
export const likeTierlist=id=>rpc('tierlist_like_v1',{p_id:id});
