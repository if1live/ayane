import * as dotenv from "@tinyhttp/dotenv";
dotenv.config({ path: ".env.localhost" });

import type { ScheduledHandler } from "aws-lambda";
import { default as Redis } from "ioredis";
import { default as pg } from "pg";
import * as mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";

const MYSQL_DATABASE_URL = process.env.MYSQL_DATABASE_URL;
const POSTGRES_DATABASE_URL = process.env.POSTGRES_DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;

export const touch: ScheduledHandler = async (event, context, cb) => {
  console.log(JSON.stringify(event, null, 2));

  await Promise.allSettled([
    touch_mysql(event, context, cb),
    touch_postgres(event, context, cb),
    touch_redis(event, context, cb),
  ]);
};

const touch_mysql: ScheduledHandler = async (event, _context) => {
  if (!MYSQL_DATABASE_URL) {
    console.log("MYSQL_DATABASE_URL is not defined");
    return;
  }

  const connection = await mysql.createConnection(MYSQL_DATABASE_URL!);

  const sql = "SELECT VERSION() AS version, NOW() AS now";
  const result = await connection.execute(sql);
  const rows = result[0] as RowDataPacket[];
  const { version, now } = rows[0];
  await connection.end();

  const summary = {
    tag: "mysql",
    version,
    now,
  };
  console.log(summary);
};

const touch_postgres: ScheduledHandler = async (event, _context) => {
  if (!POSTGRES_DATABASE_URL) {
    console.log("POSTGRES_DATABASE_URL is not defined");
    return;
  }

  const client = new pg.Client({
    connectionString: POSTGRES_DATABASE_URL,
  });

  await client.connect();
  const result = await client.query(
    "SELECT VERSION() AS version, NOW() AS now"
  );
  const { version, now } = result.rows[0];
  await client.end();

  const summary = {
    tag: "postgres",
    version,
    now,
  };
  console.log(summary);
};

const touch_redis: ScheduledHandler = async (event, _context) => {
  if (!REDIS_URL) {
    console.log("REDIS_URL is not defined");
    return;
  }

  const url = new URL(REDIS_URL);
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

  const summary = {
    tag: "redis",
    result: pong,
    now,
  };
  console.log(summary);
};
