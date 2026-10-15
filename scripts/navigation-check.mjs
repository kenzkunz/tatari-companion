import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {auditChrome} from './shared-chrome.mjs';
const listeners=()=>({events:{},addEventListener(name,handler){(this.events[name]??=[]).push(handler)}});
const details=[{...listeners(),open:false},{...listeners(),open:false}];
const classes=new Set(),nav={dataset:{},classList:{toggle(name){if(classes.has(name)){classes.delete(name);return false;}classes.add(name);return true;},remove(name){classes.delete(name)}},querySelectorAll:()=>details};
const attributes={},menu={...listeners(),setAttribute:(name,value)=>attributes[name]=value};
const document={...listeners(),getElementById:id=>id==='navigation'?nav:null,querySelector:()=>menu};
const source=(await readFile('dist/navigation.mjs','utf8')).replace(/^import .*;\s*$/gm,'').replace(/^void import\(.*\);\s*$/gm,'');
for(let i=0;i<2;i++)vm.runInNewContext(source,{document});
assert.equal(menu.events.click.length,1,'Multiple module URLs must not install multiple click handlers');
const click=()=>menu.events.click[0]();click();assert(classes.has('open'));assert.equal(attributes['aria-expanded'],'true');click();assert(!classes.has('open'));assert.equal(attributes['aria-expanded'],'false');
click();document.events.keydown[0]({key:'Escape'});assert(!classes.has('open'));
click();document.events.click[0]({target:{closest:()=>null}});assert(!classes.has('open'));
details[0].open=details[1].open=true;details[0].events.toggle[0]();assert(details[0].open);assert(!details[1].open);
for(const file of ['home.mjs','schedule.mjs','resources.mjs','event-matchmaking.mjs'])assert(!(await readFile('dist/'+file,'utf8')).includes("import './navigation.mjs'"),file+' must use the shared HTML entry');
for(const row of await auditChrome())if(!row.exception){const html=await readFile('dist/'+row.page,'utf8');assert.equal([...html.matchAll(/<script[^>]+src=["'][^"']*navigation\.mjs[^"']*["']/g)].length,1,row.page+' needs one shared navigation entry');}
console.log('Navigation passed: duplicate initialization, one-tap open/close, Escape, outside click, desktop dropdowns and one entry per public page.');
