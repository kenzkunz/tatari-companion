const visible=s=>{const name=typeof s.name==='string'?s.name:s.name?.en||s.name?.zh||'';return !name.includes('不用翻译');};
export function hordeSkillCards(form){return [{label:'Regular',skills:form.skills.normal.filter(visible)},...form.skills.horde.filter(visible).map((skill,index)=>({label:['Lv 1','Lv 3','Lv 7'][index]||'Horde',skills:[skill]}))];}
