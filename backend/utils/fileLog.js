/**
 * Mirrors console output into backend/logs/server.log (git-ignored), so a startup
 * problem can be read after the server window is closed. Keeps the file small by
 * starting fresh when it grows past 1 MB.
 */
const fs = require("fs");
const path = require("path");
const util = require("util");

function startFileLog() {
  if (process.env.NODE_ENV === "test" || process.env.FILE_LOG === "off") return;
  try {
    const dir = path.join(__dirname, "..", "logs");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "server.log");
    if (fs.existsSync(file) && fs.statSync(file).size > 1024 * 1024) fs.writeFileSync(file, "");
    const stream = fs.createWriteStream(file, { flags: "a" });
    stream.on("error", () => {}); // logging must never crash the server
    stream.write(`\n===== ${new Date().toISOString()} server start (pid ${process.pid}) =====\n`);
    for (const level of ["log", "info", "warn", "error"]) {
      const original = console[level].bind(console);
      console[level] = (...args) => {
        original(...args);
        stream.write(`[${level}] ${util.format(...args)}\n`);
      };
    }
  } catch {
    /* no file log, console still works */
  }
}

module.exports = { startFileLog };
