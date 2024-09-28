import * as Sentry from "@sentry/serverless";
import type { APIGatewayProxyHandlerV2, ScheduledHandler } from "aws-lambda";
import { app } from "./app.js";
import { wrap_apigateway } from "./helpers.js";
import { touch } from "./services.js";
import { NODE_ENV, SENTRY_DSN } from "./settings.js";

if (SENTRY_DSN) {
  Sentry.AWSLambda.init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    // Capture 100% of the transactions, reduce in production!
    tracesSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,

    // 커밋할때 확인하기
    // debug: true,
  });
}

const http_inner = wrap_apigateway(app);
export const http: APIGatewayProxyHandlerV2 = async (event, context) => {
  const response = await http_inner(event, context);
  return response;
};

const schedule_0: ScheduledHandler = async (event, context) => {
  console.log("event", JSON.stringify(event, null, 2));
  await touch();
};
const schedule_1 = Sentry.AWSLambda.wrapHandler(schedule_0);
export const schedule: ScheduledHandler = schedule_1;
