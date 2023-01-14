import type { APIGatewayProxyHandlerV2, ScheduledHandler } from "aws-lambda";
import {
  touchMysqlSettled,
  touchPostgresSettled,
  touchRedisSettled,
} from "./providers.js";
import {
  MYSQL_DATABASE_URL,
  POSTGRES_DATABASE_URL,
  REDIS_URL,
} from "./settings.js";
import { loadResults, redis, saveResult } from "./store.js";

/*
각각의 touch는 독립적으로 처리되면 좋겠다
redis로 데이터를 즉시 기록해서 B서비스의 문제로 A서비스의 결과가 기록되지 않는 상황을 피하고 싶다
redis 명령을 서비스 갯수만큼 사용하지만 upstash free tier는 10K commands per day
비용상 문제가 생기진 않을것이다
*/

const execute_planetscale = async () => {
  const endpoint = MYSQL_DATABASE_URL;
  const label = "planetscale";
  const result = await touchMysqlSettled(endpoint);
  await saveResult(redis, label, result);
  return { label, result };
};

const execute_supabase = async () => {
  const endpoint = POSTGRES_DATABASE_URL;
  const label = "supabase";
  const result = await touchPostgresSettled(endpoint);
  await saveResult(redis, label, result);
  return { label, result };
};

const execute_redislab = async () => {
  const endpoint = REDIS_URL;
  const label = "redislab";
  const result = await touchRedisSettled(endpoint);
  await saveResult(redis, label, result);
  return { label, result };
};

export const touch: ScheduledHandler = async (event, context) => {
  console.log("event", JSON.stringify(event, null, 2));

  const entries = await Promise.all([
    execute_planetscale(),
    execute_supabase(),
    execute_redislab(),
  ]);

  for (const entry of entries) {
    const { label, result } = entry;
    if (result.status === "fulfilled") {
      const value = result.value;
      console.log(label, result.status, value);
    } else {
      const reason = result.reason;
      console.log(label, result.status, reason);
    }
  }
};

export const http: APIGatewayProxyHandlerV2 = async (event, context) => {
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
