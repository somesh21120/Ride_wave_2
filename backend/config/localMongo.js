/**
 * Local database mode: MONGO_URI=local (or empty).
 *
 * Runs a private MongoDB server from inside the backend, so the project works on any
 * computer with only Node.js installed: no MongoDB install, no online account.
 * - The MongoDB program is downloaded once (about 70 MB) into the user's cache folder
 *   on the first run; after that it works offline.
 * - Data is kept in backend/.localdb (git-ignored), so rides and users survive restarts.
 * - Port 27018, so it never clashes with a MongoDB service on the usual 27017.
 *
 * For hosting (Render, a phone demo) use a real MongoDB Atlas URI instead.
 */
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const LOCAL_PORT = Number(process.env.LOCAL_DB_PORT) || 27018;
const LOCAL_DB_NAME = "ridewave";
const LOCAL_DB_PATH = path.join(__dirname, "..", ".localdb");

let server = null; // MongoMemoryServer instance started by this process

const isLocalMode = (uri) => !uri || String(uri).trim().toLowerCase() === "local";

const localUri = () => `mongodb://127.0.0.1:${LOCAL_PORT}/${LOCAL_DB_NAME}`;

/** True if a MongoDB already answers on the local port (e.g. started by an earlier run). */
async function alreadyRunning() {
  const conn = mongoose.createConnection(localUri(), { serverSelectionTimeoutMS: 1500 });
  try {
    await conn.asPromise();
    return true;
  } catch {
    return false;
  } finally {
    await conn.close().catch(() => {});
  }
}

async function startLocalServer() {
  if (server) return localUri();
  if (await alreadyRunning()) {
    console.log(`[db] Local database already running on port ${LOCAL_PORT}, reusing it.`);
    return localUri();
  }
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require("mongodb-memory-server-core"));
  } catch {
    throw new Error(
      "Local database package missing. Run RIDEWAVE_TOOLS.bat option 8 (Reinstall packages), or 'npm install' in the backend folder."
    );
  }
  fs.mkdirSync(LOCAL_DB_PATH, { recursive: true });
  console.log("[db] Starting the local database (first run downloads MongoDB, about 70 MB, please wait)...");
  server = await MongoMemoryServer.create({
    instance: { port: LOCAL_PORT, dbPath: LOCAL_DB_PATH, storageEngine: "wiredTiger" },
  });
  console.log(`[db] Local database running on port ${LOCAL_PORT}, data in backend/.localdb`);
  const stop = () => {
    if (server) server.stop({ doCleanup: false, force: false }).catch(() => {});
  };
  process.once("SIGINT", () => { stop(); process.exit(0); });
  process.once("SIGTERM", () => { stop(); process.exit(0); });
  return localUri();
}

/** Returns the connection string to use: Atlas/other URIs unchanged, local mode starts the server. */
async function resolveMongoUri(uri) {
  if (!isLocalMode(uri)) return uri;
  return startLocalServer();
}

module.exports = { resolveMongoUri, isLocalMode, localUri, LOCAL_PORT, LOCAL_DB_PATH };
