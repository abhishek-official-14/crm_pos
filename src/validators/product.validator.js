const { body } = require('express-validator');

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative')
];

module.exports = { createProductValidator };
