import {installSiteData} from './admin-site-data.mjs?v=site-data7';
import {installUIDListing} from './admin-uid-listing.mjs?v=site-data5';
import './admin-version-audit.mjs';
import {installVisualEditor} from './admin-editor.mjs';
import {installMedia} from './admin-media.mjs';
import {renderFormatted,wrapSelection,serializeInline} from './content-format.mjs';
import {supabase,currentUser,login} from './auth-client.mjs';
import {validateText} from './admin-model.mjs';
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
let state={blocks:[],requests:[],listings:[],audit:[]},active=null,busy=false;
const uidListings=installUIDListing({supabase,status,onChange:refreshAudit});
const siteData=installSiteData({supabase,status,onChange:refreshAudit});
const visual=installVisualEditor($('content-text'));
const media=installMedia({getActive:()=>active,getPage:()=>$('page-select').value,run,status});
const root=new URL('.',import.meta.url);
const blockCatalog=await fetch(new URL('./admin-content-catalog.json',root)).then(r=>r.ok?r.json():[]).catch(()=>[]);
const blockMetadata=new Map(blockCatalog.map(b=>[b.page+'#'+b.block,b]));
async function rpc(action,payload={}){const {data,error}=await supabase.rpc('admin_workspace',{p_action:action,p_payload:payload});if(error)throw Error(error.message);return data;}
function status(text){$('admin-status').textContent=text;}
function controls(){for(const b of document.querySelectorAll('[data-mutation]'))b.disabled=busy||!active;for(const b of document.querySelectorAll('.admin-queue-row button'))b.disabled=busy;}
async function run(task){if(busy)return;busy=true;controls();try{await task();}catch(e){status(e.message);}finally{busy=false;controls();}}
function current(){return state.blocks.find(b=>b.page_key===$('page-select').value&&b.block_key===$('block-select').value);}
function selectBlock(){active=current();if(!active)return;$('content-text').value=active.draft_text??active.published_text??active.default_text;visual.paint();media.paint();$('block-meta').textContent='Revision '+active.revision+' · '+(active.published_text===null?'Original page content':'Published override');$('content-preview').src=new URL(active.page_key,root).href;$('history-list').replaceChildren();controls();}
function choosePage(){
 const page=$('page-select').value,meta=b=>blockMetadata.get(page+'#'+b.block_key);
 const blocks=state.blocks.filter(b=>b.page_key===page).sort((a,b)=>(meta(a)?.order??Infinity)-(meta(b)?.order??Infinity)||a.block_key.localeCompare(b.block_key,undefined,{numeric:true}));
 const groups=[];let group=null,previous=null;
 for(const [i,b] of blocks.entries()){const info=meta(b),section=info?.section??'other';if(section!==previous){group=el('optgroup');group.label=info?.sectionTitle??'Other text';groups.push(group);previous=section;}const o=el('option',String(i+1).padStart(2,'0')+' · '+b.label);o.value=b.block_key;group.append(o);}
 $('block-select').replaceChildren(...groups);selectBlock();
}
function lists(){
 const filter=$('queue-filter').value;const rows=state.requests.filter(r=>filter==='all'||r.status===filter);$('queue-list').replaceChildren(...rows.map(r=>{const card=el('article');card.className='admin-queue-row';const heading=el('strong',r.game_uid+' · '+r.bonus+'%');const text=el('p','Crop '+r.crop_id+' · '+r.status+' · '+new Date(r.created_at).toLocaleString());const note=el('p',r.note||'No submitter note');card.append(heading,text,note);if(r.status==='pending'){const label=el('label','Review note'),input=el('textarea');input.maxLength=1000;input.rows=2;label.append(input);card.append(label);for(const [title,decision] of [['Approve','approved'],['Reject','rejected']]){const button=el('button',title);button.type='button';button.disabled=busy;button.onclick=()=>run(async()=>{await rpc('review',{id:r.id,revision:r.revision,decision,note:input.value});await load();status('Submission '+decision+'.');});card.append(button);}}else card.append(el('p',r.review_note||'Reviewed'));return card;}));if(!rows.length)$('queue-list').append(el('p','No submissions in this view.'));
 $('audit-list').replaceChildren(...state.audit.map(a=>el('li',new Date(a.created_at).toLocaleString()+' · '+a.action+' · '+a.target)));
 $('pending-count').textContent=state.requests.filter(r=>r.status==='pending').length;$('page-count').textContent=new Set(state.blocks.map(b=>b.page_key)).size;
}
async function refreshAudit(){try{const next=await rpc('load');state.audit=next.audit;lists();}catch{status('Saved. Refresh Activity history to see the latest change.');}}
async function load(){const page=$('page-select').value,block=$('block-select').value;state=await rpc('load');const pages=[...new Set(state.blocks.map(b=>b.page_key))];$('page-select').replaceChildren(...pages.map(p=>{const o=el('option',p.replace('events/','').replace('.html','').replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase()));o.value=p;return o;}));if(pages.includes(page))$('page-select').value=page;choosePage();if(state.blocks.some(b=>b.page_key===$('page-select').value&&b.block_key===block)){$('block-select').value=block;selectBlock();}lists();await Promise.allSettled([uidListings.refresh(),media.refresh(),siteData.refresh()]);}
async function gate(){const user=await currentUser();$('admin-tools').hidden=true;$('admin-gate').hidden=false;if(!user){$('gate-message').textContent='Sign in with your administrator account.';$('admin-login').hidden=false;return;}const {data,error}=await supabase.rpc('is_site_admin');if(error){$('gate-message').textContent='Admin database setup is not active yet. Apply migration 009 and sign in again.';return;}if(data!==true){$('gate-message').textContent='This account does not have administrator access.';$('admin-login').hidden=true;return;}$('admin-gate').hidden=true;status('Loading dashboard…');await load();$('admin-tools').hidden=false;status('Dashboard ready.');}
$('admin-login').onclick=()=>login('discord').catch(e=>status(e.message));
$('page-select').onchange=choosePage;$('block-select').onchange=selectBlock;$('queue-filter').onchange=lists;
$('save-draft').onclick=()=>run(async()=>{visual.sync();await rpc('save',{page:active.page_key,block:active.block_key,revision:active.revision,text:validateText($('content-text').value)});await load();status('Draft saved. Public text is unchanged.');});
$('publish-content').onclick=()=>run(async()=>{visual.sync();const target={page:active.page_key,block:active.block_key};if($('content-text').value!==(active.draft_text??active.published_text??active.default_text)){await rpc('save',{...target,revision:active.revision,text:validateText($('content-text').value)});await load();}if(active.draft_text===null){await rpc('save',{...target,revision:active.revision,text:validateText($('content-text').value)});await load();}await rpc('publish',{...target,revision:active.revision});await load();status('Published. Visitors see the new text on their next page load.');});
$('reset-content').onclick=()=>run(async()=>{await rpc('unpublish',{page:active.page_key,block:active.block_key,revision:active.revision});await load();status('Original page text restored.');});
$('preview-content').onclick=()=>{try{visual.sync();}catch(e){status(e.message);return;}const frame=$('content-preview');const block=frame.contentDocument?.querySelector('[data-site-content="'+active?.block_key+'"]');if(block){renderFormatted(block,$('content-text').value);block.style.outline='3px solid #b98212';block.scrollIntoView({block:'center'});status('Preview updated; no public change.');}else status('Wait for the page preview to load, then try again.');};
$('show-history').onclick=()=>run(async()=>{const history=await rpc('history',{page:active.page_key,block:active.block_key});$('history-list').replaceChildren(...history.map(v=>{const li=el('li',new Date(v.created_at).toLocaleString()+' · '+(v.body===null?'Original page text':v.body.slice(0,100)));const b=el('button','Restore this version');b.onclick=()=>run(async()=>{await rpc('restore',{page:active.page_key,block:active.block_key,revision:active.revision,version:v.id});await load();status('Earlier published version restored.');});li.append(b);return li;}));if(!history.length)$('history-list').append(el('li','No publication history yet.'));});
$('refresh-admin').onclick=()=>run(async()=>{await load();status('Dashboard refreshed.');});
for(const button of document.querySelectorAll('[data-panel]'))button.onclick=()=>{for(const b of document.querySelectorAll('[data-panel]'))b.setAttribute('aria-pressed',String(b===button));for(const panel of document.querySelectorAll('.admin-panel'))panel.hidden=panel.id!==button.dataset.panel;};
supabase.auth.onAuthStateChange(()=>setTimeout(()=>gate().catch(e=>status(e.message)),0));gate().catch(e=>status(e.message));

$('content-preview').addEventListener('load',()=>{
 if(!active)return;const frame=$('content-preview'),doc=frame.contentDocument;if(!doc||doc.URL!==new URL(active.page_key,root).href)return;
 const original=doc.querySelector('[data-site-content="'+active.block_key+'"]');
 if(original&&active.draft_text===null&&active.published_text===null&&$('content-text').value===active.default_text){$('content-text').value=serializeInline(original);visual.paint();}
 for(const record of state.blocks.filter(b=>b.page_key===active.page_key&&b.published_text!==null)){const target=doc.querySelector('[data-site-content="'+record.block_key+'"]');if(target)renderFormatted(target,record.published_text);}
 media.preview(doc);
 const selected=doc.querySelector('[data-site-content="'+active.block_key+'"]');if(selected){for(let parent=selected.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;selected.style.outline='3px solid #b98212';selected.scrollIntoView({block:'center'});}
});

const menuToggle=$('admin-menu-toggle'),scrim=$('admin-menu-scrim');
function closeDrawer(){document.body.classList.remove('menu-open');menuToggle?.setAttribute('aria-expanded','false');}
if(menuToggle){menuToggle.onclick=()=>{if($('admin-tools').hidden)return;const open=document.body.classList.toggle('menu-open');menuToggle.setAttribute('aria-expanded',String(open));};scrim.onclick=closeDrawer;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});}
for(const b of document.querySelectorAll('[data-panel]'))b.addEventListener('click',closeDrawer);
for(const b of document.querySelectorAll('[data-workspace-view]'))b.onclick=()=>{document.querySelector('.content-workspace').dataset.view=b.dataset.workspaceView;for(const n of document.querySelectorAll('[data-workspace-view]'))n.setAttribute('aria-pressed',String(n===b));};
for(const b of document.querySelectorAll('[data-preview-width]'))b.onclick=()=>{document.querySelector('.preview-stage').classList.toggle('mobile-preview',b.dataset.previewWidth==='mobile');for(const n of document.querySelectorAll('[data-preview-width]'))n.setAttribute('aria-pressed',String(n===b));};
