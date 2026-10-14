from pathlib import Path
import json,re,shutil
repo=Path('.');src=Path('D:/COC-Dataminer/library/versions/0.49.1/config/reconstructed/Config');food=Path('D:/COC-Project/CC Art Assets/Food');icons=Path('C:/Users/PC/Documents/Codex/2026-10-08/referenced-chatgpt-conversation-this-is-an/outputs/Readable-images/Assets/Trial')
def blocks(file,indent):
 p=re.split(r'^'+(' '*indent)+r'\[(\d+)\] = \{',file,flags=re.M);return {int(p[i]):p[i+1] for i in range(1,len(p),2)}
def string(b,key):
 m=re.search(r'\["'+key+r'"\] = "((?:[^"\\]|\\.)*)"',b);return m[1] if m else ''
def number(b,key):
 m=re.search(r'\["'+key+r'"\] = ([\d.]+)',b);return int(float(m[1])) if m else None
q=blocks((src/'Quest.lua').read_text(encoding='utf-8'),2);units=blocks((src/'UnitEvolutionTrial.lua').read_text(encoding='utf-8'),2)
d=json.loads(Path('dist/tatari-data/roster.json').read_text(encoding='utf-8'));dest=Path('dist/evolution-assets');dest.mkdir(exist_ok=True)
iconMap={};foodMap={};used=set();missing=[];report=[];alternatives=0
for f in icons.glob('*.png'):
 key=re.sub(r'_[0-9a-f]+$','',f.stem);target='trial-'+key+'.png';shutil.copy2(f,dest/target);iconMap[key]='/evolution-assets/'+target
for f in food.glob('*.png'):
 # stable filesystem names, preserving the supplied artwork
 target='food-'+re.sub(r'[^a-z0-9]+','-',f.stem.lower()).strip('-')+'.png';shutil.copy2(f,dest/target);foodMap[f.stem.lower()]='/evolution-assets/'+target
for u in d['units']:
 forms=blocks(units.get(u['id'],''),4)
 for f in u['forms']:
  b=forms.get(f['evolution']);trial=f.get('trial')
  if not b:
   if trial:missing.append([u['id'],f['evolution'],'source trial missing'])
   continue
  m=re.search(r'\["QuestList"\] = \{(.*?)\n      \}',b,re.S);ids=[int(v) for v in re.findall(r'= (\d+),',m[1])] if m else []
  if not trial:
   missing.append([u['id'],f['evolution'],'source trial not exported']);continue
  if len(ids)!=len(trial['quests']):raise ValueError('Quest count mismatch '+str((u['id'],f['evolution'])))
  trial['requiredStars']=number(b,'RequireStar');trial['sourceDifficulty']=number(b,'QuestDifficulty')
  for quest,qid in zip(trial['quests'],ids):
   raw=q[qid];condition=string(raw,'Condition');target=number(raw,'ProgressTarget');original=quest['text']['en'];quest.update(sourceQuestId=qid,condition=condition,target=target)
   quest['source']={k:string(raw,k) for k in ['QuestText','MultiQuestText','MultiQuestDes1','MultiQuestDes2','QuestIcon','QuestIcon2']};quest['icons']=[]
   for k in ['QuestIcon','QuestIcon2']:
    key=Path(string(raw,k)).stem
    if not key:continue
    if key in iconMap:quest['icons'].append(iconMap[key])
    else:
     missing.append([qid,'icon',key]);quest['icons'].append(iconMap['txui_trial_battle'])
   # Preserve every multi-counter alternative, including mixed progress.
   n=target
   if string(raw,'MultiQuestText'):
    alternatives+=1
    if 'Counter(54)+ed.ConditionX.Counter(77)/100' in condition:
     label=f'Use {n:,} Fishing Rods in Fishing Contest or {n*100:,} bullets in Zobo Shooter. Combined progress counts: 1 rod = 100 bullets.'
    elif ('Counter(54)+ed.ConditionX.Counter(53)' in condition or 'Counter(53)+ed.ConditionX.Counter(54)' in condition):
     label=f'Use {n:,} Fishing Rods in Fishing Contest or {n:,} event items in Marathon Party / Raft Race (skateboards / rafts, depending on event). Combined progress counts equally.'
    elif 'Counter(43)+ed.ConditionX.Counter(76)/60' in condition:
     label=f'Uncover {n:,} treasure-containing tiles in Treasure Hunt or use {n*60:,} fertilizer in Cozy Farm. Combined progress counts: 1 treasure tile = 60 fertilizer.'
    elif 'Counter(53)+ed.ConditionX.Counter(76)/2' in condition:
     label=f'Use {n:,} event items in Marathon Party / Raft Race (skateboards / rafts, depending on event), or use {n*2:,} fertilizer in Cozy Farm. Combined progress counts: 1 event item = 2 fertilizer.'
    else:raise ValueError('Unmapped multi condition '+str(qid)+' '+condition)
    quest['text']['en']=label
   elif '<activityskin:TM_' in string(raw,'QuestText'):
    quest['text']['en']=f'Use {n:,} event items in Marathon Party / Raft Race (skateboards / rafts, depending on event).'
   # Food-specific tasks use supplied food artwork ahead of the generic feeding icon.
   label=quest['text']['en'].lower()
   foodkeys=sorted(foodMap,key=len,reverse=True)
   for key in foodkeys:
    words=key.replace('_',' ').replace('marsh mallow','marshmallow')
    if re.search(r'\b'+re.escape(words)+r'(?:s)?\b',label):
     quest['icons']=[foodMap[key]];break
   report.append({'unitId':u['id'],'tier':f['evolution'],'questId':qid,'condition':condition,'icons':quest['icons'],'hasAlternative':bool(string(raw,'MultiQuestText'))})
Path('dist/tatari-data/roster.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
Path('docs/evolution-trial-audit.json').write_text(json.dumps({'version':'0.49.1','families':len(d['units']),'forms':sum(len(u['forms']) for u in d['units']),'requirements':len(report),'alternativeRequirements':alternatives,'missing':missing,'rows':report},indent=2),encoding='utf-8')
print(json.dumps({'requirements':len(report),'alternatives':alternatives,'missing':missing}))
