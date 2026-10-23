export function starCost(stars,catalog){return stars>=84?0:catalog.starProgression?.costs?.[stars]??null}
export function emptyRoster(){return {version:1,accountLevel:1,units:{}}}
export function validateRoster(value,catalog){if(!value||value.version!==1||!Number.isInteger(value.accountLevel)||value.accountLevel<1||value.accountLevel>3600||!value.units||typeof value.units!=='object'||Array.isArray(value.units))throw Error('Invalid roster');const clean=emptyRoster();clean.accountLevel=value.accountLevel;for(const [id,v]of Object.entries(value.units)){const u=catalog.units.find(u=>String(u.id)===id);if(!u||!v||typeof v.owned!=='boolean'||!u.forms.some(f=>f.evolution===v.tier)||!Number.isInteger(v.stars)||v.stars<1||v.stars>84||!u.feedingStages.some(f=>f.stage===v.food))throw Error('Invalid Tatari settings');const copies=v.copies??0,glitter=v.glitter??false,cost=starCost(v.stars,catalog);if(!Number.isInteger(copies)||copies<0||cost===null||copies>cost||typeof glitter!=='boolean')throw Error('Invalid star progress or appearance');clean.units[id]={owned:v.owned,tier:v.tier,stars:v.stars,food:v.food,copies:Math.min(copies,Math.max(0,cost-1)),glitter}}return clean}
export function rosterKey(actor){return 'tatari-roster-local-v1:'+actor}

export function foodGrade(unit,food,catalog){const stage=unit.feedingStages.find(s=>s.stage===food);if(!stage)throw Error('Invalid food level');const ranks=Object.values(catalog.foodRanks).sort((a,b)=>a.RankID-b.RankID);const grades=['ATK','HP','DEF'].map(attr=>ranks.filter(r=>stage[attr+'PR']>=r[attr+'PRMax']).at(-1)||ranks[0]);return grades.sort((a,b)=>a.RankID-b.RankID)[0]}

export function sortRosterUnits(units,records){return [...units].sort((a,b)=>{const x=records[a.id]||{owned:false,tier:a.forms[0].evolution,stars:1},y=records[b.id]||{owned:false,tier:b.forms[0].evolution,stars:1};return Number(y.owned)-Number(x.owned)||rosterTier(b,y.tier)-rosterTier(a,x.tier)||y.stars-x.stars||a.id-b.id})}

export function rosterPortrait(unit,record,catalog){const form=unit.forms.find(f=>f.evolution===record.tier)||unit.forms[0];return record.glitter?(catalog.portraits?.find(p=>p.stableUnitId===unit.id&&p.evolution===form.evolution&&p.appearance==='color_1')?.image||form.portrait):form.portrait}
export function hasGlitter(unit,tier,catalog){return !!catalog.portraits?.some(p=>p.stableUnitId===unit.id&&p.evolution===tier&&p.appearance==='color_1')}

// Starter families begin at display tier 0.
// Keep stored evolution IDs unchanged for portraits, stats and existing saves.
export function rosterTier(unit,evolution){return evolution-(unit.id>=1&&unit.id<=10?1:0)}

// Evolution trials define the minimum stars for reaching a form, not a maximum:
// players can keep raising stars without completing the next evolution trial.
export function tierStarRange(unit,tier){if(!unit.forms.some(f=>f.evolution===tier))throw Error('Unsupported tier');return {min:Math.max(1,...unit.forms.filter(f=>f.evolution<tier).map(f=>f.trial?.requiredStars??1)),max:84}}
export function tierFoodMinimum(unit,tier){if(!unit.forms.some(f=>f.evolution===tier))throw Error('Unsupported tier');let food=unit.feedingStages[0].stage;for(const f of unit.forms.filter(f=>f.evolution<tier))for(const q of f.trial?.quests??[]){const m=(q.condition||'').replaceAll('\\','').match(/^ed\.ConditionX\.PetFeedLevel(?:Rank)?\((\d+)\)>=(\d+)$/);if(m&&Number(m[1])===unit.id)food=Math.max(food,Number(m[2]))}if(!unit.feedingStages.some(f=>f.stage===food))throw Error('Food minimum unavailable');return food}
export function bulkTierPlan(catalog,roster,ids,displayTier,{minimumFood=true}={}){
 if(!Number.isInteger(displayTier)||displayTier<0||displayTier>4)throw Error('Choose a tier from 0 to 4');
 const next=structuredClone(roster),changes=[],skipped=[];
 for(const id of new Set(ids)){const unit=catalog.units.find(u=>u.id===Number(id)),before=roster.units[id];if(!unit||!before?.owned){skipped.push({id,reason:'Not owned'});continue}
 const form=unit.forms.find(f=>rosterTier(unit,f.evolution)===displayTier);if(!form){skipped.push({id,name:unit.forms[0].name.en,reason:'Tier '+displayTier+' unavailable'});continue}
 const range=tierStarRange(unit,form.evolution),stars=Math.max(before.stars,range.min),after={...before,tier:form.evolution,stars,food:minimumFood?Math.max(before.food,tierFoodMinimum(unit,form.evolution)):before.food,copies:stars===before.stars?before.copies:0};
 if(before.tier===after.tier&&before.stars===after.stars&&before.food===after.food){skipped.push({id,name:form.name.en,reason:'Already set'});continue}
 next.units[id]=after;changes.push({id,name:form.name.en,before,after,fromTier:rosterTier(unit,before.tier),toTier:displayTier});
 }
 validateRoster(next,catalog);return {next,changes,skipped};
}
