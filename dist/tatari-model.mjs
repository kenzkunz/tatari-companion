const text=value=>typeof value==='string'?value:value?.en||value?.zh||'';
const normalize=s=>s.toLocaleLowerCase().normalize('NFKD').replace(/[\s_\-]/g,'');
export function searchMatches(unit,query){const q=normalize(query);return !q||[unit.internalName,...(unit.aliases||[]),...unit.forms.flatMap(f=>[text(f.name),f.name.zh])].some(s=>normalize(s||'').includes(q));}
export function minimumStars(unit,form){if(form.evolution===1)return 0;return unit.forms.find(f=>f.evolution===form.evolution-1)?.trial?.requiredStars??null;}
export function coreStats(standard,star,growth){return Object.fromEntries(['ATK','DEF','HP'].map(a=>[a,(standard[a+'Standard']*star[a+'Coef']+star[a+'Add'])*growth[a]]));}

export function calculatedStats(data,unit,form,{stars,foodStage,badgeIds=[],aurora=0,spaIds=[],spaGuest=false,lowerTierSpa=false}){
 const standard=data.standards500[unit.element],star=data.stars[stars],feed=unit.feedingStages.find(r=>r.stage===Number(foodStage));
 if(!standard||!star||!feed)throw Error('Choose a recorded star count and food stage.');
 const bonuses=Object.fromEntries(['ATK','HP','DEF'].map(a=>[a,feed[a+'PR']+Number(aurora)]));
 for(const id of new Set(badgeIds)){const badge=data.badges.find(b=>b.id===Number(id)&&b.element===unit.element);if(badge)for(const a of Object.keys(bonuses))bonuses[a]+=badge[a+'PR'];}
 if(form.evolution>=4||lowerTierSpa)for(const id of new Set(spaIds)){const effect=data.spa.find(s=>s.id===Number(id));if(effect)bonuses[effect.stat.slice(0,-2)]+=effect[spaGuest?'guest':'owner'];}
 const core=coreStats(standard,star,form.growth);return Object.fromEntries(Object.keys(core).map(a=>[a,core[a]*(1+bonuses[a]/100)]));
}
