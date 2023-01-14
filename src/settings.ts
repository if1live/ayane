import * as dotenv from "@tinyhttp/dotenv";
dotenv.config({ path: ".env.development" });

export const MYSQL_DATABASE_URL = process.env.MYSQL_DATABASE_URL;
export const POSTGRES_DATABASE_URL = process.env.POSTGRES_DATABASE_URL;
export const REDIS_URL = process.env.REDIS_URL;

export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
export const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
