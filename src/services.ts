import * as R from "remeda";
import { dynamodb } from "./instances.js";
import {
  touchMysqlSettled,
  touchPostgresSettled,
  touchRedisNativeSettled,
  touchUpstashRedisSettled,
} from "./providers.js";
import * as settings from "./settings.js";
import { saveResult } from "./stores.js";
import {
  type MysqlInput,
  type PostgresInput,
  type ProviderInput,
  type RedisNativeInput,
  TouchRejectedResult,
  type UpstashRedisInput,
} from "./types.js";

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
    settings.providerInputs.map(async (input) => execute(input)),
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
    const block_env = [
      "## environment",
      `* NODE_ENV: ${settings.NODE_ENV}`,
      `* STAGE: ${settings.STAGE}`,
    ].join("\n");

    // 성공/실패만 간단하게 보고싶다
    const lines_status = entries.map((entry) => {
      const { label, result } = entry;
      const ok = result.status === "fulfilled" ? "ok" : "error";
      return `* ${label}: ${ok}`;
    });
    const block_status = ["## status", ...lines_status].join("\n");

    // 실패는 상세 로그가 필요하다. 성공 로그는 노이즈에 불과하다.
    const lines_error = entries
      .flatMap((entry) => {
        if (entry.result.status === "fulfilled") {
          return null;
        }

        const { label, result } = entry;
        const line_header = `### ${label}`;
        const text_detail = JSON.stringify(result.reason, null, 2);
        // biome-ignore lint/style/useTemplate: <explanation>
        const line_detail = "```json" + text_detail + "```";
        return [line_header, line_detail];
      })
      .filter(R.isNonNull);

    const block_error =
      lines_error.length > 0 ? ["## error", ...lines_error].join("\n") : "";

    const text = [block_env, block_status, block_error].join("\n\n");
    await sendMessageToDiscord(text);
  }

  return entries;
};

export const sendMessageToDiscord = async (text: string) => {
  const url = settings.DISCORD_WEBHOOK_URL;
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
