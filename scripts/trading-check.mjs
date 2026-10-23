import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {safeAvatar,sortRoutes,compatibleStars} from '../dist/trade-model.mjs';
assert.equal(safeAvatar('javascript:alert(1)'),'');assert.equal(safeAvatar('https://tracking.example/avatar.png'),'');assert.equal(safeAvatar('https://cdn.discordapp.com/avatars/test.png'),'https://cdn.discordapp.com/avatars/test.png');
assert(compatibleStars(2,2,'Same Rarity'));assert(!compatibleStars(2,3,'Same Rarity'));assert(compatibleStars(2,3,'Flexible Rarity'));assert(!compatibleStars(1,3,'Flexible Rarity'));assert(compatibleStars(1,5,'Any Rarity'));
const routes=[{length:2,priority:3,updated_at:'2026-10-09'},{length:1,priority:1,updated_at:'2026-10-08'}];assert.equal(sortRoutes(routes,'shortest')[0].length,1);assert.equal(sortRoutes(routes,'priority')[0].priority,3);

console.log('Passed trade avatar allowlist, rarity rules and route sorting.');
