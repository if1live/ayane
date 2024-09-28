import {
  CreateTableCommand,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";
import { type FunctionDefinition, standalone } from "serverless-standalone";
import * as handlers from "./handlers.js";
import { dynamodb } from "./instances.js";

const prepare = async () => {
  try {
    const result = await dynamodb.send(
      new CreateTableCommand({
        TableName: "AyaneKeyValue",
        AttributeDefinitions: [{ AttributeName: "label", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "label", KeyType: "HASH" }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      }),
    );
  } catch (e: unknown) {
    if (e instanceof ResourceInUseException) {
      // ResourceInUseException: Cannot create preexisting table
      // console.log(`${e.name}: ${e.message}`);
    } else {
      console.error(e);
      throw e;
    }
  }
};
await prepare();

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
