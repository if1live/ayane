import type { APIGatewayProxyHandlerV2, ScheduledHandler } from "aws-lambda";
import * as Sentry from "@sentry/serverless";
import { ProfilingIntegration } from "@sentry/profiling-node";
import { app } from "./app.js";
import { handle } from "hono/aws-lambda";
import { touch } from "./services.js";
import { SENTRY_DSN, NODE_ENV } from "./settings.js";

if (SENTRY_DSN) {
  Sentry.AWSLambda.init({
    dsn: SENTRY_DSN,
    integrations: [new ProfilingIntegration()],

    // Performance Monitoring
    // Capture 100% of the transactions, reduce in production!
    tracesSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    // Capture 100% of the transactions, reduce in production!
    profilesSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,

    // 커밋할때 확인하기
    // debug: true,
  });
}

const http_inner = handle(app);
export const http: APIGatewayProxyHandlerV2 = async (event, context) => {
  const response = await http_inner(event as any);
  return response;
};

const schedule_0: ScheduledHandler = async (event, context) => {
  console.log("event", JSON.stringify(event, null, 2));
  await touch();
};
const schedule_1 = Sentry.AWSLambda.wrapHandler(schedule_0);
export const schedule: ScheduledHandler = schedule_1;
