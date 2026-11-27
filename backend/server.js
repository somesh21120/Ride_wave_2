const dotenv = require("dotenv");
dotenv.config();
require("./utils/fileLog").startFileLog(); // copy of the console in backend/logs/server.log

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const config = require("./config");
const socketHandler = require("./socket/socketHandler");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { connectWithRetry, requireDb } = require("./config/db");

// Startup sanity: verify required env vars are present
for (const key of config.missingRequired()) console.warn(`[Config] Missing env var: ${key} (check .env)`);
if (config.razorpay.keyId && config.razorpay.keySecret) {
  console.log(`[Config] Razorpay keys loaded (ID: ${config.razorpay.keyId.slice(0, 12)}...)`);
} else {
  console.warn("[Config] Razorpay keys not set, online payments will fail");
}

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: config.corsOrigin, methods: ["GET", "POST", "PUT", "DELETE"] },
});

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/", (req, res) => res.send("RideWave API is running"));

// Health check: used by the hosting platform and by the demo checklist
app.get("/api/health", (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    version: config.version,
    build: process.env.BUILD_ID || "dev",
    poolMatcher: config.poolMatcher,
    aiModel: require("./ml/pairingModel").loadModel() ? "loaded" : "not trained",
    env: config.env,
    db: dbStates[mongoose.connection.readyState] || "unknown",
    uptimeSeconds: Math.round(process.uptime()),
    time: new Date().toISOString(),
  });
});

// Routes that need the database answer 503 with a clear message while it is down
app.use("/api/auth", requireDb, require("./routes/authRoutes"));
app.use("/api/rides", requireDb, require("./routes/rideRoutes"));
app.use("/api/recurring", requireDb, require("./routes/recurringRideRoutes"));
app.use("/api/reviews", requireDb, require("./routes/reviewRoutes"));
app.use("/api/admin", requireDb, require("./routes/adminRoutes"));
app.use("/api/payment", requireDb, require("./routes/paymentRoutes"));
// Pooling Lab removed — corridor matching logs are now available in the admin panel at /admin/match-logs
app.use("/api/public", require("./routes/publicRoutes")); // Public endpoints (trip share, no auth)

app.use("/api", notFound);
app.use(errorHandler);

socketHandler(io);

// Listen first, so the health check and Pooling Lab answer even if the database is slow or down
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${config.port} is already in use. Close the other RideWave Backend window.`);
  } else {
    console.error("Server error:", err.message);
  }
  process.exit(1);
});
server.listen(config.port, () => {
  console.log(`RideWave API v${config.version} running on port ${config.port} (database connecting...)`);
});

connectWithRetry(config.mongoUri, async () => {
  try {
    await require("./config/seedDemo").seedDemoIfEmpty(require("./models/User"));
  } catch (err) {
    console.error("[db] Demo account seeding failed:", err.message);
  }
  require("./services/recurringScheduler").startScheduler();
  require("./services/poolMatchService").startPoolMatcher();
});
