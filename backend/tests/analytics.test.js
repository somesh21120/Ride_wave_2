const test = require("node:test");
const assert = require("node:assert");
const { fillDays } = require("../utils/analytics");

test("fillDays returns all days with zero values for empty input", () => {
  const result = fillDays([], 7, new Date("2026-11-24"));
  assert.strictEqual(result.length, 7);
  assert.strictEqual(result[0].rides, 0);
  assert.strictEqual(result[6].date, "2026-11-24");
});

test("fillDays preserves existing data and fills gaps", () => {
  const rows = [{ date: "2026-11-20", rides: 5, completed: 3, pooled: 1, revenue: 600 }];
  const result = fillDays(rows, 5, new Date("2026-11-24"));
  assert.strictEqual(result.length, 5);
  assert.strictEqual(result.find(r => r.date === "2026-11-20").rides, 5);
  assert.strictEqual(result.find(r => r.date === "2026-11-21").rides, 0);
});

test("fillDays uses IST for date boundaries", () => {
  // 20:00 UTC on 24 Nov = 01:30 IST on 25 Nov
  const result = fillDays([], 3, new Date("2026-11-24T20:00:00Z"));
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[2].date, "2026-11-25");
});