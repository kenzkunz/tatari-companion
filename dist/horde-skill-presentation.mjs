import {isSkillEffectDetail} from './skill-effect-style.mjs';
const text=value=>typeof value==='string'?value:value?.en||value?.zh||'';
export function withoutAuraDescription(value){return text(value).split(/(?<=[.!?])\s+/).filter(sentence=>! /\bAura\s*:/i.test(sentence)).join(' ').trim()}
export function withoutAuraDetails(details=[]){let aura=false;return details.filter(detail=>{const title=text(detail.title);if(/^Aura\s*:/i.test(title)){aura=true;return false}if(aura&&(isSkillEffectDetail(detail,title)||/arena factor/i.test(title)))aura=false;return !aura})}
