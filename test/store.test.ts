import { expect } from "expect";
import assert from "assert";
import type { Redis } from "ioredis";
import { default as RedisMock } from "ioredis-mock";
import { saveResult, loadResults } from "../src/store.js";

function createRedisMock(): Redis {
  const redis = new (RedisMock as any)();
  return redis as Redis;
}

describe("store", () => {
  const redis = createRedisMock();

  it("loadResults: empty", async () => {
    const results = await loadResults(redis);
    expect(results).toHaveLength(0);
  });

  it("scenario: ignore", async () => {
    await saveResult(redis, "not-supported-service", {
      status: "fulfilled",
      value: false,
    });

    const results = await loadResults(redis);
    expect(results).toHaveLength(0);
  });

  it("scenario: ok", async () => {
    const label = "foo";
    const value = { hello: "world" };

    await saveResult(redis, label, {
      status: "fulfilled",
      value,
    });

    const results = await loadResults(redis);
    expect(results).toHaveLength(1);

    const [result] = results;
    expect(result.label).toBe(label);

    const health = result.health;
    if (health.tag !== "ok") {
      assert.fail();
    }
    expect(health.value).toEqual(value);
  });
});
