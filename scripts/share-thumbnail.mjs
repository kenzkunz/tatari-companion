import {readFile,readdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const thumbnailURL='https://kenzkunz.github.io/tatari-companion/assets/share-thumbnail.png?v=aaf3a80e';
export function shareThumbnail(html){
 const tags=[['property','og:image',thumbnailURL],['property','og:image:secure_url',thumbnailURL],['property','og:image:type','image/png'],['property','og:image:width','146'],['property','og:image:height','131'],['property','og:image:alt','Clash of Critters Unofficial Companion'],['name','twitter:card','summary'],['name','twitter:image',thumbnailURL],['name','twitter:image:alt','Clash of Critters Unofficial Companion']];
 html=html.replace(/<meta\b[^>]*>/gi,tag=>/\b(?:name|property)\s*=\s*["'](?:og:image(?::[^"']*)?|twitter:(?:image(?::[^"']*)?|card))["']/i.test(tag)?'':tag);
 return html.replace(/<\/head>/i,tags.map(([attribute,key,value])=>`<meta ${attribute}="${key}" content="${value}">`).join('')+'</head>');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let count=0;async function visit(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await visit(file);else if(entry.name.endsWith('.html')){const before=await readFile(file,'utf8'),after=shareThumbnail(before);if(before!==after)await writeFile(file,after);count++}}}
 await visit('dist');console.log('Applied shared thumbnail to '+count+' pages.');
}
