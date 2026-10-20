import {readTradePreferences,writeTradePreferences,watchTradePreferences} from './exchange-preferences.mjs';
import {createAlbumPage} from './album-page-view.mjs?v=foil-shine2';
import {playerShareLink as playerLink} from './player-model.mjs?v=share-preview1';
import {supabase,currentUser} from './auth-client.mjs';
import {albumShareText} from './album-model.mjs?v=foil1';
const $=id=>document.getElementById(id),root=new URL('./album-data/',import.meta.url);
const preview=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URL(location.href).searchParams.get('preview')==='1';
let data,user,profile={},ready=false,revision=0,tradeMode='Same Rarity',tradesLeft=3,includeGold=false,removeLowStars=false,freeLowStars=false,showFoil=false,prefsBusy=false,settingsSet=1;
const inventory=new Map(),priorities=new Map(),pending=new Set();
const view=createAlbumPage({owner:true,onAdjust:adjust,onVariant:saveVariant});
function refreshView(initial=false){view.setCollection(data,{uid:profile.game_id},new Map([...inventory].map(([number,row])=>[number,row.quantity])),{initial,foilRows:inventory});if($('album-share-dialog').open)renderShare()}
function renderShare(){
 $('share-attempts').value=String(tradesLeft);$('share-attempts').disabled=prefsBusy||!ready;
 $('share-include-gold').checked=includeGold;$('share-show-foil').checked=showFoil;$('share-remove-low').checked=removeLowStars;$('share-free-low').checked=freeLowStars;const modeSelect=$('share-trade-mode');modeSelect.querySelector('[data-legacy]')?.remove();if(!['Any Rarity','Same Rarity'].includes(tradeMode)){const legacy=new Option(tradeMode+' (current)',tradeMode);legacy.dataset.legacy='true';legacy.disabled=true;modeSelect.append(legacy)}modeSelect.value=tradeMode;modeSelect.disabled=prefsBusy||!ready;$('copy-album-template').disabled=prefsBusy||!ready;
 const visible=!!(profile.album_public||profile.trade_enabled),link=visible&&profile.game_id?playerLink(profile.game_id,4,import.meta.url):'';
 $('share-privacy-note').hidden=!!link;$('album-share-template').value=albumShareText(data,inventory,profile,tradeMode,tradesLeft,includeGold,link,{removeLowStars,freeLowStars,showFoil});
}
async function ensureActor(expectedId=user?.id){if(preview)return;const actor=await currentUser();if(!actor||actor.id!==expectedId)throw Error('Your account changed. Please log in again.')}
async function savePrefs(patch={rarity_mode:tradeMode,trades_left_today:tradesLeft}){await ensureActor();await writeTradePreferences(data.season,patch,preview)}
async function syncTradePreferences(){if(!ready||prefsBusy||!data)return;try{const prefs=await readTradePreferences(data.season,preview);tradeMode=prefs.rarity_mode;tradesLeft=prefs.trades_left_today;if($('album-share-dialog').open)renderShare()}catch{}}
watchTradePreferences(syncTradePreferences);

async function adjust(card,delta){
 if(!ready||pending.has(card.number))return;const token=revision;pending.add(card.number);view.setPending(card.number,true);
 try{let row;if(preview){row={card_number:card.number,quantity:Math.max(0,Math.min(999,(inventory.get(card.number)?.quantity||0)+delta))}}else{await ensureActor();if(token!==revision||!ready)return;const {data:rows,error}=await supabase.rpc('album_adjust_quantity',{p_season:data.season,p_card:card.number,p_delta:delta});if(error)throw error;if(!rows?.length)throw Error('Save could not be confirmed.');const {data:saved,error:readError}=await supabase.from('card_inventory').select('card_number,quantity,has_foil,trade_foil,updated_at').eq('user_id',user.id).eq('season_id',data.season).eq('card_number',card.number).maybeSingle();if(readError)throw readError;row=saved||{card_number:card.number,quantity:0}}
 if(token!==revision)return;if(preview){const previous=inventory.get(card.number)||{};row.has_foil=row.quantity>0&&!!previous.has_foil;row.trade_foil=row.quantity>1&&row.has_foil&&!!previous.trade_foil}inventory.set(card.number,row);view.status('');refreshView();
 }catch(error){if(token===revision)view.status(error.message)}finally{if(token===revision){pending.delete(card.number);view.setPending(card.number,false)}}
}
async function saveVariant(card,flags){if(!ready||pending.has(card.number))return;const token=revision;pending.add(card.number);view.setPending(card.number,true);try{let row;if(preview){row={...inventory.get(card.number),...flags};if(row.quantity<1||(row.trade_foil&&(!row.has_foil||row.quantity<2)))throw Error('Keep one total copy before offering a foil.')}else{await ensureActor();if(token!==revision||!ready)return;const {data:rows,error}=await supabase.rpc('album_set_foil',{p_season:data.season,p_card:card.number,p_has_foil:flags.has_foil,p_trade_foil:flags.trade_foil,p_expected_actor:user.id});if(error)throw error;if(!rows?.length)throw Error('Save could not be confirmed.');row=rows[0]}if(token!==revision)return;inventory.set(card.number,row);view.status('');refreshView()}catch(error){if(token===revision){view.status(error.message);refreshView()}}finally{if(token===revision){pending.delete(card.number);view.setPending(card.number,false)}}}
async function load(){
 if(!data)return;const token=++revision;ready=false;inventory.clear();priorities.clear();pending.clear();profile={};view.clear();$('share-album').disabled=true;view.status('Loading your album…');
 try{
  if(preview){user={id:'local-preview'};profile={game_id:'18691234',discord_username:'Sample collector',album_public:true};for(const number of [1,2,3,4,5,6,7,8,9,55,56,57,59,60,61,91,92,93,95])inventory.set(number,{card_number:number,quantity:[2,93,95].includes(number)?2:1,has_foil:[2,91].includes(number),trade_foil:false});const prefs=await readTradePreferences(data.season,true);tradeMode=prefs.rarity_mode;tradesLeft=prefs.trades_left_today}
  else{user=await currentUser();if(token!==revision)return;if(!user){view.status('Log in to manage your album.');return}
   const [cards,prefs,priority,contact]=await Promise.all([supabase.from('card_inventory').select('card_number,quantity,has_foil,trade_foil,updated_at').eq('user_id',user.id).eq('season_id',data.season),supabase.from('album_trade_preferences').select('*').eq('user_id',user.id).eq('season_id',data.season).maybeSingle(),supabase.from('album_priorities').select('set_number,priority').eq('user_id',user.id).eq('season_id',data.season),supabase.from('profiles').select('game_id,discord_username,album_public,trade_enabled').eq('user_id',user.id).maybeSingle()]);
   if(token!==revision)return;for(const response of [cards,prefs,priority,contact])if(response.error)throw response.error;
   for(const row of cards.data||[])inventory.set(row.card_number,row);for(const row of priority.data||[])priorities.set(row.set_number,row.priority);profile=contact.data||{};
   tradeMode=prefs.data?.rarity_mode||(prefs.data?.accept_any?'Any Rarity':prefs.data?.accept_up||prefs.data?.accept_down?'Flexible Rarity':'Same Rarity');tradesLeft=prefs.data?.trades_left_today??3;
  }
  if(token!==revision)return;ready=true;view.status('');$('share-album').disabled=false;refreshView(true);
 }catch(error){if(token===revision){view.clear();view.status('Album settings are unavailable: '+error.message)}}
}
$('share-album').onclick=()=>{if(!ready)return;$('share-status').textContent='';renderShare();$('album-share-dialog').showModal()};
$('close-album-share').onclick=()=>$('album-share-dialog').close();
$('share-show-foil').onchange=()=>{showFoil=$('share-show-foil').checked;renderShare()};
$('share-include-gold').onchange=()=>{includeGold=$('share-include-gold').checked;renderShare()};
$('share-attempts').onchange=async()=>{
 if(!ready||prefsBusy)return;const before=tradesLeft,token=revision,next=Number($('share-attempts').value);if(!Number.isInteger(next)||next<0||next>3)return;tradesLeft=next;prefsBusy=true;renderShare();
 try{await savePrefs({trades_left_today:tradesLeft});if(token===revision)$('share-status').textContent=preview?'':'Exchange attempts updated.'}
 catch(error){if(token===revision){tradesLeft=before;$('share-status').textContent=error.message}}finally{prefsBusy=false;if(ready)renderShare()}
};
$('share-remove-low').onchange=()=>{removeLowStars=$('share-remove-low').checked;renderShare()};
$('share-free-low').onchange=()=>{freeLowStars=$('share-free-low').checked;renderShare()};
$('share-trade-mode').onchange=async()=>{if(!ready||prefsBusy)return;const before=tradeMode,token=revision,next=$('share-trade-mode').value;if(!['Any Rarity','Same Rarity'].includes(next))return;tradeMode=next;prefsBusy=true;renderShare();try{await savePrefs({rarity_mode:tradeMode});if(token===revision)$('share-status').textContent=preview?'':'Trade setting updated.'}catch(error){if(token===revision){tradeMode=before;$('share-status').textContent=error.message}}finally{prefsBusy=false;if(ready)renderShare()}};
$('copy-album-template').onclick=async()=>{if(!ready||prefsBusy)return;try{await ensureActor();await navigator.clipboard.writeText($('album-share-template').value);$('share-status').textContent='Template copied.'}catch(error){$('share-status').textContent='Could not copy: '+error.message}};
$('trade-settings').onclick=()=>{if(!ready)return;settingsSet=view.selectedSet();const modeSelect=$('rarity-mode');modeSelect.querySelector('[data-legacy]')?.remove();if(!['Any Rarity','Same Rarity'].includes(tradeMode)){const legacy=new Option(tradeMode+' (current)',tradeMode);legacy.dataset.legacy='true';legacy.disabled=true;modeSelect.append(legacy)}modeSelect.value=tradeMode;$('set-priority').value=priorities.get(settingsSet)||2;$('trade-status').textContent='';$('trade-dialog').showModal()};
$('close-trade').onclick=()=>$('trade-dialog').close();
$('save-trade-preferences').onclick=async()=>{if(!ready||prefsBusy)return;const before=tradeMode,token=revision;tradeMode=$('rarity-mode').value;prefsBusy=true;$('save-trade-preferences').disabled=true;try{await savePrefs();const priority=Number($('set-priority').value);if(!preview){await ensureActor();if(token!==revision||!ready)return;const {error}=await supabase.from('album_priorities').upsert({user_id:user.id,season_id:data.season,set_number:settingsSet,priority},{onConflict:'user_id,season_id,set_number'});if(error)throw error}if(token!==revision)return;priorities.set(settingsSet,priority);$('trade-dialog').close()}catch(error){if(token===revision){tradeMode=before;$('trade-status').textContent=error.message}}finally{prefsBusy=false;$('save-trade-preferences').disabled=!ready}};
if(!preview){supabase.auth.onAuthStateChange(()=>{for(const id of ['album-share-dialog','trade-dialog'])if($(id).open)$(id).close();setTimeout(load,0)});window.addEventListener('game-uid-saved',load)}
try{const response=await fetch(new URL('autumn-tales.json',root));if(!response.ok)throw Error('Album data unavailable.');data=await response.json();await load()}catch(error){view.status(error.message)}
