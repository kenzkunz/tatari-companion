import {estimate} from './treasure-solver-model.mjs';
onmessage=({data})=>postMessage(estimate(data.set,data.n,data.empty,data.found));
