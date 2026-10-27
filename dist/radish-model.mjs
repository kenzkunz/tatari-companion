export const bands={near:[3,7.5],mid:[7.5,13.5],far:[13.5,Infinity]};
export function bearing(dx,dy){return (Math.atan2((dy-dx)*.5,dx+dy)*180/Math.PI+360)%360;}
export function angleGap(a,b){return Math.abs(((a-b+540)%360)-180);}
export function matches(point,clue){const dx=point.x-clue.x,dy=point.y-clue.y,d=Math.hypot(dx,dy),[lo,hi]=bands[clue.band],margin=Number(clue.margin)||0;if(d<=Math.max(0,lo-margin)||d>hi+margin)return false;const extra=d>0?Math.asin(Math.min(1,Math.SQRT2*margin/Math.hypot(dx+dy,(dy-dx)*.5)))*180/Math.PI:180;return angleGap(bearing(dx,dy),clue.angle)<=clue.tolerance+extra;}
export function groundPoints(layout){const points=new Map();for(const [x0,y0,x1,y1,special] of layout.regions){if(special)continue;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)points.set(x+','+y,{x,y});}return [...points.values()];}
export function candidates(points,clues){return points.filter(p=>clues.every(c=>matches(p,c)));}

export function mapPoints(layout){return Array.from({length:layout.width*layout.height},(_,i)=>({x:i%layout.width,y:Math.floor(i/layout.width)}));}
