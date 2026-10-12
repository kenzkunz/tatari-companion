import {auditChrome} from './shared-chrome.mjs';
const apply=process.argv.includes('--apply'),before=await auditChrome({apply}),rows=apply?await auditChrome():before;
const publicPages=rows.filter(r=>!r.exception),issues=publicPages.filter(r=>!r.navbar||!r.footer);
console.log(JSON.stringify({mode:apply?'applied':'check',publicPages:publicPages.length,mismatches:issues,exceptions:rows.filter(r=>r.exception)},null,2));
if(!apply&&issues.length)process.exitCode=1;
