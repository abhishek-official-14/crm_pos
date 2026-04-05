const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');
const env = require('../config/env');
const User = require('../models/user.model');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(createHttpError(401, 'Authentication token missing'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.id).populate('role');

    if (!user || !user.isActive) {
      return next(createHttpError(401, 'User not found or inactive'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(createHttpError(401, 'Invalid or expired token'));
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  const roleName = req.user?.role?.name;

  if (!roleName || !allowedRoles.includes(roleName)) {
    return next(createHttpError(403, 'Forbidden: insufficient permissions'));
  }

  return next();
};

module.exports = { authenticate, authorize };
