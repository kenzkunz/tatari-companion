// Derived v0.49.1 geometry. Potential coverage, not a battle simulation.
export const rangeProfile=mode=>['stage','boss','horde'].includes(mode)?'normal':mode==='dojo'?'arena':null;
const unique=points=>[...new Map(points.map(p=>[p.join(','),p])).values()];
function offsets(shape,span){
 if(shape.offsets)return shape.offsets;
 const d=shape.distance||0,b=shape.bounds?.length?shape.bounds:[-d,d,-d,d];
 const points=[];
 for(let x=Math.max(-span,b[0]);x<=Math.min(span,b[1]);x++)for(let y=Math.max(-span,b[2]);y<=Math.min(span,b[3]);y++)if(!d||Math.abs(x)+Math.abs(y)<=d)points.push([x,y]);
 return points;
}
function turns(points,arena){return arena?unique(points.flatMap(([x,y])=>[[x,y],[-y,x],[-x,-y],[y,-x]])):points}
export function rangeTiles(data,{key,level=1,mode,cols,rows,index,enemyRows=0}){
 const profile=rangeProfile(mode),form=data.forms[key],attack=new Set(),skill=new Set();
 if(!profile||!form)return {attack,skill,supported:false};
 const span=Math.max(cols,rows+enemyRows)*2;
 const origin=[index%cols,Math.floor(index/cols)+enemyRows];
 const inside=([x,y])=>x>=0&&x<cols&&y>=0&&y<rows+enemyRows;
 const absolute=points=>points.map(([x,y])=>[origin[0]+x,origin[1]-y]).filter(inside);
 const mark=(set,points)=>points.forEach(([x,y])=>set.add(y*cols+x));
 const basic=data.skills[form.basic];
 if(basic)mark(attack,absolute(turns(offsets(basic[profile].cast,span),profile==='arena')));
 const ids=[form.basic,...(mode==='horde'?form.horde.filter((_,i)=>level>=[3,5,7][i]):[])];
 for(const id of ids){
  const s=data.skills[id];if(!s)continue;
  const cast=offsets(s[profile].cast,span),effect=offsets(s[profile].effect,span);
  const rotations=profile==='arena'?[([x,y])=>[x,y],([x,y])=>[-y,x],([x,y])=>[-x,-y],([x,y])=>[y,-x]]:[p=>p];
  for(const rotate of rotations){
   const effectOffsets=effect.map(rotate);
   if(s.origin==='self')mark(skill,absolute(effectOffsets));
   else if(s.origin==='target'){
    // Only legal on-board targets may anchor a possible AoE. This also bounds work by board size.
    for(const [tx,ty] of absolute(cast.map(rotate)))mark(skill,effectOffsets.map(([dx,dy])=>[tx+dx,ty-dy]).filter(inside));
   }else mark(skill,s.target==='self'?[origin]:absolute(cast.map(rotate)));
  }
 }
 return {attack,skill,supported:true};
}
