export function formationName(draft){
 const c=draft.context||{},mode=draft.gameMode;
 if(mode==='stage'){const prefix=c.stageType==='normal'?'Normal stage story':c.stageType==='boss'?'Boss stage story':'Stage story';const from=c.fromChapter||c.fromStage?[c.fromChapter||'?',c.fromStage||'?'].join('-'):'';const to=c.toChapter||c.toStage?[c.toChapter||'?',c.toStage||'?'].join('-'):'';return [prefix,from+(to&&to!==from?' to '+to:'')].filter(Boolean).join(' ')}
 if(mode==='boss')return [c.boss,'Boss Challenge',c.bossLevel].filter(Boolean).join(' ');
 if(mode==='horde')return ['Horde Invasion',c.difficulty].filter(Boolean).join(' ')+' - '+(draft.mode==='duo'?'Duo':'Solo');
 if(mode==='dojo')return [[c.dojoElement,'Dojo'].filter(Boolean).join(' '),c.dojoTier,c.dojoStages?.length?c.dojoStages.join(', '):null].filter(Boolean).join(' - ');
 if(mode==='goldrush')return 'Gold Rush Formation';
 return c.customName||'Other Formation';
}
