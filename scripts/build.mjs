import {cp, readdir, readFile, writeFile, mkdir, rm} from 'node:fs/promises';
import {resolve, join, relative} from 'node:path';
export function normalizeBase(value = '/') {
  if (!/^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(value)) throw Error('Base must be / or /repository-name/');
  return value;
}
export async function build(base = '/', destination = '_site') {
  base = normalizeBase(base);
  const out = resolve(destination);
  if (out !== resolve('_site')) throw Error('Output must be the project _site directory');
  await rm(out, {recursive:true, force:true});
  await cp('dist', out, {recursive:true});
  async function visit(dir) {
    for (const entry of await readdir(dir, {withFileTypes:true})) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) { await visit(file); continue; }
      if (!/\.(html|css|mjs|json)$/.test(file)) continue;
      if (relative(out, file).replaceAll('\\','/').startsWith('vendor/')) continue; // Third-party SDK must remain byte-identical.
      let text = await readFile(file, 'utf8');
      // Prefix site-local absolute URLs only; external and protocol-relative URLs stay intact.
      text = text.replace(/(["'`])\/(?!\/)(?=[A-Za-z0-9#?]|["'`])/g, '$1' + base);
      if (entry.name.endsWith('.css')) text = text.replace(/url\(\/(?!\/)/g, 'url(' + base);
      if (entry.name.endsWith('.html')) {
        const page = relative(out, file).replaceAll('\\','/');
        text = text.replace(/href=(["'])#/g, 'href=$1' + base + page + '#');
        // Also makes relative URLs and fragment navigation safe on nested aliases and 404s.
        text = text.replace(/<head>/i, '<head><base href="' + base + '">');
      }
      await writeFile(file, text);
    }
  }
  await visit(out);
  // Real directory indexes allow clean links and refresh without SPA redirects.
  async function aliases(dir) {
    for (const entry of await readdir(dir, {withFileTypes:true})) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) { await aliases(file); continue; }
      if (!entry.name.endsWith('.html') || ['index.html','404.html'].includes(entry.name)) continue;
      const alias = file.slice(0,-5);
      await mkdir(alias, {recursive:true});
      await cp(file, join(alias,'index.html'));
    }
  }
  await aliases(out);
  await writeFile(join(out,'.nojekyll'),'');
  console.log('Built GitHub Pages site at base ' + base);
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('scripts/build.mjs')) {
  const index = process.argv.indexOf('--base');
  await build(index < 0 ? process.env.PAGES_BASE_PATH || '/' : process.argv[index+1]);
}
