const { validationResult } = require('express-validator');
const createHttpError = require('http-errors');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(createHttpError(400, 'Validation failed', { errors: errors.array() }));
  }
  return next();
};

module.exports = validate;
