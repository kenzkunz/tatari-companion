export function collectionTotals(cards,inventory){let collected=0,gold=0,extras=0;for(const c of cards){const q=inventory.get(c.number)||0;if(q>0){collected++;if(c.gold)gold++}extras+=Math.max(0,q-1)}return {collected,gold,extras}}
export const cardsInSet=(cards,set,filter,inventory)=>cards.filter(c=>c.set===set&&(filter==='missing'?!(inventory.get(c.number)>0):filter==='duplicates'?(inventory.get(c.number)||0)>1:true));
export function selectedAlbumSet(url,count){const n=Number(new URL(url).searchParams.get('set'));return Number.isInteger(n)&&n>=1&&n<=count?n:0}

export function cardsForAlbumList(cards,inventory,kind){return cards.filter(card=>{const q=inventory.get(card.number)||0;return kind==='lf'?!card.gold&&q===0:kind==='lf-gold'?card.gold&&q===0:kind==='ft'?q>1:false})}
