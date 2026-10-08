import {createClient} from './vendor/supabase.mjs';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './supabase-config.mjs';
import {validateDojoLevels,emptyDojoLevels} from './account-model.mjs';
export const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce',storageKey:'tatari-companion-auth'}});
export const accountUrl=new URL('./account.html',import.meta.url).href;
export async function currentUser(){const {data:{session},error}=await supabase.auth.getSession();if(error)throw error;return session?.user??null;}
export async function login(provider){if(!['google','discord'].includes(provider))throw Error('Unsupported login provider.');const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:new URL('./auth/callback.html',import.meta.url).href,scopes:provider==='discord'?'identify email':undefined}});if(error)throw error;}
export async function loadSettings(){const user=await currentUser();if(!user)throw Error('Please log in to use account settings.');const {data,error}=await supabase.from('user_settings').select('dojo_levels').eq('user_id',user.id).maybeSingle();if(error)throw Error(error.code==='PGRST205'||error.code==='42P01'?'Account database setup is not complete yet.':error.message);return validateDojoLevels(data?.dojo_levels??emptyDojoLevels());}
export async function saveSettings(levels){const user=await currentUser();if(!user)throw Error('Please log in before saving.');const {error}=await supabase.from('user_settings').upsert({user_id:user.id,dojo_levels:validateDojoLevels(levels)},{onConflict:'user_id'});if(error)throw error;}
