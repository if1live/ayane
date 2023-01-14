import { setTimeout } from "node:timers/promises";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";
import { loadResults, redis } from "./store.js";

export type HttpFunction = (
  event: APIGatewayProxyEventV2,
  context: Context
) => Promise<APIGatewayProxyResultV2>;

export const dispatch: HttpFunction = async (event, context) => {
  const http = event.requestContext.http;
  const path = http.path;
  if (path.startsWith("/recent")) {
    return await handle_recent(event, context);
  } else if (path.startsWith("/exc")) {
    return await handle_throw(event, context);
  } else {
    return await handle_dump(event, context);
  }
};

const handle_dump: HttpFunction = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(event, null, 2),
  };
};

const handle_recent: HttpFunction = async (event, context) => {
  const results = await loadResults(redis);
  const entries = results.map((result) => {
    const { label, health } = result;

    let data: unknown;
    switch (health.tag) {
      case "ok":
        data = {
          tag: health.tag,
          at: new Date(health.dateStr),
          value: health.value,
        };
        break;
      case "error":
        data = {
          tag: health.tag,
          at: new Date(health.dateStr),
          reason: {
            name: health.reason.name,
          },
        };
        break;
      case "ignore":
        data = undefined;
        break;
    }
    return [label, data];
  });
  const output = Object.fromEntries(entries);
  return {
    statusCode: 200,
    body: JSON.stringify(output, null, 2),
  };
};

async function throwExc(message: string) {
  await setTimeout(10);
  throw new Error(message);
}

export const handle_throw: HttpFunction = async (event, context) => {
  try {
    await throwExc("sample");
  } catch (e: any) {
    console.error(e);
  } finally {
    return {
      statusCode: 200,
      body: JSON.stringify(event.requestContext.http, null, 2),
    };
  }
};
