export function chipTargets(chip,draft,known,player){
 const cols=draft.gameMode==='horde'?6:5;
 const team=draft.cells.flatMap((cell,index)=>cell&&(draft.mode!=='duo'||cell.player===player)?[{...cell,index,entry:known.get(cell.key)}]:[]);
 const elements={Water:2,Fire:3,Grass:4,Rock:6,Lightning:5};const element=chip.name.match(/^(Water|Fire|Grass|Rock|Lightning) Form/);
 let targets=[],condition='';
 if(element)targets=team.filter(m=>m.entry.element===elements[element[1]]);
 else if([26,28,37].includes(chip.id)){targets=team;if(chip.id===28)condition='When attacking bosses';if(chip.id===37)condition='When countered by the enemy element'}
 else if([27,30].includes(chip.id))targets=team.filter(m=>Math.floor(m.index/cols)<2);
 else if(chip.id===31)targets=team.filter(m=>Math.floor(m.index/cols)>=4);
 else if(chip.id===29){targets=team.filter(m=>!draft.cells.some((other,index)=>other&&Math.abs(Math.floor(m.index/cols)-Math.floor(index/cols))+Math.abs(m.index%cols-index%cols)===1));condition='No Tatari directly above, below, left or right, including your teammate’s.'}
 else if(chip.id===34)targets=team.filter(m=>m.level<3);
 else if([35,36,39,45,49].includes(chip.id)){targets=team;if(chip.id===45)condition='After movement, for 30 seconds';if(chip.id===36)condition='When knocked down'}
 else if(chip.id===47){const counts=new Map();team.forEach(m=>counts.set(m.entry.element,(counts.get(m.entry.element)||0)+1));const min=Math.min(...counts.values());targets=team.filter(m=>counts.get(m.entry.element)===min)}
 else if(chip.id===48){targets=team.filter(m=>m.level===4);condition=targets.length>=3?'Triggers once with 3 Lv 4 Tatari':'Requires 3 Lv 4 Tatari'}
 else if(chip.id===32){targets=team.filter(m=>team.filter(other=>other.index%cols===m.index%cols&&Math.floor(other.index/cols)<Math.floor(m.index/cols)).length===1);condition='45% DMG Boost with exactly one of your Tatari ahead in the same column; gaps are allowed.'}
 else condition='Formation or battle effect; no individual stat targets';
 return {targets,condition};
}

export function chipClaimedBy(chip,draft,player){return draft.mode==='duo'&&chip.unique?(draft.chips||[]).find(c=>c.id===chip.id&&c.player!==player)?.player??null:null}
