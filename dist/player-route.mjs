// Only recognized player routes are recovered. All other routes retain the branded 404.
const base=new URL('.',import.meta.url).pathname,path=location.pathname.startsWith(base)?location.pathname.slice(base.length):'',match=path.match(/^player\/([0-9]{1,20})\/?$/);
if(match){const target=new URL('./player.html',import.meta.url);target.searchParams.set('uid',match[1]);target.searchParams.set('album',new URLSearchParams(location.search).get('album')||'4');location.replace(target.href);}
