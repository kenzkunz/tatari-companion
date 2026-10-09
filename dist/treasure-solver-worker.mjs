import {estimate} from './treasure-solver-model.mjs?v=dp1';
onmessage=({data})=>postMessage(estimate(data.set,data.n,data.empty,data.found));
