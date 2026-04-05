/**
 * Centralized error handling middleware.
 * Keeps response shape predictable for frontend and clients.
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const response = {
    success: false,
    message: err.message || 'Internal server error'
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
