import dotenv from "dotenv";
import path from "node:path";
import url from "node:url";
import { ProviderInput } from "./types.js";

const env = process.env.NODE_ENV || "development";
const envpath = path.resolve(process.cwd(), `.env.${env}`);
dotenv.config({ path: envpath });

export const NODE_ENV = process.env.NODE_ENV || "production";
export const STAGE = process.env.STAGE || "dev";

// 데이터 저장을 꼭 해야되나? 로그니까 디스코드에 남겨도 될거같은데
export const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
const filename = url.fileURLToPath(import.meta.url);
const dirname = url.fileURLToPath(new URL(".", import.meta.url));
export const rootPath = path.join(dirname, "..");
export const viewPath = path.join(rootPath, "views");

// TODO: label, type, args로 알아서 대응하기. env 뜯으면 얻을 수 있다.
const ayane_planetscale_label = process.env.AYANE_PLANETSCALE_LABEL!;
const ayane_planetscale_type = process.env.AYANE_PLANETSCALE_TYPE!;
const ayane_planetscale_arg_1 = process.env.AYANE_PLANETSCALE_ARG_1!;

const input_planetscale: ProviderInput = {
  tag: "mysql",
  label: ayane_planetscale_label,
  endpoint: ayane_planetscale_arg_1,
};

const ayane_supabase_label = process.env.AYANE_SUPABASE_LABEL!;
const ayane_supabase_type = process.env.AYANE_SUPABASE_TYPE!;
const ayane_supabase_arg_1 = process.env.AYANE_SUPABASE_ARG_1!;

const input_supabase: ProviderInput = {
  tag: "postgres",
  label: ayane_supabase_label,
  endpoint: ayane_supabase_arg_1,
};

const ayane_redislab_label = process.env.AYANE_REDISLAB_LABEL!;
const ayane_redislab_type = process.env.AYANE_REDISLAB_TYPE!;
const ayane_redislab_arg_1 = process.env.AYANE_REDISLAB_ARG_1!;

const input_redislab: ProviderInput = {
  tag: "redis_native",
  label: ayane_redislab_label,
  endpoint: ayane_redislab_arg_1,
};

const ayane_upstash_redis_label = process.env.AYANE_UPSTASH_REDIS_LABEL!;
const ayane_upstash_redis_type = process.env.AYANE_UPSTASH_REDIS_TYPE!;
const ayane_upstash_redis_arg_1 = process.env.AYANE_UPSTASH_REDIS_ARG_1!;
const ayane_upstash_redis_arg_2 = process.env.AYANE_UPSTASH_REDIS_ARG_2!;

const input_upstashRedis: ProviderInput = {
  tag: "upstash_redis",
  label: ayane_upstash_redis_label,
  url: ayane_upstash_redis_arg_1,
  token: ayane_upstash_redis_arg_2,
};

export const providerInputs: ProviderInput[] = [
  input_planetscale,
  input_supabase,
  input_redislab,
  input_upstashRedis,
];
