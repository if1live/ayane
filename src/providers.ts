import https from "node:https";
import { Redis, RedisOptions } from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import { RowDataPacket } from "mysql2";
import { default as mysql } from "mysql2/promise";
import { default as pg } from "pg";
import {
  MysqlInput,
  PostgresInput,
  RedisNativeInput,
  TouchSettledResult,
  UpstashRedisInput,
} from "./types.js";

/*
설계 정책
- connection은 제한된 자원이라서 touch 이후에 연결 해제
- 외부 자원 연결은 실패할수 있고 이를 명시적으로 처리하고 싶다
*/

export const wrapSettled = async <T>(
  execute: () => Promise<T>,
): Promise<TouchSettledResult<T>> => {
  const at = new Date();
  try {
    const value = await execute();
    return { status: "fulfilled", value, at };
  } catch (e: any) {
    return { status: "rejected", reason: e as Error, at };
  }
};

export const touchRedisNativeSettled = async (
  input: RedisNativeInput | undefined,
): Promise<TouchSettledResult<object | boolean>> => {
  const at = new Date();
  if (!input) {
    return { status: "fulfilled", value: false, at };
  }

  const execute = async () => await touchRedisNaive(input);
  return await wrapSettled(execute);
};

export const touchUpstashRedisSettled = async (
  input: UpstashRedisInput | undefined,
): Promise<TouchSettledResult<object | boolean>> => {
  const at = new Date();
  if (!input) {
    return { status: "fulfilled", value: false, at };
  }

  const execute = async () => await touchUpstashRedis(input);
  return await wrapSettled(execute);
};

export const touchMysqlSettled = async (
  input: MysqlInput | undefined,
): Promise<TouchSettledResult<object | boolean>> => {
  const at = new Date();
  if (!input) {
    return { status: "fulfilled", value: false, at };
  }

  const execute = async () => await touchMysqlNaive(input);
  return await wrapSettled(execute);
};

export const touchPostgresSettled = async (
  input: PostgresInput | undefined,
): Promise<TouchSettledResult<object | boolean>> => {
  const at = new Date();
  if (!input) {
    return { status: "fulfilled", value: false, at };
  }

  const execute = async () => await touchPostgresNaive(input);
  return await wrapSettled(execute);
};

const touchRedisNaive = async (input: RedisNativeInput): Promise<object> => {
  const { endpoint } = input;
  const url = new URL(endpoint);
  const options: RedisOptions = {
    host: url.hostname,
    port: parseInt(url.port, 10),
    password: url.password,
    // https://github.com/luin/ioredis/issues/1123#issuecomment-920905876
    enableAutoPipelining: true,
    enableOfflineQueue: false,
    lazyConnect: true,
  };

  const redis = new Redis(options);
  await redis.connect();

  const tokens = await redis.hello();
  const version = tokens[3];

  redis.disconnect(false);

  return { version };
};

const touchUpstashRedis = async (input: UpstashRedisInput): Promise<object> => {
  // 접속 확인용으로 쓰는건 keep-alive가 사실상 필요없다
  const agent = new https.Agent({ keepAlive: false });
  const redis = new UpstashRedis({
    url: input.url,
    token: input.token,
    responseEncoding: false,
    agent: agent,
  });

  // upstash redis client에는 info, hello 같은게 열려있지 않다.
  const pong = await redis.ping();

  return { pong };
};

const touchMysqlNaive = async (input: MysqlInput): Promise<object> => {
  const { endpoint } = input;
  const connection = await mysql.createConnection(endpoint);

  // https://planetscale.com/docs/concepts/database-sleeping
  // 진짜 db를 읽고 쓰는 쿼리가 아니면 sleep에 planetscale의 sleeping에 걸린다
  // "SELECT VERSION() AS version" 는 sleep에 걸리는 쿼리
  const sql = "SELECT VERSION() AS version";
  const result = await connection.execute(sql);
  const rows = result[0] as RowDataPacket[];
  const row = rows[0];

  // TODO: kysely로 바꾸고 싶은데. 쿼리 생성만 갖다쓰는 방법 있나?
  // vitess는 mysql과 비슷하지만 똑같지 않아서 일부 쿼리가 작동하지 않을 수 있다.
  // 멍청한 방식으로 작성될수록 호환이 잘 될것이다.
  {
    const table = "ayane_kernel";
    const name = "warmup";
    const value = JSON.stringify(row);
    const sql1 = `DELETE FROM ${table} WHERE name='${name}'`;
    const sql2 = `INSERT INTO ${table} (name, value) VALUES ('${name}', '${value}')`;
    await connection.execute(sql1);
    await connection.execute(sql2);
  }

  await connection.end();

  const data = row as object;
  return data;
};

const touchPostgresNaive = async (input: PostgresInput): Promise<object> => {
  const { endpoint } = input;
  const client = new pg.Client({
    connectionString: endpoint,
  });

  await client.connect();
  const result = await client.query(
    "SELECT VERSION() AS version, NOW() AS now",
  );
  const row = result.rows[0];
  await client.end();

  const data = row as object;
  return data;
};
