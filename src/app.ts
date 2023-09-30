import { Hono } from "hono";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { engine, redis } from "./instances.js";
import { touch } from "./services.js";
import { deleteResult, loadSortedResults } from "./stores.js";

export const app = new Hono();

app.use("*", compress());

app.get("*", async (c) => {
  const results = await loadSortedResults(redis);
  const entries = results.map((x) => {
    return {
      ...x,
      at: new Date(x.health.timestamp),
    };
  });

  const text = await engine.renderFile("ayane_index", {
    entries,
  });
  return c.html(text);
});

app.post("/touch", async (c) => {
  const results = await touch();
  const text = JSON.stringify(results, null, 2);
  return c.text(text);
});

app.delete("/delete", async (c) => {
  await deleteResult(redis);
  return c.json({ ok: true });
});

app.get(`*`, async (c) => {
  throw new HTTPException(404, { message: `not found` });
});
