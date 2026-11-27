/**
 * Shared error handling. Controllers can either respond themselves (existing style)
 * or call next(err) / throw inside an async handler; both end up in a consistent
 * JSON shape: { message, details? }.
 */
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // Common Mongoose errors turned into client errors
  if (err.name === "CastError") { status = 400; message = `Invalid ${err.path}`; }
  if (err.name === "ValidationError") { status = 400; }
  if (err.code === 11000) { status = 409; message = "A record with this value already exists"; }

  if (status >= 500) console.error("[Error]", req.method, req.originalUrl, err);
  const body = { message };
  if (err.details) body.details = err.details;
  if (process.env.NODE_ENV !== "production" && status >= 500) body.stack = err.stack;
  res.status(status).json(body);
};

// Wrap an async route handler so thrown errors reach errorHandler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ApiError, notFound, errorHandler, asyncHandler };
