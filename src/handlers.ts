import * as dotenv from "@tinyhttp/dotenv";
dotenv.config({ path: ".env.localhost" });

import type { ScheduledHandler } from "aws-lambda";
import {
  touchMysqlSettled,
  touchPostgresSettled,
  touchRedisSettled,
} from "./providers.js";

const execute_planetscale = async () => {
  const endpoint = process.env.MYSQL_DATABASE_URL;
  const label = "planetscale";
  const result = await touchMysqlSettled(endpoint);
  return { label, result };
};

const execute_supabase = async () => {
  const endpoint = process.env.POSTGRES_DATABASE_URL;
  const label = "supabase";
  const result = await touchPostgresSettled(endpoint);
  return { label, result };
};

const execute_redislab = async () => {
  const endpoint = process.env.REDIS_URL;
  const label = "redislab";
  const result = await touchRedisSettled(endpoint);
  return { label, result };
};

export const touch: ScheduledHandler = async (event, context) => {
  console.log("event", JSON.stringify(event, null, 2));

  const entries = await Promise.all([
    execute_planetscale(),
    execute_supabase(),
    execute_redislab(),
  ]);

  for (const entry of entries) {
    const { label, result } = entry;
    if (result.status === "fulfilled") {
      continue;
    }

    const reason = result.reason;
    console.log(label, reason);
  }

  // TODO: 처리 결과를 외부로 보여줄 필요가 있나? 리포트는 어디로 올리지?
};
