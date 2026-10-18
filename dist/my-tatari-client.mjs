import {supabase,currentUser} from './auth-client.mjs';
async function requireActor(expected){const actor=await currentUser();if(!actor||actor.id!==expected)throw Error('Your account changed. Reopen My Tatari.');return actor}
function failure(error){return Error(['42P01','PGRST205','PGRST202'].includes(error.code)?'Tatari account storage needs the latest database update.':error.message)}
export async function loadRoster(actor){await requireActor(actor);const {data,error}=await supabase.from('tatari_rosters').select('roster,revision,updated_at').eq('user_id',actor).maybeSingle();await requireActor(actor);if(error)throw failure(error);return data}
export async function saveRoster(actor,roster,revision){await requireActor(actor);const {data,error}=await supabase.rpc('save_tatari_roster',{p_roster:roster,p_revision:revision,p_expected_actor:actor});await requireActor(actor);if(error)throw failure(error);return data}
