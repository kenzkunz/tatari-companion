import{forward,reverse}from './engine.mjs';
const cache=new Map();
self.onmessage=event=>{const{id,kind,input,party}=event.data;try{const key=JSON.stringify([kind,input,party]);let result=cache.get(key);if(!result){result=kind==='forward'?forward(input.amount,input.event,input.gold,input.multiplier,input.refire,party):reverse(input.target,input.event,input.party,party);if(cache.size>=64)cache.delete(cache.keys().next().value);cache.set(key,result)}self.postMessage({id,result})}catch(error){self.postMessage({id,error:error.message})}};
