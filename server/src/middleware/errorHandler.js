const config = require('../config/env');

function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle specific MySQL error codes
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'A duplicate record already exists with these details.'
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      success: false,
      error: 'Database connection currently unavailable. Please verify MySQL service and credentials.'
    });
  }

  // Handle invalid JSON payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload received.'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const response = {
    success: false,
    error: err.message || 'An unexpected internal server error occurred.'
  };

  // Only expose stack trace in non-production
  if (config.nodeEnv !== 'production') {
    response.stack = err.stack;
    if (err.details) response.details = err.details;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
