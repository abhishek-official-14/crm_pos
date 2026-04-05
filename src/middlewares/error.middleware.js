const env = require('../config/env');

/**
 * Centralized error handling middleware.
 * Keeps response shape predictable for frontend and clients.
 */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON body'
    });
  }

  const status = err.status || 500;
  const response = {
    success: false,
    message: err.message || 'Internal server error'
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (env.nodeEnv !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  return res.status(status).json(response);
};

module.exports = errorHandler;
