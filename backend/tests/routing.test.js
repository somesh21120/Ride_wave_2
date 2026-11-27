const test = require("node:test");
const assert = require("node:assert");
const { cacheKey } = require("../services/routing");

test("cacheKey rounds to 5 decimals and joins with semicolons", () => {
  const pts = [{ lat: 22.30394, lng: 70.80221 }, { lat: 22.30001, lng: 70.80000 }];
  const key = cacheKey(pts);
  assert.ok(key.includes("22.30394,70.80221"));
  assert.ok(key.includes("22.30001,70.80000"));
  assert.ok(key.includes(";"));
});

test("cacheKey order matters", () => {
  const a = [{ lat: 22.3, lng: 70.8 }, { lat: 22.4, lng: 70.9 }];
  const b = [{ lat: 22.4, lng: 70.9 }, { lat: 22.3, lng: 70.8 }];
  assert.notStrictEqual(cacheKey(a), cacheKey(b));
});