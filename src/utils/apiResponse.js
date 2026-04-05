/**
 * Standardized API response format for consistency across all endpoints.
 */

const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
    const response = { status: 'success', message };
    if (data !== null) response.data = data;
    if (meta !== null) response.meta = meta;
    return res.status(statusCode).json(response);
  };
  
  const sendError = (res, statusCode, message, errors = null) => {
    const response = { status: 'fail', message };
    if (errors !== null) response.errors = errors;
    return res.status(statusCode).json(response);
  };
  
  module.exports = { sendSuccess, sendError };