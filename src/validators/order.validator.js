const { body } = require('express-validator');

const createOrderValidator = [
  body('customer').isMongoId().withMessage('Valid customer id is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one order item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product id is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('gstRate').optional().isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100')
];

module.exports = { createOrderValidator };
