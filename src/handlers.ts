import * as dotenv from "@tinyhttp/dotenv";
dotenv.config({ path: ".env.localhost" });

import type { ScheduledHandler } from "aws-lambda";
import { default as Redis } from "ioredis";
import { default as pg } from "pg";
import * as mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";

const touch_planetscale = async () => {
  const endpoint = process.env.MYSQL_DATABASE_URL;
  const label = "planetscale";

  const execute = async () => {
    if (!endpoint) {
      console.log(label, "mysql endpoint is not defined");
      return null;
    }

    const result = await touch_mysql(endpoint);
    console.log(label, result);
    return result;
  };

  return await wrapTouch(label, execute);
};

const touch_supabase = async () => {
  const endpoint = process.env.POSTGRES_DATABASE_URL;
  const label = "supabase";

  const execute = async () => {
    if (!endpoint) {
      console.log(label, "posgres endpoint is not defined");
      return null;
    }

    const result = await touch_postgres(endpoint);
    console.log(label, result);
    return result;
  };

  return await wrapTouch(label, execute);
};

const touch_redislab = async () => {
  const endpoint = process.env.REDIS_URL;
  const label = "redislab";

  const execute = async () => {
    if (!endpoint) {
      console.log(label, "redis endpoint is not defined");
      return null;
    }

    const result = await touch_redis(endpoint);
    console.log(label, result);
    return result;
  };

  return await wrapTouch(label, execute);
};

const wrapTouch = async (label: string, fn: () => Promise<unknown>) => {
  try {
    const value = await fn();
    return { label, value };
  } catch (e: any) {
    e.label = label;
    throw e;
  }
};

export const touch: ScheduledHandler = async (event, context) => {
  console.log("event", JSON.stringify(event, null, 2));

  const results = await Promise.allSettled([
    touch_planetscale(),
    touch_supabase(),
    touch_redislab(),
  ]);

  for (const result of results) {
    if (result.status == "fulfilled") {
      continue;
    }

    const reason = result.reason;
    console.log(JSON.stringify(reason, null, 2));
    console.log("");
  }

  // TODO: 처리 결과를 외부로 보여줄 필요가 있나? 리포트는 어디로 올리지?
};

const touch_mysql = async (endpoint: string) => {
  const connection = await mysql.createConnection(endpoint);

  const sql = "SELECT VERSION() AS version";
  const result = await connection.execute(sql);
  const rows = result[0] as RowDataPacket[];
  const row = rows[0];
  await connection.end();

  const data = row as unknown;
  const now = new Date();
  return { ...(data as object), now };
};

const touch_postgres = async (endpoint: string) => {
  const client = new pg.Client({
    connectionString: endpoint,
  });

  await client.connect();
  const result = await client.query(
    "SELECT VERSION() AS version, NOW() AS now"
  );
  const row = result.rows[0];
  await client.end();

  const data = row as unknown;
  return data;
};

const touch_redis = async (endpoint: string) => {
  const url = new URL(endpoint);
  const options: Redis.RedisOptions = {
    host: url.hostname,
    port: parseInt(url.port, 10),
    password: url.password,
    // https://github.com/luin/ioredis/issues/1123#issuecomment-920905876
    enableAutoPipelining: true,
    enableOfflineQueue: false,
    lazyConnect: true,
  };
  // 컴파일은 되는데 타입이 망가진거같다? 그래서 생성자 캐스팅
  const redis: Redis.Redis = new (Redis as any)(options);
  await redis.connect();

  const pong = await redis.ping();
  const now = new Date();

  redis.disconnect(false);

  const data = { pong, now };
  return data;
};
