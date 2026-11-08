const token='299323c895744043813b36d9029bc0d6';
const excluded=new Set(['admin.html','account.html','player.html','adventure-tools-preview.html','404.html']);
export function addVisitorAnalytics(html,page){
 if(excluded.has(page)||page.startsWith('auth/')||!/<\/body>/i.test(html)||html.includes('data-cf-beacon'))return html;
 const beacon=`<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({token})}'></script>`;
 return html.replace(/<\/body>/i,beacon+'</body>');
}
