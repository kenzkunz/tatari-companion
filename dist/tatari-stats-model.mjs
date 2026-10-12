import {calculatedStats,coreStats} from './tatari-model.mjs';
export function resolveBuild(data,build){
 const unit=data.units.find(u=>u.id===Number(build.pet)),form=unit?.forms.find(f=>f.evolution===Number(build.tier));
 if(!unit||!form)throw Error('Choose a Tatari and available tier.');
 if(!Number.isInteger(Number(build.stars))||build.stars<1||build.stars>84)throw Error('Stars must be 1–84.');
 if(!Number.isInteger(Number(build.food))||build.food<1||build.food>16)throw Error('Food stage must be 1–16.');
 const feed=unit.feedingStages.find(r=>r.stage===Number(build.food));if(!feed)throw Error('Food stage unavailable for this Tatari.');
 const values=calculatedStats(data,unit,form,{stars:build.stars,foodStage:build.food,badgeIds:build.badgeMode==='pick'?build.badges:[]});
 const spa=Object.fromEntries(['ATK','HP','DEF'].map(stat=>[stat,Number(build.spa?.[stat]??0)]));
 if(Object.values(spa).some(value=>!Number.isFinite(value)||value<0||value>100))throw Error('Spa buffs must be 0–100%.');
 if(form.evolution>=4||build.lowerTierSpa){const core=coreStats(data.standards500[unit.element],data.stars[build.stars],form.growth);for(const stat of Object.keys(spa))values[stat]+=core[stat]*spa[stat]/100;}
 const grades=Object.fromEntries(['ATK','HP','DEF'].map(a=>[a,({0:'E',5:'D',10:'C',25:'B',40:'A',50:'S',55:'SS',60:'SSS'})[feed[a+'PR']]]));
 return {unit,form,feed,values,grades};
}
export function advantage(left,right){return left===right?null:left>right?'left':'right';}

export function dojoBadgeIds(data,element,index){return data.badges.filter(b=>b.element===element).sort((a,b)=>a.id-b.id).slice(0,index+1).map(b=>b.id);}
