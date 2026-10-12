import {parseRich,renderRich} from './rich-text.mjs';
// A deliberately small inline format: text, **bold**, *italic*, __underline__.
// Never interprets HTML, links, attributes or scripts.
export function inlineTokens(text,depth=0){
 if(depth>8)return [{text}];
 const pattern=/\*\*([^\n]+?)\*\*|__([^\n]+?)__|\*([^*\n]+?)\*/g;const result=[];let start=0,match;
 while((match=pattern.exec(text))){if(match.index>start)result.push({text:text.slice(start,match.index)});const value=match[1]??match[2]??match[3];result.push({tag:match[1]!==undefined?'strong':match[2]!==undefined?'u':'em',children:inlineTokens(value,depth+1)});start=pattern.lastIndex;}
 if(start<text.length)result.push({text:text.slice(start)});return result;
}
export function renderFormatted(target,text){try{const rich=parseRich(text);if(rich){renderRich(target,rich);return;}}catch{target.textContent=text;return;}const doc=target.ownerDocument;function nodes(tokens){return tokens.map(t=>{if(t.text!==undefined)return doc.createTextNode(t.text);const n=doc.createElement(t.tag);n.append(...nodes(t.children));return n;});}target.replaceChildren(...nodes(inlineTokens(text)));}
export function wrapSelection(text,start,end,marker){return {text:text.slice(0,start)+marker+text.slice(start,end)+marker+text.slice(end),start:start+marker.length,end:end+marker.length};}

export function serializeInline(node){if(node.nodeType===3)return node.nodeValue;const text=[...node.childNodes].map(serializeInline).join('');const marker={STRONG:'**',B:'**',EM:'*',I:'*',U:'__'}[node.nodeName];return marker?marker+text+marker:node.nodeName==='BR'?'\n':text;}
