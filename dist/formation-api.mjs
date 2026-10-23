let client;
async function auth(){client??=await import('/auth-client.mjs');return client}
async function rpc(name,args={}){const {supabase}=await auth();const {data,error}=await supabase.rpc(name,args);if(error){if(['PGRST202','42883','42P01'].includes(error.code))throw Error('Account formation saving is not available yet. Please try again later.');throw Error(error.message)}return data}
export async function accountUser(){return (await auth()).currentUser()}
export async function saveAccountFormation({id=null,revision=null,name,payload,publish=false}){if(!await accountUser())throw Error('Sign in to save or publish a formation.');return rpc('formation_save_v1',{p_id:id,p_revision:revision,p_name:name,p_payload:payload,p_publish:publish})}
export async function myFormations(){if(!await accountUser())throw Error('Sign in to view your saved formations.');return rpc('formation_list_mine_v1')}
export const publicFormations=()=>rpc('formation_list_public_v1');
export const readFormation=(id,privateCopy=false)=>rpc('formation_read_v1',{p_id:id,p_private:privateCopy});
export const manageFormation=(id,revision,action)=>rpc('formation_manage_v1',{p_id:id,p_revision:revision,p_action:action});

export const likeFormation=id=>rpc('formation_like_v1',{p_id:id});
