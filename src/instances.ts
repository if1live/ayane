import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Liquid } from "liquidjs";
import * as settings from "./settings.js";

export const engine = new Liquid({
  root: settings.viewPath,
  extname: ".liquid",
  cache: settings.NODE_ENV === "production",
});

const createDynamoDB_localhost = () => {
  return new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "ap-northeast-1",
    credentials: {
      accessKeyId: "local",
      secretAccessKey: "local",
    },
  });
};

const createDynamoDB_prod = () => {
  return new DynamoDBClient({});
};

const createDynamoDB = () => {
  return settings.NODE_ENV === "production"
    ? createDynamoDB_prod()
    : createDynamoDB_localhost();
};

export const dynamodb = createDynamoDB();
