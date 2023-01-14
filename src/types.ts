export interface TouchFulfilledResult<T> {
  status: "fulfilled";
  value: T;
}

export interface TouchRejectedResult {
  status: "rejected";
  reason: Error;
}

export type TouchSettledResult<T> =
  | TouchFulfilledResult<T>
  | TouchRejectedResult;

export interface ServiceHealth_Ok {
  tag: "ok";
  dateStr: string;
  value: object;
}

export interface ServiceHealth_Ignore {
  tag: "ignore";
}

export interface ServiceHealth_Error {
  tag: "error";
  dateStr: string;
  reason: {
    name: string;
    message: string;
  };
}

export type ServiceHealth =
  | ServiceHealth_Ok
  | ServiceHealth_Ignore
  | ServiceHealth_Error;
