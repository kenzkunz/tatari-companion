export const DOJO_ELEMENTS=[['2','Water'],['3','Fire'],['4','Grass'],['6','Rock'],['5','Lightning']];
export function validateDojoLevels(value){if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).length!==5)throw Error('Choose a badge level for each dojo.');return Object.fromEntries(DOJO_ELEMENTS.map(([key])=>{const n=value[key];if(!Number.isInteger(n)||n<0||n>7)throw Error('Dojo levels must be integers from 0 to 7.');return [key,n];}));}
export function emptyDojoLevels(){return Object.fromEntries(DOJO_ELEMENTS.map(([key])=>[key,0]));}
export function accountBadgeIds(data,levels){levels=validateDojoLevels(levels);return DOJO_ELEMENTS.flatMap(([key])=>data.badges.filter(b=>b.element===Number(key)).sort((a,b)=>a.id-b.id).slice(0,levels[key]).map(b=>b.id));}
export function websiteUrl(path,moduleUrl){return new URL(path,moduleUrl).href;}
