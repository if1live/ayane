export interface TouchFulfilledResult<T> {
  status: "fulfilled";
  value: T;
  at: Date;
}

export interface TouchRejectedResult {
  status: "rejected";
  reason: Error;
  at: Date;
}

export type TouchSettledResult<T> =
  | TouchFulfilledResult<T>
  | TouchRejectedResult;

export interface ServiceHealth_Ok {
  tag: "ok";
  timestamp: number;
  value: object;
}

export interface ServiceHealth_Ignore {
  tag: "ignore";
  timestamp: number;
}

export interface ServiceHealth_Error {
  tag: "error";
  timestamp: number;
  reason: {
    name: string;
    message: string;
  };
}

// redis로 저장되는 규격
export type ServiceHealth =
  | ServiceHealth_Ok
  | ServiceHealth_Ignore
  | ServiceHealth_Error;

export type RedisNativeInput = {
  tag: "redis_native";
  label: string;
  endpoint: string;
};

export type UpstashRedisInput = {
  tag: "upstash_redis";
  url: string;
  label: string;
  token: string;
};

export type MysqlInput = {
  tag: "mysql";
  label: string;
  endpoint: string;
};

export type PostgresInput = {
  tag: "postgres";
  label: string;
  endpoint: string;
};

export type ProviderInput =
  | RedisNativeInput
  | UpstashRedisInput
  | MysqlInput
  | PostgresInput;
