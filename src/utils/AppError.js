/**
 * Custom error class that carries an HTTP status code.
 * Distinguishes operational (expected) errors from programming bugs.
 */
class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
  
      this.statusCode = statusCode;
      this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
      this.isOperational = true; // Marks this as a known, expected error
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = AppError;