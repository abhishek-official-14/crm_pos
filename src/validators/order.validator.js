const { body } = require('express-validator');

const createOrderValidator = [
  body('customer').isMongoId().withMessage('Valid customer id is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one order item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product id is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

module.exports = { createOrderValidator };
