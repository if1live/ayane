import dotenv from "dotenv";
import assert from "node:assert";
import path from "node:path";
import url from "node:url";
import { ProviderInput } from "./types.js";

const env = process.env.NODE_ENV || "development";
const envpath = path.resolve(process.cwd(), `.env.${env}`);
dotenv.config({ path: envpath });

export const NODE_ENV = process.env.NODE_ENV || "production";
export const STAGE = process.env.STAGE || "dev";

export const SENTRY_DSN = process.env.SENTRY_DSN;

// 데이터 저장을 꼭 해야되나? 로그니까 디스코드에 남겨도 될거같은데
export const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
const filename = url.fileURLToPath(import.meta.url);
const dirname = url.fileURLToPath(new URL(".", import.meta.url));
export const rootPath = path.join(dirname, "..");
export const viewPath = path.join(rootPath, "views");

const parse = (
  env: Record<string, string | undefined>,
  prefix: string,
): ProviderInput => {
  const label = env[`${prefix}_LABEL`];
  const type = env[`${prefix}_TYPE`];
  const arg_1 = env[`${prefix}_ARG_1`];
  const arg_2 = env[`${prefix}_ARG_2`];
  const arg_3 = env[`${prefix}_ARG_3`];

  assert(label, "label is empty");

  switch (type) {
    case "mysql": {
      assert(arg_1, "endpoint is empty");
      return {
        tag: type,
        label,
        endpoint: arg_1,
      };
    }
    case "postgres": {
      assert(arg_1, "endpoint is empty");
      return {
        tag: type,
        label,
        endpoint: arg_1,
      };
    }
    case "redis_native": {
      assert(arg_1, "endpoint is empty");
      return {
        tag: type,
        label,
        endpoint: arg_1,
      };
    }
    case "upstash_redis": {
      assert(arg_1, "url is empty");
      assert(arg_2, "token is empty");
      return {
        tag: type,
        label,
        url: arg_1,
        token: arg_2,
      };
    }
    default:
      throw new Error(`Unknown type: ${type}`);
  }
};

// TODO: label, type, args로 알아서 대응하기. env 뜯으면 얻을 수 있다.
export const providerInputs: ProviderInput[] = [
  parse(process.env, "AYANE_PLANETSCALE"),
  parse(process.env, "AYANE_SUPABASE"),
  parse(process.env, "AYANE_REDISLAB"),
  parse(process.env, "AYANE_UPSTASH_REDIS"),
];
