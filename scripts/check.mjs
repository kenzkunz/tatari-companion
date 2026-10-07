import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {build} from './build.mjs';
async function files(dir) {
  const result=[];
  for(const item of await readdir(dir,{withFileTypes:true})) {
    const path=join(dir,item.name);
    result.push(...(item.isDirectory()?await files(path):[path]));
  }
  return result;
}
for (const base of ['/', '/milkroad-test/']) {
  await build(base);
  const root=resolve('_site');let checked=0;
  for(const file of await files(root)) {
    if(file.endsWith('.mjs')) execFileSync(process.execPath,['--check',file]);
    if(!/\.(html|css|mjs)$/.test(file)) continue;
    const text=await readFile(file,'utf8');
    if(file.endsWith('.html')) assert(text.includes('<base href="'+base+'">'));
    const refs=[...text.matchAll(/(?:src|href|srcset)=["']([^"']+)["']/g)].map(x=>x[1]);
    refs.push(...[...text.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)].map(x=>x[1]));
    for(const ref of refs) {
      if(/^(https?:|data:|#|\/\/)/.test(ref)) continue;
      const path=ref.split(/[?#]/)[0];if(!path)continue;
      const target=path.startsWith('/')?(assert(path.startsWith(base)),join(root,path.slice(base.length))):join(file.endsWith('.html')?root:dirname(file),path);
      assert((await stat(target)).isFile()||(await stat(target)).isDirectory(),ref);
      checked++;
    }
    if(file.endsWith('.mjs')) assert(!/(["'`])\/(?!\/)(?:assets|data\.json|worker\.mjs)/.test(text.replaceAll(base,'SITEBASE/')),file);
  }
  for(const route of ['schedule','resources','events/cozy-farm','drafter/arena','tools']) {
    assert.equal(await readFile('_site/'+route+'/index.html','utf8'),await readFile('_site/'+route+'.html','utf8'));
  }
  const error=await readFile('_site/404.html','utf8');
  assert(error.includes('Error 404!'));
  assert((await readFile('_site/navigation.mjs','utf8')).includes('https://ko-fi.com/kenzkunz'));
  assert((await readFile('_site/tools/index.html','utf8')).includes('href="'+base+'tools.html#cards"'));
  console.log('Checked '+checked+' local references, clean-route aliases, modules and branded 404 at '+base);
}
await build('/');
