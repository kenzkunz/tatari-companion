import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';

const horde=JSON.parse(await readFile(new URL('../dist/guide-data/horde.json',import.meta.url),'utf8'));
const catalog=JSON.parse(await readFile(new URL('../dist/zobo-catalog.json',import.meta.url),'utf8'));
assert.equal(horde.waves.length,150,'Expected 25 Horde waves across six difficulties');
assert.deepEqual([...new Set(horde.waves.map(w=>w.difficulty))],[1,2,3,4,5,6]);
for(let difficulty=1;difficulty<=6;difficulty++){
  const waves=horde.waves.filter(w=>w.difficulty===difficulty);
  assert.equal(waves.length,25,'Difficulty '+difficulty+' must have 25 waves');
  assert.deepEqual(waves.map(w=>w.wave),Array.from({length:25},(_,i)=>i+1));
}
const enemies=new Map(catalog.enemies.map(enemy=>[enemy.id,enemy]));
for(const wave of horde.waves){
  for(const key of ['normal','bosses','income']) assert(Number.isFinite(wave[key])&&wave[key]>=0,'Invalid '+key+' in difficulty '+wave.difficulty+', wave '+wave.wave);
  for(const key of ['atk','defense','hp']) assert(Number.isFinite(wave[key])&&wave[key]>0,'Invalid '+key+' multiplier in difficulty '+wave.difficulty+', wave '+wave.wave);
  assert.equal(wave.normal,wave.enemies.filter(enemy=>!enemy.boss).reduce((n,enemy)=>n+enemy.count,0),'Normal count mismatch');
  assert.equal(wave.bosses,wave.enemies.filter(enemy=>enemy.boss).reduce((n,enemy)=>n+enemy.count,0),'Boss count mismatch');
  for(const enemy of wave.enemies){
    const listed=enemies.get(enemy.id);
    assert(listed,'Unknown Zobo '+enemy.id);
    assert.equal(enemy.name,listed.name,'Name mismatch for Zobo '+enemy.id);
    assert.equal(enemy.boss,listed.boss,'Type mismatch for Zobo '+enemy.id);
    assert.equal(enemy.element,listed.element,'Element mismatch for Zobo '+enemy.id);
    assert(Number.isInteger(enemy.count)&&enemy.count>0,'Invalid Zobo count');
    await stat(new URL('../dist'+enemy.icon,import.meta.url));
  }
}
assert.equal(horde.chips.length,49,'Expected all 49 Horde chips');
assert.equal(new Set(horde.chips.map(chip=>chip.id)).size,horde.chips.length,'Duplicate Horde chip id');
for(const chip of horde.chips){
  assert(chip.name&&chip.description&&chip.category,'Incomplete Horde chip');
  assert(Array.isArray(chip.waves)&&chip.waves.every(wave=>Number.isInteger(wave)&&wave>=1&&wave<=25),'Invalid chip wave list');
  assert(Number.isFinite(chip.quality)&&chip.quality>0,'Invalid chip quality');
  await stat(new URL('../dist'+chip.icon,import.meta.url));
}
console.log('Passed active Horde guide data: six difficulties, 150 waves, Zobo names and icons, and all 49 chips.');