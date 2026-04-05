const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  setupSecret: process.env.SETUP_SECRET || '',
  maxSearchLength: Number(process.env.MAX_SEARCH_LENGTH || 64)
};

module.exports = env;
