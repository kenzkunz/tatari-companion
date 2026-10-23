export function parseWeight(value,fish){
 const text=String(value).trim().replace(',','.');if(!text)return {state:'blank'};
 if(!/^\d+(?:\.\d{1,2})?$/.test(text))return {state:'invalid',message:'Use a positive weight with up to 2 decimals.'};
 const [whole,fraction='']=text.split('.'),raw=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(raw)||raw>=fish.maxRaw)return {state:'invalid',message:'Weight must be below '+(fish.maxRaw/100).toLocaleString('en-US')+' kg.'};
 if(raw>0&&raw<fish.minRaw)return {state:'invalid',message:'Use 0 or at least '+(fish.minRaw/100).toLocaleString('en-US')+' kg.'};
 return {state:'valid',raw};
}
export function coinValue(raw,price){return Math.floor(raw*price/1000)}
export function fishResult(value,fish){const result=parseWeight(value,fish);if(result.state!=='valid')return result;const current=coinValue(result.raw,fish.price),maximum=coinValue(fish.maxRaw-1,fish.price);return {...result,current,maximum,gain:maximum-current}}
