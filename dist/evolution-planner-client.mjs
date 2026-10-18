import {loadRoster,saveRoster} from './my-tatari-client.mjs';
import {completedGoalRoster} from './evolution-planner-model.mjs?v=finish1';
export async function finishEvolution(catalog,actor,goal,client={load:loadRoster,save:saveRoster}){const latest=await client.load(actor);if(!latest?.roster)throw Error('Your saved roster could not be found. Refresh My Tatari.');const next=completedGoalRoster(catalog,latest.roster,goal);if(latest.roster.units[goal.unit].tier>=goal.target)return {...latest,saved:false};const result=await client.save(actor,next,latest.revision);return {...result,saved:true}}
