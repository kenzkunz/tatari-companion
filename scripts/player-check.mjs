import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {validateUid,playerLink,playerParameters} from '../dist/player-model.mjs';
assert.equal(validateUid(' 18618157 '),'18618157');for(const bad of ['',null,'abc','123/4','000123','1<script>'])assert.throws(()=>validateUid(bad));
assert.equal(playerLink('18618157',4,'https://kenzkunz.github.io/tatari-companion/trading.mjs'),'https://kenzkunz.github.io/tatari-companion/player/18618157?album=4');
assert.deepEqual(playerParameters('https://kenzkunz.github.io/tatari-companion/player/18618157?album=4','https://kenzkunz.github.io/tatari-companion/player.mjs'),{uid:'18618157',album:4});
assert.deepEqual(playerParameters('http://127.0.0.1:4184/tatari-companion/player.html?uid=18618157&album=4','http://127.0.0.1:4184/tatari-companion/player.mjs'),{uid:'18618157',album:4});

const guard=await readFile('dist/uid-guard.mjs','utf8');assert(guard.includes("addEventListener('cancel',e=>e.preventDefault())"));assert(!guard.includes("textContent='Close'"));
console.log('Passed UID validation, pretty/direct player links, player links and required dialog cancellation guard.');

const {collectionTotals,cardsInSet,selectedAlbumSet}=await import('../dist/player-album-model.mjs');
const sampleCards=[{number:1,set:1,gold:false},{number:2,set:1,gold:true},{number:3,set:2,gold:false}],sampleInventory=new Map([[1,2],[2,1]]);
assert.deepEqual(collectionTotals(sampleCards,sampleInventory),{collected:2,gold:1,extras:1});assert.deepEqual(cardsInSet(sampleCards,1,'duplicates',sampleInventory).map(c=>c.number),[1]);assert.deepEqual(cardsInSet(sampleCards,2,'missing',sampleInventory).map(c=>c.number),[3]);assert.equal(selectedAlbumSet('https://example.com/player/1?set=15',15),15);for(const set of ['0','16','NaN','1.5'])assert.equal(selectedAlbumSet('https://example.com/player/1?set='+set,15),0);
console.log('Passed public album totals, extra-copy counting, missing/duplicate filters and safe set links.');

const {cardsForAlbumList}=await import('../dist/player-album-model.mjs');
const categoryCards=[{number:1,gold:false},{number:2,gold:true},{number:3,gold:false},{number:4,gold:true},{number:5,gold:false}],categoryInventory=new Map([[3,3],[4,2],[5,1]]);
assert.deepEqual(cardsForAlbumList(categoryCards,categoryInventory,'lf').map(c=>c.number),[1]);assert.deepEqual(cardsForAlbumList(categoryCards,categoryInventory,'lf-gold').map(c=>c.number),[2]);assert.deepEqual(cardsForAlbumList(categoryCards,categoryInventory,'ft').map(c=>c.number),[3,4]);assert.equal(collectionTotals(cardsForAlbumList(categoryCards,categoryInventory,'ft'),categoryInventory).extras,3);assert.deepEqual(cardsForAlbumList(categoryCards,new Map(categoryCards.map(c=>[c.number,1])),'lf'),[]);
console.log('Passed exclusive missing normal/gold categories, duplicate quantities and empty card lists.');
