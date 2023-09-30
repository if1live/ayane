import { describe, it, assert } from "vitest";
import type { Redis } from "ioredis";
import { default as RedisMock } from "ioredis-mock";
import { loadResults, saveResult } from "../src/stores.js";

function createRedisMock(): Redis {
  const redis = new (RedisMock as any)();
  return redis as Redis;
}

describe("store", () => {
  const redis = createRedisMock();

  it("loadResults: empty", async () => {
    const results = await loadResults(redis);
    assert.equal(results.length, 0);
  });

  it("scenario: ignore", async () => {
    await saveResult(redis, "not-supported-service", {
      status: "fulfilled",
      value: false,
      at: new Date(),
    });

    const results = await loadResults(redis);
    assert.equal(results.length, 0);
  });

  it("scenario: ok", async () => {
    const label = "foo";
    const value = { hello: "world" };

    await saveResult(redis, label, {
      status: "fulfilled",
      value,
      at: new Date(),
    });

    const results = await loadResults(redis);
    assert.equal(results.length, 1);

    const [result] = results;
    assert.equal(result?.label, label);

    const health = result?.health;
    if (health?.tag !== "ok") {
      assert.fail();
    }
    assert.deepEqual(health.value, value);
  });
});
