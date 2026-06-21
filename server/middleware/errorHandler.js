/**
 * Async error handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

const globalErrorHandler = (err, req, res, next) => {
  console.error("GLOBAL ERROR HANDLER TRIGGERED:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Send the full error to the frontend so we can see it
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: `DEBUG: ${err.message || message} | Stack: ${err.stack}`,
    stack: err.stack,
  });
};

module.exports = { globalErrorHandler, asyncHandler };
