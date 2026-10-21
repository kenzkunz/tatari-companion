const response=await fetch('/tatari-data/effect-catalog.json?v=bonobean1');if(!response.ok)throw Error('Effect catalog unavailable.');const catalog=await response.json();
export const effectName=id=>catalog.effects[id]?.name||id;
export const groupOf=id=>catalog.effects[id]?.group||'other';
export const effectInfo=id=>catalog.effects[id];
export function effectSources(entry){return (entry.ownEffects||[]).map(source=>({type:catalog.presentationPools?.[source.effectId]?.pool||source.effectId,level:source.level,skillName:source.skillName,skillId:source.skillId,kind:source.kind}))}

export const effectAllowed=(id,mode)=>!catalog.effects[id]?.hiddenTag&&!(catalog.effects[id]?.excludedModes||[]).includes(mode);
