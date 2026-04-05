const { body } = require('express-validator');

const createCustomerValidator = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('phone').optional().isString()
];

module.exports = { createCustomerValidator };
