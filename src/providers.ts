import { default as Redis } from "ioredis";
import { default as pg } from "pg";
import * as mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";
import { TouchSettledResult } from "./types.js";

/*
설계 정책
- connection은 제한된 자원이라서 touch 이후에 연결 해제
- 외부 자원 연결은 실패할수 있고 이를 명시적으로 처리하고 싶다
*/

export const wrapSettled = async <T>(
  execute: () => Promise<T>
): Promise<TouchSettledResult<T>> => {
  try {
    const value = await execute();
    return { status: "fulfilled", value };
  } catch (e: any) {
    return { status: "rejected", reason: e as Error };
  }
};

export const touchRedisSettled = async (
  endpoint: string | undefined
): Promise<TouchSettledResult<object | boolean>> => {
  if (!endpoint) {
    return { status: "fulfilled", value: false };
  }

  const execute = async () => await touchRedisNaive(endpoint);
  return await wrapSettled(execute);
};

export const touchMysqlSettled = async (
  endpoint: string | undefined
): Promise<TouchSettledResult<object | boolean>> => {
  if (!endpoint) {
    return { status: "fulfilled", value: false };
  }

  const execute = async () => await touchMysqlNaive(endpoint);
  return await wrapSettled(execute);
};

export const touchPostgresSettled = async (
  endpoint: string | undefined
): Promise<TouchSettledResult<object | boolean>> => {
  if (!endpoint) {
    return { status: "fulfilled", value: false };
  }

  const execute = async () => await touchPostgresNaive(endpoint);
  return await wrapSettled(execute);
};

const touchRedisNaive = async (endpoint: string): Promise<object> => {
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

const touchMysqlNaive = async (endpoint: string): Promise<object> => {
  const connection = await mysql.createConnection(endpoint);

  const sql = "SELECT VERSION() AS version";
  const result = await connection.execute(sql);
  const rows = result[0] as RowDataPacket[];
  const row = rows[0];
  await connection.end();

  const data = row as object;
  const now = new Date();
  return { ...data, now };
};

const touchPostgresNaive = async (endpoint: string): Promise<object> => {
  const client = new pg.Client({
    connectionString: endpoint,
  });

  await client.connect();
  const result = await client.query(
    "SELECT VERSION() AS version, NOW() AS now"
  );
  const row = result.rows[0];
  await client.end();

  const data = row as object;
  return data;
};
