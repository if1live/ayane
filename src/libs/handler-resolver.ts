import type { AWS } from "@serverless/typescript";

export const handlerPath = (context: string) => {
  return `${context.split(process.cwd())[1].substring(1).replace(/\\/g, "/")}`;
};

type UnwrapObject<T> = T extends { [k: string]: infer U } ? U : never;
export type FunctionDefinition = UnwrapObject<AWS["functions"]>;
