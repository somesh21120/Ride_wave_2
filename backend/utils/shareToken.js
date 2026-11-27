const crypto = require("crypto");

function newToken() {
  return crypto.randomBytes(12).toString("hex"); // 24 hex chars
}

function isExpired(ride, now = new Date()) {
  if (!ride.shareToken) return true;
  if (ride.shareExpiresAt && now > ride.shareExpiresAt) return true;
  if (ride.status === "cancelled") return true;
  return false;
}

module.exports = { newToken, isExpired };