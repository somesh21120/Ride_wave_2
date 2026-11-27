const test = require("node:test");
const assert = require("node:assert");
const { newToken, isExpired } = require("../utils/shareToken");

test("newToken returns 24 hex characters", () => {
  const t = newToken();
  assert.strictEqual(t.length, 24);
  assert.ok(/^[0-9a-f]{24}$/.test(t));
});

test("newToken produces different values", () => {
  assert.notStrictEqual(newToken(), newToken());
});

test("isExpired returns true when no token", () => {
  assert.ok(isExpired({ status: "accepted" }));
});

test("isExpired returns true when past expiry", () => {
  const ride = { shareToken: "abc", shareExpiresAt: new Date("2020-01-01"), status: "accepted" };
  assert.ok(isExpired(ride, new Date("2026-01-01")));
});

test("isExpired returns true when cancelled", () => {
  const ride = { shareToken: "abc", shareExpiresAt: new Date("2030-01-01"), status: "cancelled" };
  assert.ok(isExpired(ride, new Date("2026-01-01")));
});

test("isExpired returns false for valid token", () => {
  const ride = { shareToken: "abc", shareExpiresAt: new Date("2030-01-01"), status: "accepted" };
  assert.ok(!isExpired(ride, new Date("2026-01-01")));
});