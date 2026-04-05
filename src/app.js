const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const createHttpError = require('http-errors');
const routes = require('./routes');
const apiRateLimiter = require('./middlewares/rateLimit.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Security middleware.
app.use(helmet());
app.use(cors());

// Request parsing middleware.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging + abuse protection.
app.use(morgan('dev'));
app.use('/api', apiRateLimiter);

// API routes.
app.use('/api', routes);

// 404 handler for unknown routes.
app.use((req, res, next) => {
  next(createHttpError(404, `Route not found: ${req.originalUrl}`));
});

app.use(errorHandler);

module.exports = app;
