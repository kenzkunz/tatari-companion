import {validateRoster,foodGrade,starCost,tierStarRange} from './my-tatari-model.mjs?v=account-progression1';

export function gradeStages(unit,grade,catalog){return unit.feedingStages.filter(stage=>foodGrade(unit,stage.stage,catalog).RankName===grade).map(stage=>stage.stage)}

export function screenshotPlan(catalog,roster,rows){
 const next=structuredClone(roster),changes=[],seen=new Set();
 for(const row of rows.filter(row=>row.include)){
  const unit=catalog.units.find(unit=>unit.id===Number(row.unit)),tier=Number(row.tier),form=unit?.forms.find(form=>form.evolution===tier);
  if(!form)throw Error('Choose a Tatari and tier for every included card.');
  if(seen.has(unit.id))throw Error(form.name.en+' appears more than once. Include just one card for this family.');seen.add(unit.id);
  const before=roster.units[unit.id];if(!before&&(row.stars===''||row.stars===undefined))throw Error('Confirm a star pattern for '+form.name.en+'.');if(!before&&(row.food===''||row.food===undefined))throw Error('Choose a food level for '+form.name.en+'. The letter does not reveal exact progress.');const after=before?{...before}:{owned:true,tier,stars:1,food:unit.feedingStages[0].stage,copies:0,glitter:false};
  after.owned=true;after.tier=tier;
  if(row.stars!==''&&row.stars!==undefined){const stars=Number(row.stars);if(!Number.isInteger(stars)||stars<1||stars>84)throw Error('Choose a valid star pattern for '+form.name.en+'.');after.stars=stars;if(stars!==before?.stars)after.copies=0;}
  const minimum=tierStarRange(unit,tier).min;if(after.stars<minimum)throw Error(form.name.en+' needs at least '+minimum+' stars for this tier. Confirm its star pattern.');
  if(row.food!==''&&row.food!==undefined){const food=Number(row.food);if(!unit.feedingStages.some(stage=>stage.stage===food))throw Error('Choose a valid food level for '+form.name.en+'.');after.food=food;}
  else if(!before&&row.grade&&foodGrade(unit,after.food,catalog).RankName!==row.grade)throw Error('Choose a food level for '+form.name.en+'. Only its '+row.grade+' grade is visible.');
  const cost=starCost(after.stars,catalog);after.copies=Math.min(after.copies??0,Math.max(0,(cost||0)-1));
  next.units[unit.id]=after;
  if(JSON.stringify(before)!==JSON.stringify(after))changes.push({id:unit.id,name:form.name.en,before,after,copiesReset:!!before&&before.stars!==after.stars,foodKept:row.food===''||row.food===undefined});
 }
 if(!seen.size)throw Error('Include at least one reviewed card.');
 validateRoster(next,catalog);return {next,changes};
}
import {rosterTier} from './my-tatari-model.mjs?v=account-progression1';

function projectStarProgress(stars,bar,catalog){
 const cost=starCost(stars,catalog);
 if(!(cost>0)||bar?.cost!==cost||!Number.isSafeInteger(bar.copies)||bar.copies<0)return null;
 let level=stars,copies=bar.copies;
 while(level<84){
  const nextCost=starCost(level,catalog);
  if(!Number.isInteger(nextCost)||nextCost<=0)return null;
  if(copies<nextCost)return {stars:level,copies};
  copies-=nextCost;level++;
 }
 return {stars:84,copies:0};
}

export function automaticScreenshotPlan(catalog,roster,detections){
 const next=structuredClone(roster),results=[],candidates=new Map(),changes=[];
 for(const detection of detections){
  const match=detection.matches?.[0],unit=catalog.units.find(u=>u.id===match?.unit),before=unit&&roster.units[unit.id],bar=detection.progress,result={detection,status:'skipped',name:unit?.forms[0].name.en||'Unread card',progressNote:bar?`Copy bar read: ${bar.copies}/${bar.cost}.`:null};results.push(result);
  if(!unit||!detection.identityReadable){result.name='Unread Tatari';result.reason='Tatari identity is unclear.';continue;}
  const star=detection.stars?.[0];if(!star||!detection.starReadable){result.reason='Star pattern is unclear or partly covered.';continue;}
  const stars=Number(star.value);
  if(!Number.isInteger(stars)||stars<1||stars>84){result.reason='Star pattern is outside the supported range.';continue;}
  const projection=projectStarProgress(stars,detection.progress,catalog),upgraded=projection&&projection.stars>stars;
  const hasBackground=Number.isInteger(detection.background?.value);
  let form,tierSource;
  if(hasBackground){form=unit.forms.find(f=>rosterTier(unit,f.evolution)===detection.background.value);tierSource=detection.background.source+' background';}
  else if(before?.owned){form=unit.forms.find(f=>f.evolution===before.tier);tierSource='saved tier';}
  else if(upgraded){form=unit.forms.find(f=>rosterTier(unit,f.evolution)===1);tierSource='T1 fallback';}
  if(!form){result.reason=hasBackground?'Detected tier is unavailable for this Tatari match.':'Tier background is unclear; no saved tier to keep.';continue;}
  if((hasBackground?stars:projection?.stars??stars)<tierStarRange(unit,form.evolution).min){result.reason='Star reading does not match the detected tier.';continue;}
  const grade=detection.gradeReadable===false?null:detection.grades?.[0]?.value,stages=gradeStages(unit,grade,catalog);
  const foodMinimum=stages.length?Math.min(...stages):null;
  const food=Math.max(before?.food??unit.feedingStages[0].stage,foodMinimum??0);
  const foodSource=before?.food===food&&(foodMinimum===null||foodMinimum<food)?'saved level':foodMinimum!==null?'letter minimum':'starting level';
  const after={owned:true,tier:form.evolution,stars,food,copies:before?.stars===stars?(before.copies??0):0,glitter:before?.glitter??false};
  Object.assign(result,{name:form.name.en,unit:unit.id,tier:rosterTier(unit,form.evolution),stars,food,grade,foodSource,status:'ready',tierSource});
  const candidate={id:unit.id,unit,name:form.name.en,before,after,result,projection};if(!candidates.has(unit.id))candidates.set(unit.id,[]);candidates.get(unit.id).push(candidate);
 }
 for(const list of candidates.values()){
  const signatures=new Set(list.map(c=>JSON.stringify(c.after)));if(signatures.size>1){for(const c of list){c.result.status='skipped';c.result.reason='Conflicting screenshots for this Tatari.';}continue;}
  const first=list[0],{unit,before,after,result}=first,observations=list.filter(c=>c.projection),readings=new Set(observations.map(c=>JSON.stringify(c.projection)));
  if(readings.size===1){
   const {projection,result:source}=observations[0],bar=source.detection.progress,upgraded=projection.stars>after.stars;
   after.stars=projection.stars;after.copies=projection.copies;
   if(upgraded&&before?.owned&&unit.forms.some(f=>f.evolution===before.tier)&&tierStarRange(unit,before.tier).min<=after.stars){after.tier=before.tier;result.tierSource='saved tier';}
   const remaining=starCost(after.stars,catalog);
   result.progressNote=upgraded?`Read ${bar.copies}/${bar.cost} → ${after.stars} stars${remaining?` with ${after.copies}/${remaining} copies remaining`: ' (maximum)'}.`: `Star progress: ${after.copies}/${remaining}`;
  }else if(readings.size>1)result.progressNote='Conflicting copy counts; star progress was not imported.';
  else if(after.stars===84&&result.detection.progress){const bar=result.detection.progress;result.progressNote=`Read ${bar.copies}/${bar.cost}. This Tatari is already at max stars.`;}
  else if(after.stars<84){
   const bar=result.detection.progress;
   result.progressNote=bar?`Read ${bar.copies}/${bar.cost}. Expected ${starCost(after.stars,catalog)} copies for the detected star level; copy progress was skipped.`:
    result.detection.progressBottom?'Copy bar found, but the numbers could not be read.':'Copy bar is missing or obscured.';
  }
  if(before?.owned&&after.stars<before.stars){for(const c of list){c.result.status='skipped';c.result.reason='Star reading is below the saved value.';}continue;}
  if(after.stars<tierStarRange(unit,after.tier).min){for(const c of list){c.result.status='skipped';c.result.reason='Star reading does not match the tier.';}continue;}
  const form=unit.forms.find(f=>f.evolution===after.tier);first.name=result.name=form.name.en;result.stars=after.stars;result.tier=rosterTier(unit,after.tier);
  for(const c of list.slice(1)){c.result.status='skipped';c.result.reason='Duplicate card.';}
  if(JSON.stringify(first.before)===JSON.stringify(first.after)){first.result.status='unchanged';continue;}
  next.units[first.id]=first.after;changes.push(first);
 }
 validateRoster(next,catalog);return {next,changes,results,skipped:results.filter(r=>r.status==='skipped').length};
}
