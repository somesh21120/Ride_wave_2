/**
 * Analytics helpers for admin dashboard.
 */

/**
 * Format a date as YYYY-MM-DD in Asia/Kolkata timezone.
 */
function istDate(d) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Fill missing days with zero-value entries.
 * Keys are built in Asia/Kolkata timezone to match the aggregation.
 * @param {Array} rows - Array of { date: "YYYY-MM-DD", ... } from aggregation
 * @param {number} days - Number of days to cover
 * @param {Date} today - Reference date (default now)
 * @returns {Array} Complete array with zero-filled gaps
 */
function fillDays(rows, days, today = new Date()) {
  const map = new Map();
  for (const r of rows) map.set(r.date, r);
  const result = [];
  // Get today's IST date string, then build a date at midnight IST
  const todayStr = istDate(today);
  const [y, m, d] = todayStr.split("-").map(Number);
  const todayMidnight = new Date(y, m - 1, d);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(todayMidnight);
    date.setDate(date.getDate() - i);
    const key = istDate(date);
    result.push(map.get(key) || { date: key, rides: 0, completed: 0, pooled: 0, revenue: 0 });
  }
  return result;
}

module.exports = { fillDays };