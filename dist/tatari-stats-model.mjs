import {calculatedStats,coreStats} from './tatari-model.mjs?v=normal-level1';
export function resolveBuild(data,build){
 const unit=data.units.find(u=>u.id===Number(build.pet)),form=unit?.forms.find(f=>f.evolution===Number(build.tier));
 if(!unit||!form)throw Error('Choose a Tatari and available tier.');
 if(!Number.isInteger(Number(build.stars))||build.stars<1||build.stars>84)throw Error('Stars must be 1–84.');
 if(!Number.isInteger(Number(build.food))||build.food<0||build.food>16)throw Error('Food stage must be 0–16.');
 const feed=unit.feedingStages.find(r=>r.stage===Number(build.food));if(!feed)throw Error('Food stage unavailable for this Tatari.');
 const standard=buildStandard(data,unit.element,build);
 const values=calculatedStats(data,unit,form,{stars:build.stars,foodStage:build.food,badgeIds:build.badgeMode==='pick'?build.badges:[],standardOverride:standard});
 const spa=Object.fromEntries(['ATK','HP','DEF'].map(stat=>[stat,Number(build.spa?.[stat]??0)]));
 if(Object.values(spa).some(value=>!Number.isFinite(value)||value<0||value>100))throw Error('Spa buffs must be 0–100%.');
 if(form.evolution>=4||build.lowerTierSpa){const core=coreStats(standard,data.stars[build.stars],form.growth);for(const stat of Object.keys(spa))values[stat]+=core[stat]*spa[stat]/100;}
 const grades=Object.fromEntries(['ATK','HP','DEF'].map(a=>[a,({0:'E',5:'D',10:'C',25:'B',40:'A',50:'S',55:'SS',60:'SSS'})[feed[a+'PR']]]));
 return {unit,form,feed,values,grades};
}
export function advantage(left,right){return left===right?null:left>right?'left':'right';}

export function dojoBadgeIds(data,element,index){return data.badges.filter(b=>b.element===element).sort((a,b)=>a.id-b.id).slice(0,index+1).map(b=>b.id);}

export function buildStandard(data,element,build){
 if(!build.statMode||build.statMode==='fixed500')return data.standards500[element];
 if(build.statMode!=='normal')throw Error('Choose a supported stats mode.');
 const level=Number(build.level),progress=Number(build.progress??0),table=data.levelStandards;
 if(!Number.isInteger(level)||!Number.isInteger(progress))throw Error('Choose a whole account level and element upgrade step.');
 const step=table?.levels?.[level]?.[progress],index=table?.elements.indexOf(element),attr=step?.[index],values=table?.standards?.[attr];
 if(!values)throw Error('Stats are unavailable for this level and upgrade step. Choose a supported level from 1–3,600.');
 return Object.fromEntries(table.stats.map((stat,i)=>[stat+'Standard',values[i]]));
}
export function applyOwnedTatari(build,roster){const owned=roster?.units?.[build.pet];if(!owned?.owned)throw Error('This Tatari is not marked owned in My Tatari.');return {...build,tier:owned.tier,stars:owned.stars,food:owned.food,level:roster.accountLevel}}
