export const RETENTION_MS=7*24*60*60*1000;
export function activeMessages(messages,now=Date.now()){return messages.filter(m=>Number.isFinite(m.at)&&m.at>now-RETENTION_MS&&m.at<=now)}
export function presenceLabel(online,lastSeen,now=Date.now()){if(online===true)return 'Online';if(!lastSeen)return 'Last seen unavailable';const age=Math.max(0,now-new Date(lastSeen).getTime());if(!Number.isFinite(age))return 'Last seen unavailable';const min=Math.floor(age/60000);return min<1?'Last seen just now':min<60?'Last seen '+min+' min ago':min<1440?'Last seen '+Math.floor(min/60)+' hours ago':'Last seen '+Math.floor(min/1440)+' days ago'}
export function sameStarCount(swaps,cards){const stars=new Map(cards.map(c=>[c.number,c.stars]));return new Set((swaps||[]).filter(s=>stars.has(s.give)&&stars.get(s.give)===stars.get(s.receive)).map(s=>s.receive)).size}

export function possibleMatchCount(swaps){return new Set((swaps||[]).map(s=>s.receive)).size}
export function giftOnlyCards(row){const paired=new Set((row.swaps||[]).map(s=>s.give));return [...new Set(row.gifts||[])].filter(n=>!paired.has(n))}
export function requestGiftCards(row){const paired=new Set((row.swaps||[]).map(s=>s.receive));return [...new Set(row.gift_requests||[])].filter(n=>!paired.has(n))}
