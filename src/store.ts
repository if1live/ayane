import https from "node:https";
import { Redis as UpstashRedis } from "@upstash/redis";
import { Redis } from "ioredis";
import {
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
} from "./settings.js";
import { ServiceHealth, TouchSettledResult } from "./types.js";

function createUpstashRedis(): UpstashRedis | null {
  if (!UPSTASH_REDIS_REST_URL) return null;
  if (!UPSTASH_REDIS_REST_TOKEN) return null;

  const agent = new https.Agent({ keepAlive: true });
  return new UpstashRedis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
    responseEncoding: false,
    agent,
  });
}
const upstashRedis = createUpstashRedis();

// redis와의 접속은 serverless 특성을 생각해서 http 기반 upstash redis 사용한다.
// 하지만 개발할때는 ioredis-mock같은거 쓰려고 ioredis처럼 취급한다.
export const redis = upstashRedis as unknown as Redis;

const key = "ayane_status";

export async function saveResult(
  redis: Redis,
  label: string,
  result: TouchSettledResult<object | boolean>
) {
  const now = new Date();
  const health = transform(result, now);
  switch (health.tag) {
    case "ignore": {
      // redis 명령을 아끼려고 아무것도 하지 않는다
      break;
    }
    default: {
      const text = JSON.stringify(health);
      await redis.hset(key, { [label]: text });
      break;
    }
  }
}

export async function loadResults(
  redis: Redis
): Promise<Array<{ label: string; health: ServiceHealth }>> {
  const data = await redis.hgetall(key);
  if (!data) {
    return [];
  }

  const results = [];
  for (const entry of Object.entries(data)) {
    const [label, text] = entry;

    const health: ServiceHealth =
      typeof text === "string" ? JSON.parse(text) : (text as unknown);

    results.push({ label, health });
  }
  return results;
}

export async function loadSortedResults(
  redis: Redis
): Promise<Array<{ label: string; health: ServiceHealth }>> {
  const entries = await loadResults(redis);

  // hgetall로 얻은 결과의 순서가 보장되지 않는다.
  // 데이터가 그대로인데 새로고침 할때마다 내용이 바뀌는건 원한게 아니다.
  // 그래서 직접 정렬
  const sortedEntries = entries.sort((a, b) => a.label.localeCompare(b.label));
  return sortedEntries;
}

function transform(
  result: TouchSettledResult<object | boolean>,
  now: Date
): ServiceHealth {
  const dateStr = now.toISOString();

  if (result.status === "rejected") {
    const reason = result.reason;
    return {
      tag: "error",
      dateStr,
      reason: {
        name: reason.name,
        message: reason.message,
      },
    };
  }

  const { value } = result;
  return typeof value === "boolean"
    ? { tag: "ignore" }
    : { tag: "ok", dateStr, value };
}
