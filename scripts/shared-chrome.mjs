import {readFile,readdir,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
const navPattern=/<header\b[^>]*class="[^"]*\bnavbar\b[^>]*>[\s\S]*?<\/header>/;
const footPattern=/<footer\b[^>]*class="[^"]*\bsite-footer\b[^>]*>[\s\S]*?<\/footer>/;
export const normalizeChrome=text=>text.replace(/\s+aria-current="[^"]*"/g,'').trim();
export async function chrome(){return {navbar:(await readFile('components/public-navbar.html','utf8')).trim(),footer:(await readFile('components/public-footer.html','utf8')).trim()};}
function navbarFor(text,page){let active=page==='index.html'?'/':'/'+page;if(page.startsWith('schedule/'))active='/schedule.html';return text.replace(/<a\b[^>]*href="([^"]+)"[^>]*>/g,(tag,href)=>href===active&&!tag.includes('class="brand"')?tag.slice(0,-1)+' aria-current="page">':tag);}
async function htmlFiles(folder){const out=[];for(const f of await readdir(folder,{withFileTypes:true})){const name=path.join(folder,f.name);if(f.isDirectory())out.push(...await htmlFiles(name));else if(f.name.endsWith('.html'))out.push(name);}return out;}
export async function auditChrome({apply=false}={}){
 const shared=await chrome(),rows=[];for(const file of await htmlFiles('dist')){const page=path.relative('dist',file).replaceAll('\\','/');if(page==='admin.html'){rows.push({page,exception:'Approved standalone admin dashboard'});continue;}let text=await readFile(file,'utf8');const nav=text.match(navPattern),foot=text.match(footPattern);const navOK=!!nav&&normalizeChrome(nav[0])===normalizeChrome(shared.navbar),footerOK=!!foot&&normalizeChrome(foot[0])===normalizeChrome(shared.footer);rows.push({page,navbar:navOK,footer:footerOK});if(!apply)continue;
  const original=text;const rendered=navbarFor(shared.navbar,page);text=nav?text.replace(navPattern,rendered):text.replace(/<body[^>]*>/,tag=>tag+'<a class="skip" href="#main">Skip to content</a>'+rendered);text=foot?text.replace(footPattern,shared.footer):text.replace('</body>',shared.footer+'</body>');
  if(!text.includes('href="/public-navbar.css'))text=text.replace('</head>','<link rel="stylesheet" href="/public-navbar.css"></head>');
  if(!text.includes('href="/footer.css'))text=text.replace('</head>','<link rel="stylesheet" href="/footer.css"></head>');
  if(!text.includes('src="/navigation.mjs')&&!text.includes("import './navigation.mjs'"))text=text.replace('</body>','<script type="module" src="/navigation.mjs"></script></body>');
  if(page!=='index.html'&&!text.includes('src="/site-messages.mjs'))text=text.replace('</body>','<script type="module" src="/site-messages.mjs?v=1"></script></body>');
  if(page==='tools.html'){text=text.replace('<body>','<body class="legacy-tools">').replace('<main>','<main id="main">');}
  if(text!==original){const dest=path.join('design-rollbacks/public-chrome',page);await mkdir(path.dirname(dest),{recursive:true});try{await copyFile(file,dest,1);}catch(e){if(e.code!=='EEXIST')throw e;}await writeFile(file,text);}
 }
 return rows;
}
