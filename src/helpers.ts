import { AsyncLocalStorage } from "node:async_hooks";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import type { Hono } from "hono";
import { handle } from "hono/aws-lambda";

export type APIGatewayInput = {
  event: APIGatewayProxyEventV2 | APIGatewayProxyEvent;
  context: Context;
};

export const asyncLocalStorage = new AsyncLocalStorage<APIGatewayInput>();

export function getAPIGatewayInput(): APIGatewayInput | undefined {
  return asyncLocalStorage.getStore();
}

export const wrap_apigateway = (app: Hono) => {
  const handle_core = handle(app);

  return async (
    event: APIGatewayProxyEventV2 | APIGatewayProxyEvent,
    context: Context,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    const apigw: APIGatewayInput = {
      event,
      context,
    };

    const response = await asyncLocalStorage.run(apigw, async () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      return await handle_core(event as any);
    });

    return response;
  };
};
