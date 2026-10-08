const text=value=>typeof value==='string'?value:value?.en||value?.zh||'';
const normalize=s=>s.toLocaleLowerCase().normalize('NFKD').replace(/[\s_\-]/g,'');
export function searchMatches(unit,query){const q=normalize(query);return !q||[unit.internalName,...(unit.aliases||[]),...unit.forms.flatMap(f=>[text(f.name),f.name.zh])].some(s=>normalize(s||'').includes(q));}
export function minimumStars(unit,form){if(form.evolution===1)return 0;return unit.forms.find(f=>f.evolution===form.evolution-1)?.trial?.requiredStars??null;}
export function coreStats(standard,star,growth){return Object.fromEntries(['ATK','DEF','HP'].map(a=>[a,(standard[a+'Standard']*star[a+'Coef']+star[a+'Add'])*growth[a]]));}
