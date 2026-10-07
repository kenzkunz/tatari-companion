export const BASE_SPEED=.028,MAX_SPEED=BASE_SPEED*1.5;
export function randomWalkSpeed(random=Math.random){return BASE_SPEED*(.85+random()*.65);}
export function avoidCrowding(walkers,width,dt){
  walkers.forEach(c=>c.avoid=Math.max(0,(c.avoid||0)-dt));
  const center=c=>c.x*Math.max(0,width-c.size)+c.size/2;
  const velocity=c=>c.wait>0?0:Math.sign(c.target-c.x)*c.speed*Math.max(0,width-c.size);
  const sorted=[...walkers].sort((a,b)=>center(a)-center(b));
  for(let i=1;i<sorted.length;i++){
    const left=sorted[i-1],right=sorted[i];
    if(left.avoid||right.avoid||center(right)-center(left)>=.38*(left.size+right.size))continue;
    if(velocity(left)<=velocity(right)&&!(left.wait>0&&right.wait>0))continue;
    left.target=.01;right.target=.99;
    for(const c of [left,right]){c.wait=0;c.avoid=3;c.speed=randomWalkSpeed();}
  }
}
