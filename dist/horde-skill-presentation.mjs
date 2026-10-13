const text=value=>typeof value==='string'?value:value?.en||value?.zh||'';
export function withoutAuraDescription(value){return text(value).split(/(?<=[.!?])\s+/).filter(sentence=>! /\bAura\s*:/i.test(sentence)).join(' ').trim()}
export function withoutAuraDetails(details=[]){let aura=false;return details.filter(detail=>{const title=text(detail.title);if(/^Aura\s*:/i.test(title)){aura=true;return false}if(aura&&(detail.type==='Effect'||detail.value===null))aura=false;return !aura})}
