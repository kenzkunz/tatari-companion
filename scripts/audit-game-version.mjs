import {readFile,writeFile,mkdir,realpath,copyFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {compareSnapshots} from '../dist/version-audit-model.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1];
const registry=JSON.parse(await readFile(path.join(repo,'dist/version-audit-registry.json'),'utf8'));const hash=v=>createHash('sha256').update(v).digest('hex');
const version=value('--version');
if(args.includes('--prepare')){
 if(!/^[a-zA-Z0-9._-]{1,40}$/.test(version??''))throw Error('Provide a version label');
 const folder=path.join(repo,'.game-audits/staging',version);try{await access(folder);throw Error('Staging folder already exists; existing research was preserved');}catch(e){if(e.code!=='ENOENT')throw e;}
 await mkdir(folder,{recursive:true});for(const file of new Set(registry.guides.flatMap(g=>g.sources.map(s=>s.file)))){const target=path.join(folder,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(repo,'dist',file),target,1);}console.log('Review staging folder ready: '+folder+'\nReplace these reviewed datasets with the new version evidence before capture.');
}else if(args.includes('--capture')){
 if(!/^[a-zA-Z0-9._-]{1,40}$/.test(version??''))throw Error('Provide --version, for example 0.49.1');
 const source=await realpath(path.resolve(args.includes('--source-root')?value('--source-root'):path.join(repo,'dist'))),snapshot={formatVersion:1,gameVersion:version,capturedAt:new Date().toISOString(),guides:{}};
 const sensitive=/(?:^|_)(?:email|password|access_token|refresh_token|service_role|user_id|game_uid)(?:$|_)/i;
 function checkData(v){if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){if(sensitive.test(k))throw Error('Private account data is not an audit source');checkData(x);}}
 for(const guide of registry.guides){snapshot.guides[guide.key]={sources:{}};for(const item of guide.sources){const target=path.join(source,item.file);try{const resolved=await realpath(target);if(!resolved.startsWith(source+path.sep))throw Error('Source escapes the reviewed data directory');const bytes=await readFile(resolved);if(bytes.length>20000000)throw Error('Source is too large');const entry={present:true,hash:hash(bytes)};if(item.kind==='data'){entry.data=JSON.parse(bytes);checkData(entry.data);}snapshot.guides[guide.key].sources[item.file]=entry;}catch(e){if(e.code!=='ENOENT')throw e;snapshot.guides[guide.key].sources[item.file]={present:false};}}}
 const output=path.resolve(args.includes('--out')?value('--out'):path.join(repo,'.game-audits/snapshots',version+'.json'));await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(snapshot,null,2),{flag:args.includes('--overwrite')?'w':'wx'});console.log('Snapshot saved: '+output);
}else if(args.includes('--before')&&args.includes('--after')){
 const before=JSON.parse(await readFile(path.resolve(value('--before')),'utf8')),after=JSON.parse(await readFile(path.resolve(value('--after')),'utf8'));if(before.formatVersion!==1||after.formatVersion!==1)throw Error('Unsupported snapshot');
 const report=compareSnapshots(before,after,registry,hash);report.reportId=hash(JSON.stringify({from:before.gameVersion,to:after.gameVersion,findings:report.findings,coverage:report.coverage,total:report.totalChanges}));
 const output=path.resolve(args.includes('--out')?value('--out'):path.join(repo,'.game-audits/reports',before.gameVersion+'-to-'+after.gameVersion+'-'+report.reportId.slice(0,8)+'.json'));await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2));
 const summary=['# Version audit: '+report.fromVersion+' → '+report.toVersion,'','Detected changes: '+report.totalChanges+'. Source changes require human review; no guide text was overwritten.','',...report.findings.map(f=>'## '+f.title+' — '+f.source+'\n\n'+f.path+'\n\nBefore: '+f.before+'\n\nAfter: '+f.after+'\n\n'+f.note+'\n')].join('\n');await writeFile(output.replace(/\.json$/,'.md'),summary);console.log('Audit report saved: '+output+'\nChanges: '+report.totalChanges+(report.truncated?' (report truncated; investigate remaining changes)':''));
}else{console.log('Capture: node scripts/audit-game-version.mjs --capture --version 0.49.1\nCompare: node scripts/audit-game-version.mjs --before <snapshot.json> --after <snapshot.json> [--out <report.json>]');process.exitCode=1;}
