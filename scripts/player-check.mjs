import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {validateUid,playerLink,playerParameters} from '../dist/player-model.mjs';
assert.equal(validateUid(' 18618157 '),'18618157');for(const bad of ['',null,'abc','123/4','000123','1<script>'])assert.throws(()=>validateUid(bad));
assert.equal(playerLink('18618157',4,'https://kenzkunz.github.io/tatari-companion/trading.mjs'),'https://kenzkunz.github.io/tatari-companion/player/18618157?album=4');
assert.deepEqual(playerParameters('https://kenzkunz.github.io/tatari-companion/player/18618157?album=4','https://kenzkunz.github.io/tatari-companion/player.mjs'),{uid:'18618157',album:4});
assert.deepEqual(playerParameters('http://127.0.0.1:4184/tatari-companion/player.html?uid=18618157&album=4','http://127.0.0.1:4184/tatari-companion/player.mjs'),{uid:'18618157',album:4});
const sql=await readFile('supabase/006_required_uid_player_albums.sql','utf8');assert(sql.includes('profiles_game_uid_unique'));assert(sql.includes('revoke delete on public.profiles'));assert(sql.includes('old.game_id'));assert(sql.includes('(p.album_public or p.trade_enabled)'));
const guard=await readFile('dist/uid-guard.mjs','utf8');assert(guard.includes("addEventListener('cancel',e=>e.preventDefault())"));assert(!guard.includes("textContent='Close'"));
console.log('Passed UID validation, pretty/direct player links, immutable schema safeguards and required dialog cancellation guard.');
