import { ErrorHandler, Hono } from "hono";
import * as Sentry from "@sentry/node";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { engine, dynamodb } from "./instances.js";
import { touch } from "./services.js";
import { deleteResult, loadSortedResults } from "./stores.js";

const robotsTxt = `
User-agent: *
Disallow: /
`.trimStart();

export const app = new Hono();

app.onError(async (err, c) => {
  const extractStatusCode = (err: any) => err.status ?? err.statusCode ?? 500;
  const status = extractStatusCode(err);

  // 관심있는 에러만 센트리로 취급
  if (status >= 500) {
    Sentry.captureException(err);
    await Sentry.flush(3000);
  }

  interface ErrorModel {
    name: string;
    message: string;
  }

  const fn_HTTPException = async (err: HTTPException): Promise<ErrorModel> => {
    const res = err.getResponse();
    return {
      name: err.name,
      message: await res.text(),
    };
  };

  const fn_plain = (err: Error): ErrorModel => {
    return {
      name: err.name,
      message: err.message,
    };
  };

  const extractErrorModel = async (err: Error): Promise<ErrorModel> => {
    let model = fn_plain(err);
    if (err instanceof HTTPException) {
      model = await fn_HTTPException(err);
    }

    return model;
  };

  const onError_html: ErrorHandler = async (err, c) => {
    const model = await extractErrorModel(err);

    const text = await engine.renderFile("error", {
      error: {
        ...model,
        stack: err.stack ?? "",
      },
      error_naive: err,
    });
    return c.html(text, status);
  };

  return onError_html(err, c);
});

app.use("*", compress());

app.use("*", async (_, next) => {
  await next();
  await Sentry.flush(3000);
});

app.get("/", async (c) => {
  const results = await loadSortedResults(dynamodb);
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

app.get("/robots.txt", async (c) => c.text(robotsTxt));

app.post("/touch", async (c) => {
  const results = await touch();
  const text = JSON.stringify(results, null, 2);
  return c.text(text);
});

app.delete("/delete", async (c) => {
  await deleteResult(dynamodb);
  return c.json({ ok: true });
});

app.get("/sentry/message", async (c) => {
  Sentry.captureMessage("hello world");
  return c.json({ ok: true });
});

app.get("/sentry/error/handled", async (c) => {
  try {
    const e = new Error("handled error");
    (e as any).foo = "bar";
    throw e;
  } catch (e: unknown) {
    Sentry.captureException(e);
  }
  return c.json({ ok: true });
});

app.get("/sentry/error/unhandled", async (c) => {
  throw new Error("unhandled error");
});

app.get("/error/plain", async (c) => {
  const e = new Error("plain-error-message");
  e.name = "PlainError";
  (e as any).status = 401;
  throw e;
});

app.get("/error/http", async (c) => {
  throw new HTTPException(403, { message: "hono-http-exception" });
});

app.get("*", async (c) => {
  throw new HTTPException(404, { message: `not found` });
});
