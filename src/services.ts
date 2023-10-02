import { saveResult } from "./stores.js";
import {
  touchMysqlSettled,
  touchPostgresSettled,
  touchRedisNativeSettled,
  touchUpstashRedisSettled,
} from "./providers.js";
import {
  MysqlInput,
  PostgresInput,
  ProviderInput,
  RedisNativeInput,
  UpstashRedisInput,
} from "./types.js";
import { providerInputs, DISCORD_WEBHOOK_URL } from "./settings.js";
import { dynamodb } from "./instances.js";

const execute_mysql = async (input: MysqlInput) => {
  const { label } = input;
  const result = await touchMysqlSettled(input);
  await saveResult(dynamodb, label, result);
  return { label, result };
};

const execute_postgres = async (input: PostgresInput) => {
  const { label } = input;
  const result = await touchPostgresSettled(input);
  await saveResult(dynamodb, label, result);
  return { label, result };
};

const execute_redisNative = async (input: RedisNativeInput) => {
  const { label } = input;
  const result = await touchRedisNativeSettled(input);
  await saveResult(dynamodb, label, result);
  return { label, result };
};

const execute_upstashRedis = async (input: UpstashRedisInput) => {
  const { label } = input;
  const result = await touchUpstashRedisSettled(input);
  await saveResult(dynamodb, label, result);
  return { label, result };
};

const execute = async (input: ProviderInput) => {
  switch (input.tag) {
    case "mysql":
      return await execute_mysql(input);
    case "postgres":
      return await execute_postgres(input);
    case "redis_native":
      return await execute_redisNative(input);
    case "upstash_redis":
      return await execute_upstashRedis(input);
  }
};

export const touch = async () => {
  const entries = await Promise.all(
    providerInputs.map(async (input) => execute(input)),
  );

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

  // discord 기록은 실패할지 모르니까 마지막에 배치
  {
    const blocks = entries.map((entry) => {
      const { label, result } = entry;
      const ok = result.status === "fulfilled" ? "ok" : "error";
      const line_header = `## ${label}: ${ok}`;
      const line_detail =
        result.status === "fulfilled"
          ? "```" + JSON.stringify(result.value, null, 2) + "```"
          : "```" + JSON.stringify(result.reason, null, 2) + "```";

      const block = [line_header, line_detail].join("\n");
      return block;
    });
    const text = blocks.join("\n\n");
    await sendMessageToDiscord(text);
  }

  return entries;
};

export const sendMessageToDiscord = async (text: string) => {
  const url = DISCORD_WEBHOOK_URL;
  if (!url) {
    return { ok: false, reason: "no webhook url" };
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: text }),
  });
  return { ok: true };
};
