import { touch } from "./handlers.js";
import { loadResults, redis } from "./store.js";

await touch({} as any, {} as any, {} as any);
// console.log(JSON.stringify(await loadResults(redis)))
