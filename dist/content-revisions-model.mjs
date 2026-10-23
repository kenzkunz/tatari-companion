export async function revisedContent(updates,page,block,text,digest){
 if(typeof text!=='string')return text;
 const choices=updates[page]?.[block];if(!choices)return text;
 return choices[await digest(text)]??text;
}
