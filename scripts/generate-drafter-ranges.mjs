// Input is the selected private range handoff, never raw game archives.
import {readFile,writeFile} from 'node:fs/promises';
if(!process.argv[2])throw Error('Usage: node scripts/generate-drafter-ranges.mjs <range-candidate-handoff.json>');
const source=JSON.parse(await readFile(process.argv[2],'utf8'));
const forms=Object.fromEntries(source.units.flatMap(u=>u.forms.map(f=>[`${u.unitId}-${f.evolution}`,{basic:f.basicSkillId,horde:u.hordeSkillIds}])));
const ids=new Set(Object.values(forms).flatMap(f=>[f.basic,...f.horde]));
const shape=s=>Object.fromEntries((s.distance===undefined?['offsets']:['distance','bounds']).filter(k=>s[k]!==undefined).map(k=>[k,s[k]]));
const skills=Object.fromEntries(source.skills.filter(s=>ids.has(s.skillId)).map(s=>[s.skillId,{id:s.skillId,active:s.activeType,target:s.targetType,origin:s.effectOrigin,...Object.fromEntries(['normal','arena'].map(profile=>[profile,Object.fromEntries(['cast','effect'].map(k=>[k,shape(s[profile][k])]))]))}]));
const data={version:source.gameVersion,evidence:'configured tile geometry; custom runtime modifiers are not simulated',forms,skills};
await writeFile(new URL('../dist/drafter-ranges.json',import.meta.url),JSON.stringify(data));
console.log(`Exported ${Object.keys(forms).length} forms and ${Object.keys(skills).length} basic/Horde skill geometries.`);
