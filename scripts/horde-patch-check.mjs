await import('./battle-data-check.mjs');
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const read=async p=>JSON.parse(await readFile('dist/'+p,'utf8'));
const [guide,roster,audit,additions]=await Promise.all(['guide-data/horde.json','tatari-data/roster.json','patch-data/horde-165921-audit.json','guide-data/horde-tatari-additions.json'].map(read));
assert.equal(guide.season,'S3');assert.equal(guide.waves.length,150);
for(let difficulty=1;difficulty<=6;difficulty++){
 const waves=guide.waves.filter(w=>w.difficulty===difficulty);assert.equal(waves.length,25);
 assert.deepEqual(waves.map(w=>w.wave),Array.from({length:25},(_,i)=>i+1));
 for(const w of waves){assert.equal(w.normal,w.enemies.filter(e=>!e.boss).reduce((n,e)=>n+e.count,0));assert.equal(w.bosses,w.enemies.filter(e=>e.boss).reduce((n,e)=>n+e.count,0));assert.equal(w.income,w.normal*4+w.bosses*100);for(const e of w.enemies){assert.equal(e.name,audit.zoboNames[e.id]);assert((await stat('dist/'+e.icon.replace(/^\//,''))).isFile());}}
}
assert.equal(Object.keys(audit.zoboNames).length,71);
const chip=id=>guide.chips.find(c=>c.id===id).description;
for(const [id,value]of [[10,'400'],[30,'12%'],[33,'35%'],[49,'180']])assert(chip(id).includes(value));
assert(chip(32).includes('your own'));assert(chip(35).includes('Contract Employees'));assert(chip(35).includes('600'));
const skills=new Map(roster.units.flatMap(u=>u.forms.flatMap(f=>f.skills.horde)).map(s=>[s.id,s]));
assert.equal(audit.changes.length,59);
for(const change of audit.changes){let expected=change.new;if(expected&&typeof expected==='object')expected=Object.values(expected)[0];assert(skills.get(change.id).details.some(d=>d.value===expected),`Missing updated skill ${change.id}: ${expected}`);}
assert.deepEqual(additions.units[0].forms[0].skills.horde.map(s=>s.id),[6891,6892,6893]);
const text=v=>typeof v==='string'?v:v?.en||'';
for(const form of additions.units[0].forms){assert((await stat('dist/tatari-data/'+form.portrait)).isFile());for(const s of [...form.skills.normal,...form.skills.horde])assert(!/[\u3400-\u9fff]|\$\{\d+\}|#\.[A-Za-z]/.test(JSON.stringify([text(s.name),text(s.description),...s.details.flatMap(d=>[text(d.title),text(d.text)])])));}
const html=await readFile('dist/my-tatari.html','utf8'),stats=await readFile('dist/tatari-stats.mjs','utf8');
assert(/id="roster-level"[^>]*max="3600"/.test(html));assert(stats.includes('level.max=3600'));assert(stats.includes("level.readOnly=statMode==='fixed500'"));
console.log('Passed all S3 difficulties/waves, 71 localized Zobo identities and assets, chip balances, skill updates, Bonobean references and 3,600 account-level controls.');
