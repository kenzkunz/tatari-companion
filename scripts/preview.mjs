import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const base = process.env.PAGES_BASE_PATH || '/';
const root = resolve('_site');
const mime = {'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.gif':'image/gif','.ttf':'font/ttf','.svg':'image/svg+xml'};
createServer(async (req,res)=>{
  try {
    const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (!path.startsWith(base)) throw Error('Outside site');
    let file = resolve(root, '.' + '/' + path.slice(base.length));
    if (file !== root && !file.startsWith(root+sep)) throw Error('Outside site');
    if ((await stat(file)).isDirectory()) {
      if (!path.endsWith('/')) {res.writeHead(301,{Location:path+'/' + new URL(req.url,'http://localhost').search});res.end();return;}
      file = resolve(file,'index.html');
    }
    const content = await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(content);
  } catch {
    res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile(resolve(root,'404.html')));
  }
}).listen(4180,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4180'+base));
