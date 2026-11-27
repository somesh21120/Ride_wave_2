// Run with: npm test   (uses Node's built-in test runner, no extra packages)
const test = require("node:test");
const assert = require("node:assert");
const { canTransition, assertTransition, isActive, isFinal } = require("../utils/rideStateMachine");

test("normal ride lifecycle is allowed", () => {
  assert.ok(canTransition("requested", "accepted"));
  assert.ok(canTransition("accepted", "ongoing"));
  assert.ok(canTransition("ongoing", "completed"));
});

test("cancel is allowed only before the ride starts", () => {
  assert.ok(canTransition("requested", "cancelled"));
  assert.ok(canTransition("accepted", "cancelled"));
  assert.ok(!canTransition("ongoing", "cancelled"));
});

test("skipping steps or leaving a final state is blocked", () => {
  assert.ok(!canTransition("requested", "completed"));
  assert.ok(!canTransition("accepted", "completed"));
  assert.ok(!canTransition("completed", "requested"));
  assert.ok(!canTransition("cancelled", "accepted"));
  assert.throws(() => assertTransition("completed", "ongoing"), /cannot go/);
});

test("status helpers", () => {
  assert.ok(isActive("accepted") && isActive("ongoing") && !isActive("requested"));
  assert.ok(isFinal("completed") && isFinal("cancelled") && !isFinal("ongoing"));
});
