/**
 * Wraps async route handlers to eliminate repetitive try/catch blocks.
 * Passes any error to Express's next() for centralized handling.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  module.exports = asyncHandler;