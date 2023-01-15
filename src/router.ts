import { setTimeout } from "node:timers/promises";
import { Router } from "itty-router";
import { APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSortedResults, redis } from "./store.js";
import { MyRequest } from "./http.js";

export const router = Router();

router.get("/recent", async (req0) => {
  const req = req0 as MyRequest;
  const results = await loadSortedResults(redis);
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
    return [label, data] as const;
  });

  const output = Object.fromEntries(entries);
  return {
    statusCode: 200,
    body: JSON.stringify(output, null, 2),
  };
});

router.get("/exc", async (req0) => {
  const req = req0 as MyRequest;
  const { event, context } = req.apiGateway;

  async function throwExc(message: string) {
    await setTimeout(10);
    throw new Error(message);
  }

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
});

router.all("/", async (req0) => {
  const req1 = req0 as MyRequest;
  const { apiGateway, ...req } = req1;
  const { event, context } = apiGateway;

  return {
    statusCode: 200,
    body: JSON.stringify({ req, event }, null, 2),
  };
});

router.all("*", () => {
  const response: APIGatewayProxyResultV2 = {
    statusCode: 404,
    body: "Not Found",
  };
  return response;
});
