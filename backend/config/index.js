/**
 * Central configuration. Every environment variable the backend reads is listed here,
 * so a new deployment only needs this file and .env.example to know what to set.
 */
const pkg = require("../package.json");

const splitList = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

const config = {
  version: pkg.version,
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  // Comma-separated list of allowed frontend origins, e.g.
  // CLIENT_URL=http://localhost:5173,https://ridewave.vercel.app
  // Empty means "allow any origin" (fine for local development only).
  clientOrigins: splitList(process.env.CLIENT_URL),
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },
};

// Pool matcher used by the live app: "proximity" (Sem 7 rule) or "corridor" (Sem 8, v2)
// "smart" = corridor + AI ranking with the trained pairing model (falls back to corridor if no model)
const PM = (process.env.POOL_MATCHER || "proximity").toLowerCase();
config.poolMatcher = ["corridor", "smart"].includes(PM) ? PM : "proximity";

// In development, http://localhost:5173 and http://127.0.0.1:5173 are the same app; allow both
// spellings so Socket.IO is not blocked when the browser uses the other one.
if (config.env !== "production") {
  const mirror = (o) => o.replace("://localhost", "://127.0.0.1") === o ? o.replace("://127.0.0.1", "://localhost") : o.replace("://localhost", "://127.0.0.1");
  config.clientOrigins = [...new Set(config.clientOrigins.flatMap((o) => [o, mirror(o)]))];
}
config.corsOrigin = config.clientOrigins.length ? config.clientOrigins : "*";

const REQUIRED = ["JWT_SECRET"]; // MONGO_URI empty or "local" = built-in local database
config.missingRequired = () => REQUIRED.filter((k) => !process.env[k]);

module.exports = config;
