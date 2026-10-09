import {supabase,currentUser} from './auth-client.mjs';
const label=document.getElementById('account-album-uid');let revision=0;
async function refresh(){const token=++revision;label.textContent='';try{const user=await currentUser();if(!user||token!==revision)return;const {data,error}=await supabase.from('profiles').select('game_id').eq('user_id',user.id).maybeSingle();if(token===revision)label.textContent=!error&&data?.game_id?String(data.game_id):'';}catch{if(token===revision)label.textContent='';}}
refresh();supabase.auth.onAuthStateChange(()=>setTimeout(refresh,0));window.addEventListener('game-uid-saved',refresh);
const controls=document.querySelector('.album-controls-row'),bar=controls.querySelector('.album-tradebar'),view=controls.querySelector('.album-view-toolbar'),phone=matchMedia('(max-width:700px)');
function positionViewToggle(){(phone.matches?bar:controls).append(view);}phone.addEventListener('change',positionViewToggle);positionViewToggle();
import './album-set-titles.mjs';
