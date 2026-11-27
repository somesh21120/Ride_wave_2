/**
 * MongoDB connection with retry and plain-language diagnosis.
 *
 * The API starts listening before the database connects, so the health endpoint
 * and the Pooling Lab work even when the database is unreachable, and the reason
 * is printed clearly instead of the server silently exiting.
 */
const dns = require("dns");
const mongoose = require("mongoose");
const { resolveMongoUri, isLocalMode } = require("./localMongo");

const RETRY_MS = Number(process.env.DB_RETRY_MS) || 10000;

function explain(err, uri) {
  const msg = String((err && err.message) || err);
  if (isLocalMode(uri)) {
    if (/package missing/i.test(msg)) return "Run RIDEWAVE_TOOLS.bat option 8 (Reinstall packages).";
    if (/download|fetch|ENOTFOUND|EAI_AGAIN|ECONNRESET/i.test(msg)) return "The first run must download MongoDB (about 70 MB). Connect to the internet and it will retry by itself.";
    return "The built-in local database could not start. Close other RideWave windows (RIDEWAVE_TOOLS option 2) and start again. If it keeps failing, rename backend\\.localdb to start with an empty database.";
  }
  const isAtlas = /^mongodb\+srv:/i.test(uri || "");
  if (/querySrv|ENOTFOUND|ECONNREFUSED.*_mongodb|EREFUSED|ETIMEOUT/i.test(msg) && isAtlas) {
    return "DNS lookup for the Atlas cluster failed. This network (or the Windows DNS setting) blocks SRV lookups. The server now retries using public DNS (8.8.8.8 / 1.1.1.1). If it still fails, try a phone hotspot or set your adapter DNS to 8.8.8.8.";
  }
  if (/whitelist|not authorized to access|Could not connect to any servers|ReplicaSetNoPrimary|Server selection timed out/i.test(msg) && isAtlas) {
    return "Atlas did not answer. Usual causes: (1) this computer's IP is not in Atlas > Network Access (add your current IP, or 0.0.0.0/0 for the demo), (2) the free cluster is paused (open cloud.mongodb.com and click Resume), (3) the network blocks port 27017 (try a phone hotspot).";
  }
  if (/bad auth|Authentication failed/i.test(msg)) {
    return "Wrong database username or password in MONGO_URI (backend\\.env). Check Atlas > Database Access.";
  }
  if (/ECONNREFUSED/i.test(msg)) {
    return "Local MongoDB is not running. Start the 'MongoDB Server' service, or point MONGO_URI to Atlas.";
  }
  return "See the error above.";
}

/**
 * Connect, and keep retrying every 10 s until connected.
 * onConnected runs once, the first time the connection succeeds.
 */
function connectWithRetry(uri, onConnected) {
  let attempt = 0;
  let triedPublicDns = false;
  let started = false;

  const tryOnce = async () => {
    attempt += 1;
    try {
      const target = await resolveMongoUri(uri); // MONGO_URI=local starts the built-in database
      await mongoose.connect(target, { serverSelectionTimeoutMS: 15000 });
      console.log(`MongoDB connected successfully (${isLocalMode(uri) ? "local database" : "online database"})`);
      if (!started) {
        started = true;
        onConnected && onConnected();
      }
    } catch (err) {
      console.error(`DB Connection Error (attempt ${attempt}): ${err.message}`);
      console.error(`  Why: ${explain(err, uri)}`);
      if (!triedPublicDns && !isLocalMode(uri) && /querySrv|ENOTFOUND|EREFUSED|ETIMEOUT|ECONNREFUSED/i.test(err.message)) {
        triedPublicDns = true;
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        console.warn("  Switched DNS to 8.8.8.8 / 1.1.1.1 and retrying now.");
        return setImmediate(tryOnce);
      }
      console.warn(`  Retrying in ${RETRY_MS / 1000} s. The API and Pooling Lab stay up meanwhile.`);
      setTimeout(tryOnce, RETRY_MS);
    }
  };

  if (isLocalMode(uri)) console.log("[db] MONGO_URI is 'local': using the built-in local database.");
  tryOnce();
}

/** Express middleware: answer 503 with a clear message while the database is down. */
function requireDb(req, res, next) {
  if (mongoose.connection.readyState === 1) return next();
  res.status(503).json({
    message: "Database not connected yet. Check the RideWave Backend window (or backend/logs/server.log).",
  });
}

module.exports = { connectWithRetry, requireDb, explain };
