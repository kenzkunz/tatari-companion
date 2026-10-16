import {supabase,currentUser} from './auth-client.mjs';
export const exchangePreview=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URL(location.href).searchParams.get('preview')==='1';
const listeners=new Set();let epoch=0,busy=false,lastBeat=0;let state={actor:null,inbox:[],requests:[],error:'',ready:false};
export const exchangeState=()=>state;
function emit(){for(const fn of listeners)fn(state)}
export function watchExchange(fn){listeners.add(fn);fn(state);return()=>listeners.delete(fn)}
export async function exchangeAction(action,payload={}){const token=epoch,actor=await currentUser();if(!actor)throw Error('Log in to use Card Exchange.');if(token!==epoch)throw Error('Your account changed. Please retry.');const {data,error}=await supabase.rpc('exchange_action',{p_action:action,p_payload:{...payload,expected_actor:actor.id}});if(error)throw Error(error.code==='PGRST202'?'Card Exchange database update is required.':error.message);if(token!==epoch||(await currentUser())?.id!==actor.id)throw Error('Your account changed. Please retry.');return data}
export async function refreshExchange(){if(exchangePreview||busy||document.hidden)return;busy=true;const token=epoch;try{const actor=await currentUser();if(token!==epoch)return;if(!actor){state={actor:null,inbox:[],requests:[],error:'',ready:true};emit();return}if(state.actor?.id!==actor.id){state={actor,inbox:[],requests:[],error:'',ready:false};emit()}if(Date.now()-lastBeat>30000){await exchangeAction('heartbeat');lastBeat=Date.now()}const [inbox,requests]=await Promise.all([exchangeAction('inbox'),exchangeAction('requests')]);if(token!==epoch)return;state={actor,inbox,requests,error:'',ready:true};emit()}catch(e){if(token===epoch){state={...state,inbox:[],requests:[],error:e.message,ready:true};emit()}}finally{busy=false}}
// One authenticated private channel per account; reconnects always reload persisted state.
let channel=null,channelActor=null,channelGeneration=0,refreshQueued=false,realtimeReady=false;
export const exchangeConnection=()=>realtimeReady?'Live':state.actor?'Reconnecting':'Log in';
function scheduleRefresh(){if(refreshQueued)return;refreshQueued=true;setTimeout(async()=>{refreshQueued=false;if(busy){scheduleRefresh();return;}await refreshExchange();window.dispatchEvent(new Event('exchange-realtime-update'));},150);}
async function connectRealtime(){
 try{
 const requestEpoch=epoch;const actor=await currentUser();if(requestEpoch!==epoch)return;
 if(channel&&channelActor===actor?.id&&realtimeReady)return;
 const generation=++channelGeneration;
 const previous=channel;channel=null;channelActor=null;realtimeReady=false;
 if(previous)await supabase.removeChannel(previous);
 if(generation!==channelGeneration||!actor)return;
 await supabase.realtime.setAuth();if(generation!==channelGeneration)return;
 channelActor=actor.id;
 channel=supabase.channel('exchange:'+actor.id,{config:{private:true}})
 .on('broadcast',{event:'exchange_changed'},()=>{if(generation===channelGeneration)scheduleRefresh();})
 .subscribe(status=>{if(generation!==channelGeneration)return;realtimeReady=status==='SUBSCRIBED';window.dispatchEvent(new CustomEvent('exchange-connection',{detail:realtimeReady?'Live':'Reconnecting'}));if(realtimeReady)scheduleRefresh();});
 }catch{realtimeReady=false;window.dispatchEvent(new CustomEvent('exchange-connection',{detail:'Reconnecting'}));}
}
if(!exchangePreview){
 supabase.auth.onAuthStateChange((event,session)=>{if(event==='TOKEN_REFRESHED'&&state.actor?.id===session?.user?.id){supabase.realtime.setAuth();return;}epoch++;state={actor:null,inbox:[],requests:[],error:'',ready:false};lastBeat=0;emit();setTimeout(()=>{connectRealtime();scheduleRefresh();},0);});
 // A heartbeat maintains presence sitewide; persisted reads provide a fallback if sockets drop.
 setInterval(()=>{if(!document.hidden){refreshExchange();if(!realtimeReady)connectRealtime();}},30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){connectRealtime();scheduleRefresh();}});
 window.addEventListener('pageshow',()=>{connectRealtime();scheduleRefresh();});
 connectRealtime();refreshExchange();
}
