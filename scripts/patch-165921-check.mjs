import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const patch=JSON.parse(await readFile('dist/patch-data/165921.json','utf8'));
const data=JSON.parse(await readFile('dist/tatari-data/level-standards.json','utf8'));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const legacy={levels:Object.fromEntries(Object.entries(data.levels).filter(([level])=>Number(level)<=2400)),standards:Object.fromEntries(patch.accountLevels.legacyStandardIds.map(id=>[id,data.standards[id]]))};
assert.equal(createHash('sha256').update(JSON.stringify(stable(legacy))).digest('hex'),patch.accountLevels.legacyCoverageSha256,'Every previously supported level and standard must remain unchanged');
assert.equal(Object.keys(data.levels).length,3600);
for(let level=1;level<=3600;level++){
  const steps=data.levels[level];
  assert(steps&&steps[0],`Missing level ${level}`);
  for(const values of Object.values(steps))for(const id of values)assert(data.standards[id]?.length===3&&data.standards[id].every(n=>Number.isFinite(n)&&n>0));
}
assert(!Object.hasOwn(patch,'livePayloadIdentity'),'Private provenance is excluded from the public patch summary');
assert.deepEqual(patch.horde.difficulties.map(d=>d.difficulty),[1,2,3,4,5,6]);
console.log('Passed all 3,600 recorded levels, standard references and exact legacy-data preservation.');
