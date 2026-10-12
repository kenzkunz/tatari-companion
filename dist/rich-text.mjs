export const RICH_PREFIX='@rich-v1:';
const allowed=new Set(['strong','em','u','s','a','br']);
export function safeLink(value){
 if(typeof value!=='string'||value.length>2000||/[\u0000-\u0020\u007f]/.test(value)||value.startsWith('//')||value.includes('\\'))return null;
 if(value.startsWith('#')||value.startsWith('/')||value.startsWith('./')||value.startsWith('../'))return value;
 try{const u=new URL(value);return ['https:','http:','mailto:'].includes(u.protocol)&&!u.username&&!u.password?value:null;}catch{return null;}
}
export function validateRich(nodes,depth=0,budget={count:0}){
 if(!Array.isArray(nodes)||depth>12)throw Error('Invalid rich text structure');
 return nodes.map(n=>{if(++budget.count>3000)throw Error('Rich text is too complex');if(!n||typeof n!=='object')throw Error('Invalid rich text node');
  if(typeof n.text==='string'){if(n.text.length>20000)throw Error('Text is too long');return {text:n.text};}
  if(!allowed.has(n.tag))throw Error('Unsupported formatting');if(n.tag==='br')return {tag:'br'};
  const out={tag:n.tag,children:validateRich(n.children,depth+1,budget)};if(n.tag==='a'){out.href=safeLink(n.href);if(!out.href)throw Error('Use a valid website, email or internal link');}return out;
 });
}
export function parseRich(value){if(!value.startsWith(RICH_PREFIX))return null;return validateRich(JSON.parse(value.slice(RICH_PREFIX.length)));}
export function encodeRich(nodes){const result=RICH_PREFIX+JSON.stringify(validateRich(nodes));if(result.length>20000)throw Error('Formatted text exceeds the 20,000-character limit');return result;}
export function editorNodes(root){
 const walk=n=>{if(n.nodeType===3)return [{text:n.nodeValue}];if(n.nodeType!==1)return [];const tag=n.tagName.toLowerCase();if(['script','style','iframe','object','svg','img'].includes(tag))return [];
  if(tag==='br')return [{tag:'br'}];let children=[...n.childNodes].flatMap(walk);const mapped={b:'strong',i:'em',strike:'s'}[tag]||tag;
  if(allowed.has(mapped)){if(mapped==='a'){const href=safeLink(n.getAttribute('href'));return href?[{tag:'a',href,children}]:children;}return [{tag:mapped,children}];}
  if(['div','p'].includes(tag)&&n.previousSibling)children=[{tag:'br'},...children];return children;
 };return validateRich([...root.childNodes].flatMap(walk));
}
export function renderRich(target,nodes){const doc=target.ownerDocument;
 const build=list=>list.map(n=>{if(n.text!==undefined)return doc.createTextNode(n.text);const el=doc.createElement(n.tag);if(n.tag==='a'){const root=new URL('.',import.meta.url);const href=n.href.startsWith('/')&&root.protocol!=='file:'&&root.pathname!=='/'&&!n.href.startsWith(root.pathname)?new URL('.'+n.href,root).href:n.href;el.setAttribute('href',href);el.setAttribute('rel','noopener noreferrer');}if(n.children)el.append(...build(n.children));return el;});target.replaceChildren(...build(validateRich(nodes)));
}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function richHTML(nodes){return validateRich(nodes).map(n=>n.text!==undefined?escape(n.text):n.tag==='br'?'<br>':'<'+n.tag+(n.tag==='a'?' href="'+escape(n.href)+'" rel="noopener noreferrer"':'')+'>'+richHTML(n.children)+'</'+n.tag+'>').join('');}
