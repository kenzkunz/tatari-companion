// Tier artwork keeps its published image format.
export function tierFrame(tier){
 return 'images/tier-'+tier+([1,3,4].includes(Number(tier))?'.webp':'.png');
}
