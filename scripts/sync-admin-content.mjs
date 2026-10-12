import {readFile,writeFile,mkdir,copyFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inlineTokens} from '../dist/content-format.mjs';
import {parseRich,richHTML} from '../dist/rich-text.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(repo,'dist');
const args=process.argv.slice(2),file=args[args.indexOf('--file')+1],apply=args.includes('--apply');
if(!args.includes('--file')||!file){console.error('Usage: node scripts/sync-admin-content.mjs --file <downloaded-export.json> [--apply]\nWithout --apply, checks and previews changes only.');process.exit(1);}
const bundle=JSON.parse(await readFile(path.resolve(file),'utf8'));
if(bundle.formatVersion!==1||!Array.isArray(bundle.blocks)||!Array.isArray(bundle.boxes)||!Array.isArray(bundle.banners))throw Error('Unsupported dashboard export');
const catalog=JSON.parse(await readFile(path.join(dist,'admin-content-catalog.json'),'utf8'));
const known=new Map(catalog.map(b=>[b.page+'#'+b.block,b]));const pages=new Set(catalog.map(b=>b.page));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const formatted=text=>{const rich=parseRich(text);const legacy=list=>list.map(t=>t.text!==undefined?escape(t.text):'<'+t.tag+'>'+legacy(t.children)+'</'+t.tag+'>').join('');return rich?richHTML(rich):legacy(inlineTokens(text));};
const regexEscape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function bounds(html,key){const pattern=new RegExp('<(p|h2|h3|li|div)\\b[^>]*\\bdata-site-content="'+regexEscape(key)+'"[^>]*>','g');const match=pattern.exec(html);if(!match||pattern.exec(html))throw Error('Missing or duplicated block '+key);const tag=match[1],scan=new RegExp('</?'+tag+'\\b[^>]*>','g');scan.lastIndex=match.index+match[0].length;let depth=1,token;while((token=scan.exec(html))){depth+=token[0].startsWith('</')?-1:1;if(depth===0)return {start:match.index,inner:match.index+match[0].length,end:token.index};}throw Error('Unclosed block '+key);}
function boxStyle(html,key,kind){const target=bounds(html,key);let stack=[],token;const scan=/<\/?div\b[^>]*>/g;while((token=scan.exec(html))&&token.index<=target.start){if(token[0].startsWith('</'))stack.pop();else stack.push({start:token.index,open:token[0]});}const box=[...stack].reverse().find(x=>/class="[^"]*\bguide-note\b/.test(x.open));if(!box)throw Error('Box wrapper missing '+key);let open=box.open.replace(/class="([^"]*)"/,(_,c)=>'class="'+[...new Set(c.split(/\s+/).filter(v=>v&&v!=='guide-disclaimer').concat(kind==='disclaimer'?['guide-disclaimer']:[]))].join(' ')+'"');const rest=html.slice(box.start+box.open.length);const warning=/^\s*<img\b[^>]*src="[^"]*warning\.png"[^>]*>/;let tail=rest;if(kind==='info')tail=tail.replace(warning,'');else if(!warning.test(tail))tail='<img src="/guide-assets/warning.png" alt="">'+tail;return html.slice(0,box.start)+open+tail;}
const contents=new Map(),images=new Map();
async function getPage(page){if(!pages.has(page)||!/^events\/[a-z0-9-]+\.html$/.test(page))throw Error('Unknown page '+page);if(!contents.has(page))contents.set(page,await readFile(path.join(dist,page),'utf8'));return contents.get(page);}
for(const b of bundle.blocks){if(!known.has(b.page+'#'+b.block)||typeof b.text!=='string'||b.text.length>20000||!Number.isInteger(b.revision))throw Error('Invalid content export');let html=await getPage(b.page);const at=bounds(html,b.block);html=html.slice(0,at.inner)+formatted(b.text)+html.slice(at.end);contents.set(b.page,html);known.get(b.page+'#'+b.block).default=b.text;}
for(const b of bundle.boxes){if(!known.has(b.page_key+'#'+b.block_key)||!['info','disclaimer'].includes(b.kind))throw Error('Invalid box setting');contents.set(b.page_key,boxStyle(await getPage(b.page_key),b.block_key,b.kind));}
const config=await readFile(path.join(dist,'supabase-config.mjs'),'utf8'),expected=config.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)?.[1];
if(bundle.banners.length&&(!expected||new URL(bundle.storageBase).href!==new URL(expected).href))throw Error('Export storage project does not match this repository');
for(const b of bundle.banners){if(!b.published_path)continue;if(!/^[a-z0-9/_-]+\.(png|jpg|webp)$/.test(b.published_path))throw Error('Invalid banner path');let html=await getPage(b.page_key);const image=/<img\b[^>]*\bdata-site-banner(?:="[^"]*")?[^>]*>/;if(!image.test(html))throw Error('Page banner is not registered');const relative='assets/admin-banners/'+path.basename(b.published_path);html=html.replace(image,tag=>tag.replace(/src="[^"]*"/,'src="/'+relative+'"').replace(/\s+srcset="[^"]*"/,''));contents.set(b.page_key,html);images.set(relative,new URL('/storage/v1/object/public/guide-banners/'+b.published_path,bundle.storageBase));}
const changes=[];for(const [page,html] of contents)if(html!==await readFile(path.join(dist,page),'utf8'))changes.push([page,html]);
console.log(JSON.stringify({mode:apply?'apply':'check only',pages:changes.map(([p])=>p),banners:images.size,contentBlocks:bundle.blocks.length},null,2));
if(!apply)process.exit(0);
const downloads=new Map();for(const [name,url] of images){const response=await fetch(url);if(!response.ok)throw Error('Banner download failed: '+response.status);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>5242880)throw Error('Banner exceeds 5 MB');const valid=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)||(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP');if(!valid)throw Error('Banner is not PNG, JPEG or WebP');downloads.set(name,bytes);}
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=path.join(repo,'design-rollbacks','admin-sync-'+stamp);await mkdir(backup,{recursive:true});
const writes=[...changes,['admin-content-catalog.json',JSON.stringify(catalog,null,2)],...downloads];
for(const [name] of writes){const original=path.join(dist,name),saved=path.join(backup,'dist',name);await mkdir(path.dirname(saved),{recursive:true});try{await copyFile(original,saved);}catch(e){if(e.code!=='ENOENT')throw e;}}
await writeFile(path.join(backup,'export.json'),JSON.stringify(bundle,null,2));
for(const [name,value] of writes){const target=path.join(dist,name);await mkdir(path.dirname(target),{recursive:true});const temp=target+'.admin-sync-tmp';await writeFile(temp,value);await rename(temp,target);}
const sqlQuote=s=>"'"+s.replaceAll("'","''")+"'";
const sql='-- Apply AFTER committing/pushing the synchronized files. Keeps newer edits intact.\nbegin;\n'+bundle.blocks.map(b=>'update public.site_content_blocks set default_text='+sqlQuote(b.text)+', revision=revision+1 where page_key='+sqlQuote(b.page)+' and block_key='+sqlQuote(b.block)+' and revision='+b.revision+' and published_text='+sqlQuote(b.text)+' and default_text is distinct from '+sqlQuote(b.text)+';').join('\n')+'\ncommit;\n';
await mkdir(path.join(repo,'supabase/sync'),{recursive:true});await writeFile(path.join(repo,'supabase/sync','admin-baseline-'+stamp+'.sql'),sql);
console.log('Synced. Review git diff, run npm test/build, then commit/push. Backup: '+path.relative(repo,backup));
