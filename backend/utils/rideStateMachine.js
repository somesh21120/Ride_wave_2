/**
 * Ride lifecycle rules in one place.
 *
 *   requested --accept--> accepted --start--> ongoing --complete--> completed
 *       |                    |
 *       +------cancel--------+--------------------------> cancelled
 *
 * Any code that changes ride.status should call assertTransition first.
 * Admin overrides bypass this on purpose (see adminController.updateRideStatus).
 */
const STATUSES = ["requested", "accepted", "ongoing", "completed", "cancelled"];

const TRANSITIONS = {
  requested: ["accepted", "cancelled"],
  accepted: ["ongoing", "cancelled"],
  ongoing: ["completed"],
  completed: [],
  cancelled: [],
};

const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

const assertTransition = (from, to) => {
  if (!canTransition(from, to)) {
    const err = new Error(`Ride cannot go from "${from}" to "${to}"`);
    err.status = 400;
    throw err;
  }
};

const isActive = (status) => status === "accepted" || status === "ongoing";
const isFinal = (status) => status === "completed" || status === "cancelled";

module.exports = { STATUSES, TRANSITIONS, canTransition, assertTransition, isActive, isFinal };
