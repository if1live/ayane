import { standalone, FunctionDefinition } from "serverless-standalone";
import * as handlers from "./handlers.js";

const definitions: FunctionDefinition[] = [
  {
    name: "httpDispatch",
    handler: handlers.http,
    events: [{ httpApi: { route: "ANY /{pathname+}" } }],
  },
];

const options = {
  httpApi: { port: 3000 },
  schedule: {},
};

const inst = standalone({
  ...options,
  functions: definitions,
});
await inst.start();
console.log("standalone", options);
