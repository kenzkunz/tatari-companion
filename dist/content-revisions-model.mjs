export async function revisedContent(updates,page,block,text,digest){
 if(typeof text!=='string')return text;
 const choices=updates[page]?.[block];if(!choices)return text;
 return choices[await digest(text)]??text;
}

export function contentLabel(text){
 if(typeof text!=='string'||!text)return 'Removed note';
 if(text.startsWith('@rich-v1:'))try{const flatten=nodes=>nodes.map(n=>(n.text||'')+flatten(n.children||[])).join('');text=flatten(JSON.parse(text.slice(9)))}catch{}
 return 'Text · '+text.slice(0,100);
}
