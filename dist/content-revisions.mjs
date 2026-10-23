import {revisedContent,contentLabel} from './content-revisions-model.mjs';
const updates=fetch(new URL('./content-revisions.json',import.meta.url)).then(r=>r.ok?r.json():{}).catch(()=>({}));
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
export async function displayContent(page,block,text){try{return await revisedContent(await updates,page,block,text,digest)}catch{return text}}
export async function displayRecord(record){const copy={...record};for(const key of ['default_text','draft_text','published_text'])copy[key]=await displayContent(record.page_key,record.block_key,record[key]);copy.label=contentLabel(copy.default_text);return copy}
