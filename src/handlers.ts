import type { APIGatewayProxyHandlerV2, ScheduledHandler } from "aws-lambda";
import { app } from "./app.js";
import { handle } from "hono/aws-lambda";
import { touch } from "./services.js";

const http_inner = handle(app);
export const http: APIGatewayProxyHandlerV2 = async (event, context) => {
  const response = await http_inner(event as any);
  return response;
};

export const schedule: ScheduledHandler = async (event, context) => {
  console.log("event", JSON.stringify(event, null, 2));
  await touch();
};
