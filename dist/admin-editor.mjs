import {promptDialog} from './site-dialogs.mjs?v=1';
import {renderFormatted} from './content-format.mjs';
import {editorNodes,encodeRich,safeLink} from './rich-text.mjs';
export function installVisualEditor(input){
 const editor=document.createElement('div');editor.id='visual-editor';editor.className='visual-editor';editor.contentEditable='true';editor.setAttribute('role','textbox');editor.setAttribute('aria-label','Guide text');editor.setAttribute('aria-multiline','true');input.hidden=true;input.after(editor);
 const toolbar=document.createElement('div');toolbar.className='format-toolbar';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Text formatting');editor.before(toolbar);
 const sync=()=>{input.value=encodeRich(editorNodes(editor));};
 const apply=(command,value)=>{editor.focus();document.execCommand('styleWithCSS',false,false);document.execCommand(command,false,value);sync();};
 for(const [label,command] of [['Bold','bold'],['Italic','italic'],['Underline','underline'],['Strike','strikeThrough'],['Remove link','unlink'],['Clear formatting','removeFormat'],['Undo','undo'],['Redo','redo']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',label);b.onmousedown=e=>e.preventDefault();b.onclick=()=>apply(command);toolbar.append(b);}
 const link=document.createElement('button');link.type='button';link.textContent='Link';link.onmousedown=e=>e.preventDefault();link.onclick=async()=>{const selection=window.getSelection(),range=selection?.rangeCount?selection.getRangeAt(0).cloneRange():null;const value=await promptDialog('Enter a website, email, or internal page link.',{title:'Add a link',label:'Link URL',placeholder:'https://… or /page.html',action:'Insert link',maxLength:2000});if(value){const url=safeLink(value.trim());if(!url){document.getElementById('admin-status').textContent='Use a valid website, email or internal link.';return;}editor.focus();if(range){const current=window.getSelection();current.removeAllRanges();current.addRange(range)}apply('createLink',url);}};toolbar.append(link);
 editor.oninput=()=>{try{sync();}catch(e){document.getElementById('admin-status').textContent=e.message;}};editor.addEventListener('paste',e=>{e.preventDefault();apply('insertText',e.clipboardData.getData('text/plain'));});
 return {paint:()=>renderFormatted(editor,input.value),sync};
}
