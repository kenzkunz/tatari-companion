import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {inventoryStatus,albumShareText} from '../dist/album-model.mjs';
const d=JSON.parse(await readFile('dist/album-data/autumn-tales.json','utf8'));assert.equal(d.cards.length,135);assert.equal(d.sets.length,15);assert.equal(d.cards.filter(c=>c.gold).length,17);assert.equal(new Set(d.cards.map(c=>c.number)).size,135);for(const s of d.sets)assert.equal(s.cards.length,9);
const normal=d.cards.find(c=>!c.gold),gold=d.cards.find(c=>c.gold);assert.equal(inventoryStatus(normal,0).label,'LF');assert(!inventoryStatus(normal,1).tradeable);assert.equal(inventoryStatus(normal,2).duplicates,1);assert(inventoryStatus(normal,2).tradeable);assert(inventoryStatus(gold,2,false).tradeable);assert(inventoryStatus(gold,2,true).tradeable);assert(!inventoryStatus(gold,1,true).tradeable);assert.throws(()=>inventoryStatus(normal,-1));

console.log('Passed 135-card catalog, quantities, one-copy reserve, gold arrangements and trade modes.');



const shareData={cards:[{number:1,stars:1,gold:false},{number:2,stars:2,gold:false},{number:3,stars:3,gold:false},{number:4,stars:4,gold:false},{number:5,stars:5,gold:false},{number:6,stars:4,gold:true},{number:7,stars:5,gold:true}]},shareInventory=new Map([[2,{quantity:1}],[3,{quantity:3}],[5,{quantity:2}],[6,{quantity:2}]]),shareProfile={discord_username:'Player',game_id:'12345678'},shareUrl='https://example.com/player/12345678?album=4';
const plain=albumShareText(shareData,shareInventory,shareProfile,'Same Rarity',2,false,shareUrl),withGold=albumShareText(shareData,shareInventory,shareProfile,'Any Rarity',3,true,shareUrl);
assert(plain.startsWith('🃏 **Autum Tales Album | UID : 12345678**'));assert(plain.includes('🌐 '+shareUrl));assert(plain.includes('Equal Rarity | Exchange attempt : 2/3'));assert(!plain.includes('Player'));assert(!plain.includes(' Gold**'));assert(plain.endsWith('📩 **DM me or reply!**'));
const [looking,forTrade]=withGold.split('🎁 **For Trade**');assert(looking.includes('⭐️**4** : 4'));assert(!looking.includes('⭐️**4 Gold**'));assert(looking.includes('⭐️**5 Gold** : 7'));assert(forTrade.includes('⭐️**4 Gold** : 6'));assert(forTrade.includes('⭐️**3** : 3'));assert(!forTrade.includes('⭐️**2**'));assert(withGold.includes('All Rarity'));
const removed=albumShareText(shareData,shareInventory,shareProfile,'Same Rarity',0,false,'',{removeLowStars:true}),free=albumShareText(shareData,shareInventory,shareProfile,'Same Rarity',3,false,'',{freeLowStars:true});
for(const stars of [1,2,3])assert(!removed.includes('⭐️**'+stars+'**'));assert(removed.includes('⭐️**4** : 4'));assert(removed.includes('Exchange attempt : 0/3'));assert(!free.split('🔎 **Looking For**')[0].includes('🆓'));const [tradePart,freePart]=free.split('🆓 **1–3⭐️ Free Cards**');assert(!tradePart.split('🎁 **For Trade**')[1].includes('⭐️**3**'));assert(freePart.includes('⭐️**3** : 3'));assert(!freePart.includes('⭐️**2**'));assert(!freePart.includes('⭐️**4**'));
const both=albumShareText(shareData,shareInventory,shareProfile,'Same Rarity',3,true,shareUrl,{removeLowStars:true,freeLowStars:true});assert(!both.split('🆓 **1–3⭐️ Free Cards**')[0].includes('⭐️**1**'));assert(both.split('🆓 **1–3⭐️ Free Cards**')[1].includes('⭐️**3** : 3'));
assert(!inventoryStatus(normal,2,false,'No Trading').tradeable);const showcase=albumShareText(d,new Map(),shareProfile,'No Trading',3);assert(!showcase.includes('🎁 **For Trade**'));assert(showcase.includes('No Trading'));assert.throws(()=>albumShareText(shareData,shareInventory,shareProfile,'Same Rarity',4));assert.throws(()=>albumShareText(shareData,shareInventory,shareProfile,'Invalid',3));
console.log('Passed exact Discord template, separate gold rows, share links, separate free cards, low-star filtering and one-copy reserve.');

assert(!plain.includes(' : —'));assert(!withGold.includes(' : —'));assert(!free.includes(' : —'));console.log('Passed omission of empty normal, gold and free rarity rows.');

const foilInventory=new Map([[1,{quantity:2,has_foil:true,trade_foil:true}],[6,{quantity:2,has_foil:true,trade_foil:true}]]);
const foilShare=albumShareText(shareData,foilInventory,shareProfile,'Any Rarity',3,false,'',{showFoil:true});
assert(foilShare.includes('1 (Foil)'));assert(foilShare.includes('Foil Owned'));assert(foilShare.includes('Foil For Trade**\n1'));assert(!foilShare.includes('Foil For Trade**\n1, 6'),'Gold exclusion also applies to foil offers');
foilInventory.set(1,{quantity:1,has_foil:true,trade_foil:false});assert(!albumShareText(shareData,foilInventory,shareProfile,'Any Rarity',3,false,'',{showFoil:true}).includes('1 (Foil)'));
assert(albumShareText(shareData,foilInventory,shareProfile,'No Trading',3,false,'',{showFoil:true}).includes('Foil owned: 1, 6'));
console.log('Passed foil share labels, one combined reserve, gold exclusion and collection-only sharing.');
