export function validUID(value){return /^[1-9][0-9]{0,19}$/.test(String(value));}
export function validateSubmission({uid,crop,bonus,permission,note=''}){
 if(!validUID(uid))throw Error('Enter a numeric UID without leading zeros.');
 if(!Number.isInteger(crop)||crop<2||crop>7)throw Error('Choose a crop.');
 if(!Number.isInteger(bonus)||bonus<0||bonus>263)throw Error('Bonus must be a whole number from 0 to 263%.');
 if(permission!==true)throw Error('Confirm permission to share this UID.');
 if(note.length>1000)throw Error('Keep the note under 1,000 characters.');
 return {uid,crop,bonus,permission,note:note.trim()};
}
export function validateText(text){if(typeof text!=='string'||text.length>20000)throw Error('Content must be at most 20,000 characters.');return text;}
export function availability(row){return Number(row.exhausted)>=3?'Hidden this round':Number(row.reveals)>=50||Number(row.exhausted)>0?'Possibly exhausted':Number(row.worked)>0?'Recently worked':'Unconfirmed';}
export function completedCycle(time=Date.now()){return Math.floor(time/43200000);}
