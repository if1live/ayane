import { Redis } from "ioredis";
import { ServiceHealth, TouchSettledResult } from "./types.js";

const key = "ayane_status";

export async function deleteResult(redis: Redis) {
  return await redis.del(key);
}

export async function saveResult(
  redis: Redis,
  label: string,
  result: TouchSettledResult<object | boolean>,
) {
  const health = transform(result);
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
  redis: Redis,
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
  redis: Redis,
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
): ServiceHealth {
  const timestamp = result.at.getTime();
  const skel = { timestamp } as const;

  if (result.status === "rejected") {
    const reason = result.reason;
    return {
      ...skel,
      tag: "error",
      reason: {
        name: reason.name,
        message: reason.message,
      },
    };
  }

  const { value } = result;
  return typeof value === "boolean"
    ? { ...skel, tag: "ignore" }
    : { ...skel, tag: "ok", value };
}
