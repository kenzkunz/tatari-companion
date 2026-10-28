export const ATTEMPTS = 6;
const copy = value => structuredClone(value);
export const createRun = () => ({attempts:[], clues:[], caught:0, phase:'ready'});
export function beginAttempt(run, point) {
 if (run.phase !== 'ready' || run.attempts.length >= ATTEMPTS) throw Error('Finish the current search first.');
 if (!Number.isInteger(point.x) || !Number.isInteger(point.y) || point.x<0 || point.x>119 || point.y<0 || point.y>119) throw Error('Choose a point on the map.');
 const next=copy(run);next.attempts.push({point:{...point},result:null,angle:null,band:null});next.phase='result';return next;
}
export function recordResult(run, result) {
 if(run.phase!=='result'||!['found','miss'].includes(result)) throw Error('Choose the search result.');
 const next=copy(run),last=next.attempts.at(-1);last.result=result;
 if(result==='found'){next.caught++;next.clues=[];next.phase=next.attempts.length===ATTEMPTS?'finished':'clue';}
 else next.phase='clue';
 return next;
}
function applyClue(next){
 const last=next.attempts.at(-1),attempt=next.attempts.length;
 next.clues=next.clues.filter(c=>c.attempt!==attempt);
 if(last.angle!==null&&last.band){next.clues.push({...last.point,angle:last.angle,band:last.band,tolerance:5,margin:1,attempt});next.phase=attempt===ATTEMPTS?'finished':'ready';}
 else next.phase='clue';return next;
}
export function canSetClue(run){const last=run.attempts.at(-1);return !!last&&run.phase!=='result'&&(last.result==='miss'||last.result==='found'&&run.attempts.length<ATTEMPTS);}
function editable(run){if(!canSetClue(run))throw Error('Record a search result first.');}
export function setDirection(run, angle){editable(run);if(!Number.isFinite(angle))throw Error('Choose an arrow direction.');const next=copy(run);next.attempts.at(-1).angle=((Math.round(angle)%360)+360)%360;return applyClue(next);}
export function setDistance(run, band){editable(run);if(!['near','mid','far'].includes(band)||run.attempts.at(-1).angle===null)throw Error('Set the arrow before choosing its indicator.');const next=copy(run);next.attempts.at(-1).band=band;return applyClue(next);}
export function restoreRun(value){
 if(!value||!Array.isArray(value.attempts)||value.attempts.length>ATTEMPTS)throw Error('Invalid run.');
 let run=createRun();for(let i=0;i<value.attempts.length;i++){const a=value.attempts[i];run=beginAttempt(run,a.point);
  if(a.result!==null){run=recordResult(run,a.result);if(canSetClue(run)){if(a.angle!==null)run=setDirection(run,a.angle);if(a.band!==null)run=setDistance(run,a.band);}}
  if(i<value.attempts.length-1&&run.phase!=='ready'){if(a.result==='found'&&a.angle===null&&a.band===null)run.phase='ready';else throw Error('Incomplete search.');}
 }return run;
}
export function undoAttempt(run){return restoreRun({attempts:run.attempts.slice(0,-1)});}
