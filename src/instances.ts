import { Redis } from "ioredis";
import { Liquid } from "liquidjs";
import * as settings from "./settings.js";

export const redis = new Redis(settings.REDIS_URL!, {
  lazyConnect: true,
});
await redis.connect();

export const engine = new Liquid({
  root: settings.viewPath,
  extname: ".liquid",
  cache: settings.NODE_ENV === "production",
});
