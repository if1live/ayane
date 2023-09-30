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
import { providerInputs } from "./settings.js";
import { redis } from "./instances.js";

const execute_mysql = async (input: MysqlInput) => {
  const { label } = input;
  const result = await touchMysqlSettled(input);
  await saveResult(redis, label, result);
  return { label, result };
};

const execute_postgres = async (input: PostgresInput) => {
  const { label } = input;
  const result = await touchPostgresSettled(input);
  await saveResult(redis, label, result);
  return { label, result };
};

const execute_redisNative = async (input: RedisNativeInput) => {
  const { label } = input;
  const result = await touchRedisNativeSettled(input);
  await saveResult(redis, label, result);
  return { label, result };
};

const execute_upstashRedis = async (input: UpstashRedisInput) => {
  const { label } = input;
  const result = await touchUpstashRedisSettled(input);
  await saveResult(redis, label, result);
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
  return entries;
};
