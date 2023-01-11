import { FunctionDefinition, handlerPath } from "@libs/handler-resolver";

export const hello: FunctionDefinition = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: "*",
    },
  ],
};
